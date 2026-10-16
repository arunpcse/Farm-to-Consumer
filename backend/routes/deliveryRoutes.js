const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');

// GET /api/deliveries/assigned - Get assigned deliveries for delivery partner
router.get('/assigned', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_partner' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Delivery partner role required.' });
    }

    const deliveries = await Delivery.find({ deliveryPartnerId: req.user.id || req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ deliveries });
  } catch (err) {
    console.error('[deliveryRoutes] GET /assigned error:', err);
    res.status(500).json({ message: 'Failed to fetch deliveries', error: err.message });
  }
});

// GET /api/deliveries/:id - Get delivery details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id).lean();
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found.' });
    }

    // Check authorization
    const userId = req.user.id || req.user._id;
    const order = await Order.findById(delivery.orderId);
    
    if (delivery.deliveryPartnerId.toString() !== userId.toString() && 
        order?.userId.toString() !== userId.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ delivery });
  } catch (err) {
    console.error('[deliveryRoutes] GET /:id error:', err);
    res.status(500).json({ message: 'Failed to fetch delivery', error: err.message });
  }
});

// PATCH /api/deliveries/:id/status - Update delivery status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found.' });
    }

    // Check authorization: only assigned delivery partner or admin can update status
    const userId = req.user.id || req.user._id;
    if (delivery.deliveryPartnerId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only the assigned delivery partner can update status.' });
    }

    const { status, notes } = req.body;
    const allowedStatuses = ['assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid delivery status. Allowed statuses: ${allowedStatuses.join(', ')}` 
      });
    }

    const updates = { status };

    if (status === 'picked_up') {
      updates.pickupTime = new Date();
    } else if (status === 'out_for_delivery' || status === 'in_transit') {
      updates.pickupTime = updates.pickupTime || new Date();
    } else if (status === 'delivered') {
      updates.actualDeliveryTime = new Date();
    }

    if (notes) updates.notes = notes;

    const updated = await Delivery.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    // Map delivery status to Order model's permitted orderStatus enum values
    const statusMap = {
      'picked_up': 'Shipped',
      'in_transit': 'Shipped',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered'
    };

    const targetOrderStatus = statusMap[status];

    if (targetOrderStatus && delivery.orderId) {
      // Find the corresponding order by orderId string or ObjectId
      const order = await Order.findOne({
        $or: [
          { orderId: delivery.orderId },
          ...(mongoose.Types.ObjectId.isValid(delivery.orderId) ? [{ _id: delivery.orderId }] : [])
        ]
      });

      if (order) {
        order.orderStatus = targetOrderStatus;
        if (targetOrderStatus === 'Delivered') {
          order.deliveredAt = new Date();
          if (order.paymentMethod === 'Cash on Delivery' && order.paymentStatus === 'Pending') {
            order.paymentStatus = 'Paid';
            await Payment.updateOne({ transactionId: order.transactionId }, { status: 'Completed' });
          }
        }

        order.statusTimeline.push({
          status: targetOrderStatus,
          timestamp: new Date(),
          note: notes || `Order ${targetOrderStatus.toLowerCase()} by fleet partner (${delivery.deliveryPartnerName || 'Assigned Driver'}).`
        });

        await order.save();

        // Step 4: Dispatch notification to customer
        if (order.userId && order.userId !== 'guest') {
          Notification.create({
            userId: order.userId,
            title: `Order ${targetOrderStatus}`,
            message: `Your order #${order.orderId} is now ${targetOrderStatus}. Driver notes: "${notes || 'In transit'}".`,
            type: status === 'delivered' ? 'delivery' : 'dispatch',
            link: '/orders'
          }).catch(e => console.warn('Customer delivery notification warning:', e.message));
        }
      }
    }

    res.json({ message: 'Delivery status updated successfully.', delivery: updated });
  } catch (err) {
    console.error('[deliveryRoutes] PATCH /:id/status error:', err);
    res.status(500).json({ message: 'Failed to update delivery status', error: err.message });
  }
});

// POST /api/deliveries - Create delivery assignment (admin/farmer)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Access denied. Admin or farmer role required.' });
    }

    const {
      orderId,
      deliveryPartnerId,
      pickupAddress,
      deliveryAddress,
      recipientName,
      recipientPhone,
      estimatedDeliveryTime,
      notes
    } = req.body;

    // Get delivery partner details
    const User = require('../models/User');
    const partner = await User.findById(deliveryPartnerId);
    if (!partner || partner.role !== 'delivery_partner') {
      return res.status(404).json({ message: 'Delivery partner not found.' });
    }

    const delivery = new Delivery({
      orderId,
      deliveryPartnerId,
      deliveryPartnerName: partner.name,
      pickupAddress,
      deliveryAddress,
      recipientName,
      recipientPhone,
      estimatedDeliveryTime,
      notes,
      status: 'assigned'
    });

    await delivery.save();
    res.status(201).json({ message: 'Delivery assigned successfully.', delivery });
  } catch (err) {
    console.error('[deliveryRoutes] POST / error:', err);
    res.status(500).json({ message: 'Failed to assign delivery', error: err.message });
  }
});

// GET /api/deliveries/track/order/:orderId - Track delivery for an order (buyer / public tracking)
router.get('/track/order/:orderId', async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ orderId: req.params.orderId }).lean();
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery tracking information not yet assigned for this order.' });
    }
    res.json({ delivery });
  } catch (err) {
    console.error('[deliveryRoutes] GET /track/order/:orderId error:', err);
    res.status(500).json({ message: 'Failed to fetch delivery tracking', error: err.message });
  }
});

// GET /api/deliveries/all - List all deliveries (Admin / logistics manager)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const deliveries = await Delivery.find().sort({ createdAt: -1 }).lean();
    res.json({ deliveries });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch all deliveries', error: err.message });
  }
});

module.exports = router;
