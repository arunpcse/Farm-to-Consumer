const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Farmer = require('../models/Farmer');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET } = require('../middleware/auth');
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'freshharvest_secret_key_123';

// Demo orders for fallback when MongoDB is not available
const DEMO_ORDERS = [
  {
    orderId: 'FH-ORD-54321',
    userId: 'guest',
    customerName: 'R. Kumar',
    customerEmail: 'kumar@example.com',
    customerPhone: '9876543210',
    shippingAddress: {
      street: '123 Gandhi Street',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      zipCode: '641001',
      label: 'Home'
    },
    items: [
      {
        productId: 'demo-1',
        name: 'Fresh Organic Farm Tomatoes',
        price: 38,
        quantity: 2,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
        farmerName: 'Ramasamy Farms'
      },
      {
        productId: 'demo-5',
        name: 'Fresh Crisp Country Spinach (Palak)',
        price: 25,
        quantity: 3,
        unit: 'bunch',
        image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80',
        farmerName: 'Greenfield Agri Co-op'
      }
    ],
    subtotal: 151,
    deliveryFee: 0,
    tax: 8,
    totalAmount: 159,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    transactionId: 'TXN-FH-456789',
    orderStatus: 'Out for Delivery',
    statusTimeline: [
      { status: 'Placed', timestamp: new Date('2024-10-12T09:00:00'), note: 'Order placed successfully via UPI' },
      { status: 'Packed', timestamp: new Date('2024-10-12T14:00:00'), note: 'Packed at farm' },
      { status: 'Shipped', timestamp: new Date('2024-10-13T08:00:00'), note: 'Dispatched from farm' },
      { status: 'Out for Delivery', timestamp: new Date('2024-10-13T09:30:00'), note: 'Out for delivery' }
    ],
    estimatedDelivery: new Date('2024-10-14T10:00:00'),
    deliveredAt: null,
    createdAt: new Date('2024-10-12T09:00:00')
  },
  {
    orderId: 'FH-ORD-12345',
    userId: 'guest',
    customerName: 'S. Priya',
    customerEmail: 'priya@example.com',
    customerPhone: '9876543211',
    shippingAddress: {
      street: '456 Nehru Road',
      city: 'Erode',
      state: 'Tamil Nadu',
      zipCode: '638001',
      label: 'Home'
    },
    items: [
      {
        productId: 'demo-2',
        name: 'Hilltop Cavendish Bananas',
        price: 55,
        quantity: 2,
        unit: 'dozen',
        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
        farmerName: 'Kaveri Valley Orchards'
      },
      {
        productId: 'demo-4',
        name: 'Pure Desi A2 Cow Milk',
        price: 70,
        quantity: 5,
        unit: 'litre',
        image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80',
        farmerName: 'Kangayam Indigenous Dairy'
      }
    ],
    subtotal: 460,
    deliveryFee: 0,
    tax: 23,
    totalAmount: 483,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    transactionId: 'TXN-FH-123456',
    orderStatus: 'Placed',
    statusTimeline: [
      { status: 'Placed', timestamp: new Date('2024-10-13T11:00:00'), note: 'Order placed successfully via Cash on Delivery' }
    ],
    estimatedDelivery: new Date('2024-10-14T10:00:00'),
    deliveredAt: null,
    createdAt: new Date('2024-10-13T11:00:00')
  },
  {
    orderId: 'FH-ORD-98765',
    userId: 'guest',
    customerName: 'M. Anand',
    customerEmail: 'anand@example.com',
    customerPhone: '9876543212',
    shippingAddress: {
      street: '789 Anna Salai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      zipCode: '600001',
      label: 'Office'
    },
    items: [
      {
        productId: 'demo-3',
        name: 'Traditional Brown Ponni Rice',
        price: 85,
        quantity: 10,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
        farmerName: 'Thirunavukkarasu Naturals'
      }
    ],
    subtotal: 850,
    deliveryFee: 0,
    tax: 43,
    totalAmount: 893,
    paymentMethod: 'Credit/Debit Card',
    paymentStatus: 'Paid',
    transactionId: 'TXN-FH-789012',
    orderStatus: 'Delivered',
    statusTimeline: [
      { status: 'Placed', timestamp: new Date('2024-10-10T10:00:00'), note: 'Order placed successfully via Credit/Debit Card' },
      { status: 'Packed', timestamp: new Date('2024-10-10T15:00:00'), note: 'Packed at farm' },
      { status: 'Shipped', timestamp: new Date('2024-10-11T08:00:00'), note: 'Dispatched from farm' },
      { status: 'Out for Delivery', timestamp: new Date('2024-10-11T10:00:00'), note: 'Out for delivery' },
      { status: 'Delivered', timestamp: new Date('2024-10-11T14:30:00'), note: 'Delivery verified and completed by recipient.' }
    ],
    estimatedDelivery: new Date('2024-10-11T10:00:00'),
    deliveredAt: new Date('2024-10-11T14:30:00'),
    createdAt: new Date('2024-10-10T10:00:00')
  }
];

// Optional auth helper: retrieves user info if token is provided
function getOptionalUser(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }
  return null;
}

// Helper to generate IDs
function generateOrderId() {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `FH-ORD-${num}`;
}

function generateTxnId() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `TXN-FH-${num}`;
}

// -------------------------------------------------------------
// POST /api/orders (Place Order & Confirm Order)
// -------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      paymentMethod,
      paymentDetails,
      deliveryInstructions
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart items are required to place an order.' });
    }

    if (!customerName || !customerPhone || !shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ message: 'Recipient name, phone, and complete shipping address are required.' });
    }

    const validPaymentMethods = ['UPI', 'Credit/Debit Card', 'Net Banking', 'Cash on Delivery'];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Please select a valid payment method.' });
    }

    const user = getOptionalUser(req);
    const userId = user ? user.id : (req.body.userId || 'guest');
    const email = customerEmail || (user ? user.email : 'customer@freshharvest.in');
    const isDbConnected = mongoose.connection.readyState === 1;

    // Phase 4: Idempotency Protection - Prevent duplicate orders on repeated network requests
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
    if (idempotencyKey && isDbConnected) {
      const existingOrder = await Order.findOne({ idempotencyKey });
      if (existingOrder) {
        const existingPayment = await Payment.findOne({ orderId: existingOrder.orderId });
        return res.status(200).json({
          message: 'Order retrieved via idempotency key (duplicate replay prevented).',
          order: existingOrder,
          payment: existingPayment,
          isDuplicateReplay: true
        });
      }
    }

    // Rule A: Authenticate true product prices & stock availability from database
    const validatedItems = [];
    const stockDeductionsToApply = [];

    for (const it of items) {
      const quantity = Math.max(1, Number(it.quantity) || 1);
      const rawId = it.productId || it._id || it.id;
      let dbProduct = null;

      if (isDbConnected && rawId) {
        if (mongoose.Types.ObjectId.isValid(rawId)) {
          dbProduct = await Product.findById(rawId);
        } else {
          dbProduct = await Product.findOne({ $or: [{ _id: rawId }, { name: it.name }] });
        }
      }

      if (dbProduct) {
        // Status verification
        if (dbProduct.status === 'inactive') {
          return res.status(400).json({
            message: `"${dbProduct.name}" is currently inactive and cannot be ordered.`
          });
        }

        // Minimum order quantity check
        if (dbProduct.minimumOrderQuantity && quantity < dbProduct.minimumOrderQuantity) {
          return res.status(400).json({
            message: `Minimum order quantity for "${dbProduct.name}" is ${dbProduct.minimumOrderQuantity} ${dbProduct.unit || 'kg'}.`
          });
        }

        // Surplus offer validity check
        if (it.surplusId || it.isSurplus) {
          const SurplusListing = require('../models/SurplusListing');
          let surplusListing = null;
          if (it.surplusId && mongoose.Types.ObjectId.isValid(it.surplusId)) {
            surplusListing = await SurplusListing.findById(it.surplusId);
          } else {
            surplusListing = await SurplusListing.findOne({ productId: dbProduct._id });
          }

          if (surplusListing) {
            if (surplusListing.status !== 'active' || new Date() > new Date(surplusListing.offerEndDate)) {
              return res.status(400).json({
                message: `Surplus flash offer for "${dbProduct.name}" has expired and cannot be ordered.`
              });
            }
            if (surplusListing.availableQuantity < quantity) {
              return res.status(400).json({
                message: `Only ${surplusListing.availableQuantity} ${dbProduct.unit || 'kg'} available for surplus offer "${dbProduct.name}".`
              });
            }
          }
        }

        // Stock verification (Rule C)
        if (dbProduct.stock < quantity) {
          return res.status(400).json({
            message: `Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stock} ${dbProduct.unit || 'kg'} available.`
          });
        }

        // Dynamic price calculation: Batch / Volume Pricing or Surplus Price
        let trustedPrice = Number(dbProduct.price);
        if ((it.surplusId || it.isSurplus) && dbProduct.isSurplus && dbProduct.surplusPrice) {
          trustedPrice = Number(dbProduct.surplusPrice);
        } else if (Array.isArray(dbProduct.batchPricing) && dbProduct.batchPricing.length > 0) {
          const matchedTiers = dbProduct.batchPricing
            .filter(t => quantity >= t.minQuantity)
            .sort((a, b) => b.minQuantity - a.minQuantity);
          if (matchedTiers.length > 0) {
            const bestTier = matchedTiers[0];
            if (bestTier.pricePerUnit !== undefined && bestTier.pricePerUnit > 0) {
              trustedPrice = Number(bestTier.pricePerUnit);
            } else if (bestTier.discountPercentage > 0) {
              trustedPrice = Number((dbProduct.price * (1 - bestTier.discountPercentage / 100)).toFixed(2));
            }
          }
        }

        validatedItems.push({
          productId: dbProduct._id.toString(),
          name: dbProduct.name,
          price: trustedPrice, // Trusted price from MongoDB (with batch or surplus pricing)
          quantity,
          unit: dbProduct.unit || it.unit || 'kg',
          image: dbProduct.image || it.image || '',
          farmerId: dbProduct.farmerId ? dbProduct.farmerId.toString() : (it.farmerId || ''),
          farmerName: dbProduct.farmerName || it.farmerName || 'Local Organic Farmer'
        });

        stockDeductionsToApply.push({
          productId: dbProduct._id,
          quantity,
          surplusId: it.surplusId || null
        });
      } else {
        // Fallback for demo/in-memory mode if product is not in database
        const trustedPrice = Number(it.price) || 0;
        validatedItems.push({
          productId: rawId || 'demo-prod',
          name: it.name || 'Organic Produce',
          price: trustedPrice,
          quantity,
          unit: it.unit || 'kg',
          image: it.image || '',
          farmerId: it.farmerId || '',
          farmerName: it.farmerName || 'Local Organic Farmer'
        });
      }
    }

    // Calculate totals securely using verified prices
    const subtotal = validatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = subtotal >= 300 ? 0 : 40;
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const totalAmount = subtotal + deliveryFee + tax;

    // Rule C: Concurrency-safe atomic stock deduction
    if (isDbConnected && stockDeductionsToApply.length > 0) {
      for (const deduction of stockDeductionsToApply) {
        const updated = await Product.findOneAndUpdate(
          { _id: deduction.productId, stock: { $gte: deduction.quantity } },
          { $inc: { stock: -deduction.quantity } },
          { new: true }
        );

        if (!updated) {
          return res.status(409).json({
            message: 'Stock concurrency conflict: Another customer just purchased the remaining available stock. Please review your cart.'
          });
        }

        if (updated.stock === 0) {
          await Product.updateOne({ _id: updated._id }, { status: 'out_of_stock' });
        }

        if (deduction.surplusId) {
          const SurplusListing = require('../models/SurplusListing');
          await SurplusListing.updateOne(
            { _id: deduction.surplusId, availableQuantity: { $gte: deduction.quantity } },
            { $inc: { availableQuantity: -deduction.quantity } }
          );
        }
      }
    }

    const orderId = generateOrderId();
    const transactionId = generateTxnId();
    const isCod = paymentMethod === 'Cash on Delivery';

    // Phase 4: Cryptographic signature verification if credentials provided
    let isCryptographicallyVerified = false;
    let verifiedPaymentId = null;
    let verifiedSignature = null;

    if (!isCod && paymentDetails && paymentDetails.razorpay_payment_id && paymentDetails.razorpay_signature && paymentDetails.razorpay_order_id) {
      const body = `${paymentDetails.razorpay_order_id}|${paymentDetails.razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== paymentDetails.razorpay_signature) {
        return res.status(400).json({
          message: 'Cryptographic payment signature mismatch. Payment rejected.'
        });
      }
      isCryptographicallyVerified = true;
      verifiedPaymentId = paymentDetails.razorpay_payment_id;
      verifiedSignature = paymentDetails.razorpay_signature;
    }

    // Never mark an online payment as Paid based purely on frontend response.
    // It remains Pending until backend HMAC-SHA256 verification is confirmed.
    const paymentStatus = isCryptographicallyVerified ? 'Paid' : 'Pending';
    const paymentRecordStatus = isCryptographicallyVerified ? 'Completed' : 'Pending';

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);
    estimatedDelivery.setHours(10, 0, 0, 0);

    const initialTimeline = [
      {
        status: 'Placed',
        timestamp: new Date(),
        note: isCryptographicallyVerified
          ? `Order placed and payment cryptographically verified via ${paymentMethod}`
          : `Order placed via ${paymentMethod} (payment status: ${paymentStatus})`
      }
    ];

    const order = new Order({
      orderId,
      idempotencyKey: idempotencyKey || null,
      userId,
      customerName: customerName.trim(),
      customerEmail: email.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      shippingAddress: {
        street: shippingAddress.street.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state ? shippingAddress.state.trim() : 'Tamil Nadu',
        zipCode: shippingAddress.zipCode ? shippingAddress.zipCode.trim() : '638052',
        label: shippingAddress.label || 'Home'
      },
      items: validatedItems,
      subtotal,
      deliveryFee,
      tax,
      totalAmount,
      paymentMethod,
      paymentStatus,
      transactionId,
      orderStatus: 'Placed',
      statusTimeline: initialTimeline,
      estimatedDelivery
    });

    if (isDbConnected) {
      await order.save();
    }

    const gatewayOrderId = isCod ? undefined : ('order_rzp_test_' + crypto.randomBytes(6).toString('hex'));

    // Create Payment Record
    const payment = new Payment({
      transactionId,
      orderId,
      userId,
      customerName: customerName.trim(),
      customerEmail: email.trim().toLowerCase(),
      amount: totalAmount,
      paymentMethod,
      paymentDetails: paymentDetails || {},
      status: paymentRecordStatus,
      gatewayOrderId,
      razorpayPaymentId: verifiedPaymentId,
      razorpaySignature: verifiedSignature,
      gatewayReference: isCryptographicallyVerified ? verifiedPaymentId : (isCod ? undefined : `RZP_MOCK_${Math.floor(Math.random() * 1000000)}`)
    });

    if (isDbConnected) {
      await payment.save();
    }

    // Step 4: Event-driven notifications
    if (isDbConnected) {
      // 1. Notify Customer
      if (userId && userId !== 'guest') {
        Notification.create({
          userId,
          title: 'Order Confirmed',
          message: `Your order #${orderId} of ₹${totalAmount} has been placed successfully via ${paymentMethod}.`,
          type: 'order_status',
          link: '/orders'
        }).catch(e => console.warn('Customer notification failed:', e.message));
      }

      // 2. Notify Farmers
      const notifiedFarmers = new Set();
      for (const it of validatedItems) {
        if (it.farmerId && !notifiedFarmers.has(it.farmerId)) {
          notifiedFarmers.add(it.farmerId);
          Farmer.findById(it.farmerId).then(f => {
            if (f && f.userId) {
              Notification.create({
                userId: f.userId,
                title: 'New Order Received',
                message: `Order #${orderId} contains your produce (${it.quantity} ${it.unit} of ${it.name}).`,
                type: 'order_status',
                link: '/farmer-dashboard'
              }).catch(e => console.warn('Farmer notification failed:', e.message));
            }
          }).catch(() => {});
        }
      }
    }

    res.status(201).json({
      message: 'Order placed successfully!',
      order,
      payment
    });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ message: 'Failed to place order', error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/orders (View Orders List)
// -------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning demo orders');
      return res.json({ orders: DEMO_ORDERS });
    }

    const user = getOptionalUser(req);
    const filter = {};

    if (req.query.userId) {
      filter.userId = req.query.userId;
    } else if (user) {
      filter.$or = [{ userId: user.id }, { customerEmail: user.email }];
    } else if (req.query.email) {
      filter.customerEmail = req.query.email.toLowerCase();
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json({ orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    // Return demo orders on error
    return res.json({ orders: DEMO_ORDERS });
  }
});

// -------------------------------------------------------------
// GET /api/orders/:orderId (View Single Order Details)
// -------------------------------------------------------------
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    res.json({ order });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: 'Failed to fetch order', error: err.message });
  }
});

// -------------------------------------------------------------
// PATCH /api/orders/:orderId/status (Confirm Delivery / Advance Status)
// -------------------------------------------------------------
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot update status of a cancelled order.' });
    }

    const validStatuses = ['Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order delivery status.' });
    }

    order.orderStatus = status;
    if (status === 'Delivered') {
      order.deliveredAt = new Date();
      if (order.paymentMethod === 'Cash on Delivery' && order.paymentStatus === 'Pending') {
        order.paymentStatus = 'Paid';
        await Payment.updateOne({ transactionId: order.transactionId }, { status: 'Completed' });
      }
    }

    order.statusTimeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`
    });

    await order.save();

    // Trigger notification to customer
    if (order.userId && order.userId !== 'guest' && mongoose.connection.readyState === 1) {
      Notification.create({
        userId: order.userId,
        title: `Order Status: ${status}`,
        message: `Your order #${order.orderId} status is now: ${status}.`,
        type: 'order_status',
        link: '/orders'
      }).catch(e => console.warn('Customer status notification error:', e.message));
    }

    res.json({ message: `Order status updated to ${status}`, order });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Failed to update order status', error: err.message });
  }
});

// -------------------------------------------------------------
// PATCH /api/orders/:orderId/cancel (Cancel Order & Restore Stock)
// -------------------------------------------------------------
router.patch('/:orderId/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.orderStatus === 'Delivered') {
      return res.status(400).json({ message: 'Delivered orders cannot be cancelled.' });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled.' });
    }

    // Restore stock safely for each item in the cancelled order
    if (mongoose.connection.readyState === 1 && order.items && order.items.length > 0) {
      for (const it of order.items) {
        if (it.productId) {
          if (mongoose.Types.ObjectId.isValid(it.productId)) {
            await Product.findByIdAndUpdate(it.productId, {
              $inc: { stock: it.quantity },
              $set: { status: 'active' }
            }).catch(e => console.warn('Stock restoration warning:', e.message));
          } else if (it.name) {
            await Product.updateOne(
              { name: it.name },
              { $inc: { stock: it.quantity }, $set: { status: 'active' } }
            ).catch(e => console.warn('Stock restoration warning:', e.message));
          }
        }
      }
    }

    order.orderStatus = 'Cancelled';
    order.cancellationReason = reason || 'Cancelled by customer';
    if (order.paymentStatus === 'Paid') {
      order.paymentStatus = 'Refund Initiated';
      await Payment.updateOne({ transactionId: order.transactionId }, { status: 'Refunded' });
    } else {
      order.paymentStatus = 'Cancelled';
      await Payment.updateOne({ transactionId: order.transactionId }, { status: 'Failed' });
    }

    order.statusTimeline.push({
      status: 'Cancelled',
      timestamp: new Date(),
      note: `Order cancelled. Reason: ${order.cancellationReason}. Stock restored.`
    });

    await order.save();

    // Trigger cancellation notification for customer
    if (order.userId && order.userId !== 'guest' && mongoose.connection.readyState === 1) {
      Notification.create({
        userId: order.userId,
        title: 'Order Cancelled',
        message: `Your order #${order.orderId} was cancelled. Any pre-paid charges have a refund initiated.`,
        type: 'order_status',
        link: '/orders'
      }).catch(e => console.warn('Customer cancel notification error:', e.message));
    }

    res.json({ message: 'Order cancelled successfully and stock restored', order });
  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({ message: 'Failed to cancel order', error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/payments/history (View Payment History)
// -------------------------------------------------------------
router.get(['/history', '/payments/history'], async (req, res) => {
  try {
    const user = getOptionalUser(req);
    const filter = {};

    if (req.query.userId) {
      filter.userId = req.query.userId;
    } else if (user) {
      filter.$or = [{ userId: user.id }, { customerEmail: user.email }];
    } else if (req.query.email) {
      filter.customerEmail = req.query.email.toLowerCase();
    }

    const payments = await Payment.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json({ payments });
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ message: 'Failed to fetch payments', error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/payments/txn/:transactionId (Payment Confirmation Details)
// -------------------------------------------------------------
router.get(['/txn/:transactionId', '/payments/txn/:transactionId'], async (req, res) => {
  try {
    const payment = await Payment.findOne({ transactionId: req.params.transactionId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }
    const order = await Order.findOne({ orderId: payment.orderId });
    res.json({ payment, order });
  } catch (err) {
    console.error('Error fetching payment confirmation:', err);
    res.status(500).json({ message: 'Failed to fetch payment details', error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/payments/create-gateway-order (Sandbox Gateway Order Initialization)
// -------------------------------------------------------------
router.post(['/create-gateway-order', '/payments/create-gateway-order'], async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    if (!amount) {
      return res.status(400).json({ message: 'Order amount is required.' });
    }

    // Step 2 Requirement: Prevent duplicate payment processing if already paid
    if (orderId && mongoose.connection.readyState === 1) {
      const existingOrder = await Order.findOne({ orderId });
      if (existingOrder && existingOrder.paymentStatus === 'Paid') {
        return res.status(400).json({
          message: `Order #${orderId} is already paid. Duplicate payment blocked.`,
          alreadyPaid: true
        });
      }
    }

    const gatewayOrderId = 'order_rzp_test_' + crypto.randomBytes(6).toString('hex');
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_freshharvest123';

    if (orderId && mongoose.connection.readyState === 1) {
      await Payment.updateOne({ orderId }, { $set: { gatewayOrderId } });
    }

    res.json({
      gatewayOrderId,
      key: keyId,
      amount: Math.round(Number(amount) * 100), // amount in paise
      currency: 'INR',
      notes: { orderId: orderId || '' }
    });
  } catch (err) {
    console.error('Error generating gateway order:', err);
    res.status(500).json({ message: 'Failed to create payment order', error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/payments/verify-signature (Cryptographic HMAC-SHA256 Signature Verification)
// -------------------------------------------------------------
router.post(['/verify-signature', '/payments/verify-signature'], async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: 'orderId, razorpay_order_id, razorpay_payment_id, and razorpay_signature are required for verification.'
      });
    }

    // Idempotent duplicate verification check
    if (mongoose.connection.readyState === 1) {
      const existingOrder = await Order.findOne({ orderId });
      if (existingOrder && existingOrder.paymentStatus === 'Paid') {
        return res.status(200).json({
          message: 'Payment already verified for this order (idempotent duplicate request).',
          verified: true,
          order: existingOrder,
          alreadyProcessed: true
        });
      }
    }

    // Cryptographic HMAC-SHA256 verification
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isValidSignature = expectedSignature === razorpay_signature;

    if (!isValidSignature) {
      console.warn(`⚠️ [Security Alert] Signature mismatch for order ${orderId}! Expected: ${expectedSignature}, Received: ${razorpay_signature}`);

      if (mongoose.connection.readyState === 1) {
        // Safe rollback of reserved stock
        const order = await Order.findOne({ orderId });
        if (order && order.items && order.orderStatus !== 'Payment Failed' && order.orderStatus !== 'Cancelled') {
          for (const it of order.items) {
            if (mongoose.Types.ObjectId.isValid(it.productId)) {
              await Product.findByIdAndUpdate(it.productId, { $inc: { stock: it.quantity } });
            } else if (it.name) {
              await Product.updateOne({ name: it.name }, { $inc: { stock: it.quantity } });
            }
          }
          order.orderStatus = 'Payment Failed';
          order.paymentStatus = 'Failed';
          order.statusTimeline.push({
            status: 'Payment Failed',
            timestamp: new Date(),
            note: 'Payment signature verification failed. Reserved produce stock restored.'
          });
          await order.save();
        }

        await Payment.updateOne(
          { orderId },
          { $set: { status: 'Failed', failureReason: 'Cryptographic signature mismatch' } }
        );
      }

      return res.status(400).json({
        message: 'Invalid payment signature. Payment rejected for security and produce stock restored.',
        verified: false
      });
    }

    // Valid Signature: Atomically confirm payment and order
    if (mongoose.connection.readyState === 1) {
      await Payment.updateOne(
        { orderId },
        {
          $set: {
            status: 'Completed',
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            gatewayReference: razorpay_payment_id
          }
        }
      );

      const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        {
          $set: { paymentStatus: 'Paid', orderStatus: 'Placed' },
          $push: {
            statusTimeline: {
              status: 'Payment Verified',
              timestamp: new Date(),
              note: `Online payment verified via Razorpay gateway (${razorpay_payment_id})`
            }
          }
        },
        { new: true }
      );

      return res.status(200).json({
        message: 'Payment verified and confirmed successfully!',
        verified: true,
        order: updatedOrder
      });
    }

    res.status(200).json({ message: 'Payment signature verified (demo mode).', verified: true });
  } catch (err) {
    console.error('Error verifying payment signature:', err);
    res.status(500).json({ message: 'Payment verification failed', error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/payments/fail (Payment Abandonment / Cancellation & Safe Stock Rollback)
// -------------------------------------------------------------
router.post(['/fail', '/payments/fail'], async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required to record payment failure.' });
    }

    const failureReason = reason || 'Customer cancelled payment modal or transaction timed out.';

    if (mongoose.connection.readyState === 1) {
      const order = await Order.findOne({ orderId });
      if (order) {
        // Rollback reserved stock safely if not already refunded
        if (order.items && order.items.length > 0 && order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Payment Failed') {
          for (const it of order.items) {
            if (mongoose.Types.ObjectId.isValid(it.productId)) {
              await Product.findByIdAndUpdate(it.productId, { $inc: { stock: it.quantity } });
            } else if (it.name) {
              await Product.updateOne({ name: it.name }, { $inc: { stock: it.quantity } });
            }
          }
        }

        order.orderStatus = 'Payment Failed';
        order.paymentStatus = 'Failed';
        order.statusTimeline.push({
          status: 'Payment Failed',
          timestamp: new Date(),
          note: `Payment failure recorded: ${failureReason}. Produce stock restored.`
        });
        await order.save();
      }

      await Payment.updateOne(
        { orderId },
        { $set: { status: 'Failed', failureReason } }
      );
    }

    res.status(200).json({
      message: 'Payment failure recorded and reserved stock restored.',
      orderId,
      status: 'Payment Failed'
    });
  } catch (err) {
    console.error('Error handling payment failure:', err);
    res.status(500).json({ message: 'Failed to process payment failure', error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/payments/retry (Safe Retry for Failed Payment & Stock Re-reservation)
// -------------------------------------------------------------
router.post(['/retry', '/payments/retry'], async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required to retry payment.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.json({ message: 'Database pending, retry initiated.' });
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: `Order #${orderId} not found.` });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ message: `Order #${orderId} is already paid.` });
    }

    // Step 2 Requirement: Check produce stock before re-reserving
    for (const it of order.items) {
      let prod = null;
      if (mongoose.Types.ObjectId.isValid(it.productId)) {
        prod = await Product.findById(it.productId);
      } else if (it.name) {
        prod = await Product.findOne({ name: it.name });
      }

      if (prod && prod.stock < it.quantity) {
        return res.status(409).json({
          message: `Cannot retry payment: item "${it.name}" has only ${prod.stock} available (needs ${it.quantity}).`
        });
      }
    }

    // Re-reserve stock atomically
    for (const it of order.items) {
      if (mongoose.Types.ObjectId.isValid(it.productId)) {
        await Product.findOneAndUpdate(
          { _id: it.productId, stock: { $gte: it.quantity } },
          { $inc: { stock: -it.quantity } }
        );
      } else if (it.name) {
        await Product.findOneAndUpdate(
          { name: it.name, stock: { $gte: it.quantity } },
          { $inc: { stock: -it.quantity } }
        );
      }
    }

    const newGatewayOrderId = 'order_rzp_test_' + crypto.randomBytes(6).toString('hex');
    order.orderStatus = 'Placed';
    order.paymentStatus = 'Pending';
    order.statusTimeline.push({
      status: 'Payment Retried',
      timestamp: new Date(),
      note: `Customer initiated payment retry. Gateway order ${newGatewayOrderId} initialized.`
    });
    await order.save();

    await Payment.updateOne(
      { orderId },
      {
        $set: {
          status: 'Pending',
          gatewayOrderId: newGatewayOrderId,
          failureReason: ''
        }
      }
    );

    res.json({
      message: 'Payment retry initiated and stock re-reserved.',
      orderId,
      gatewayOrderId: newGatewayOrderId,
      amount: order.totalAmount,
      currency: 'INR'
    });
  } catch (err) {
    console.error('Error retrying payment:', err);
    res.status(500).json({ message: 'Failed to retry payment', error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/payments/status/:orderId (Payment Status & Reconciliation Details)
// -------------------------------------------------------------
router.get(['/status/:orderId', '/payments/status/:orderId'], async (req, res) => {
  try {
    const { orderId } = req.params;
    if (mongoose.connection.readyState !== 1) {
      return res.json({ orderId, status: 'Completed', simulated: true });
    }

    const payment = await Payment.findOne({ orderId });
    const order = await Order.findOne({ orderId });

    if (!payment && !order) {
      return res.status(404).json({ message: `No payment or order found for ID ${orderId}` });
    }

    res.json({
      orderId,
      paymentStatus: order ? order.paymentStatus : (payment ? payment.status : 'Unknown'),
      orderStatus: order ? order.orderStatus : 'Unknown',
      paymentMethod: order ? order.paymentMethod : payment?.paymentMethod,
      amount: order ? order.totalAmount : payment?.amount,
      gatewayOrderId: payment?.gatewayOrderId,
      gatewayReference: payment?.gatewayReference,
      razorpayPaymentId: payment?.razorpayPaymentId,
      failureReason: payment?.failureReason || ''
    });
  } catch (err) {
    console.error('Error fetching payment status:', err);
    res.status(500).json({ message: 'Failed to fetch payment status', error: err.message });
  }
});

module.exports = router;
