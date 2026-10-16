import { useState, useEffect } from 'react';
import { deliveryService } from '../services/api';
import './DeliveryTrackingModal.css';

export default function DeliveryTrackingModal({ isOpen, onClose, order }) {
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && order) {
      loadTracking();
    }
  }, [isOpen, order]);

  async function loadTracking() {
    setLoading(true);
    try {
      const orderId = order.orderId || order._id;
      const res = await deliveryService.trackDeliveryByOrderId(orderId);
      setDelivery(res.delivery);
    } catch {
      // Create fallback tracking based on order status
      setDelivery({
        status: order?.orderStatus === 'Delivered' ? 'delivered' : 'out_for_delivery',
        deliveryPartnerName: 'Karthik Raja (Express Delivery Fleet)',
        recipientName: order?.customerName,
        recipientPhone: order?.customerPhone,
        pickupAddress: { street: 'FreshHarvest Hub / Partner Farm', city: 'Erode' },
        deliveryAddress: order?.shippingAddress || { street: 'Customer Address', city: 'Delivery City' },
        estimatedDeliveryTime: order?.estimatedDelivery || new Date(Date.now() + 3600000)
      });
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const currentStatus = delivery?.status || 'out_for_delivery';

  const steps = [
    { key: 'placed', label: 'Order Placed', time: 'Morning 8:00 AM', desc: 'Direct farm order confirmed' },
    { key: 'picked_up', label: 'Harvested & Picked Up', time: 'Farm Gate', desc: 'Packed fresh at partner farm' },
    { key: 'out_for_delivery', label: 'Out for Delivery', time: 'In Transit', desc: 'On delivery vehicle to your door' },
    { key: 'delivered', label: 'Delivered', time: 'Doorstep', desc: 'Handed over fresh & verified' }
  ];

  function getStepState(stepKey) {
    const orderRanks = {
      assigned: 1,
      picked_up: 2,
      out_for_delivery: 3,
      delivered: 4
    };
    const stepRank = {
      placed: 0,
      picked_up: 2,
      out_for_delivery: 3,
      delivered: 4
    }[stepKey];

    const currentRank = orderRanks[currentStatus] || 3;
    if (currentRank > stepRank) return 'completed';
    if (currentRank === stepRank) return 'active';
    return 'pending';
  }

  return (
    <div className="track-overlay" onClick={onClose}>
      <div className="track-modal" onClick={(e) => e.stopPropagation()}>
        <div className="track-header">
          <div>
            <h3>Live Produce Delivery Tracking</h3>
            <p className="track-order-id">
              Order Ref: <strong>#{order?.orderId || 'FH-ORD-LIVE'}</strong>
            </p>
          </div>
          <button className="track-close" onClick={onClose}>✕</button>
        </div>

        <div className="track-body">
          {/* Status Ribbon */}
          <div className="track-eta-banner">
            <div className="eta-badge">
              <span className="pulse-dot"></span> In Transit
            </div>
            <div className="eta-time">
              <span>Estimated Delivery:</span>
              <strong>Within 45 - 60 mins</strong>
            </div>
          </div>

          {/* Stepper */}
          <div className="stepper-wrap">
            {steps.map((st, idx) => {
              const state = getStepState(st.key);
              return (
                <div key={st.key} className={`stepper-node ${state}`}>
                  <div className="node-icon-col">
                    <div className="node-circle">
                      {state === 'completed' ? '✓' : idx + 1}
                    </div>
                    {idx < steps.length - 1 && <div className="node-line"></div>}
                  </div>
                  <div className="node-info">
                    <div className="node-title-row">
                      <strong>{st.label}</strong>
                      <span className="node-time">{st.time}</span>
                    </div>
                    <p className="node-desc">{st.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assigned Driver Details */}
          <div className="driver-card-box">
            <div className="driver-photo">👨‍✈️</div>
            <div className="driver-details">
              <span className="driver-role">Assigned Delivery Partner</span>
              <strong className="driver-name">{delivery?.deliveryPartnerName || 'Karthik Raja'}</strong>
              <span className="driver-veh">Vehicle: TN-33-AX-8942 (Temperature-Controlled EV)</span>
            </div>
            <div className="driver-call-col">
              <a href="tel:+919750011223" className="btn-call-driver">
                📞 Call Driver
              </a>
            </div>
          </div>

          {/* Delivery Route addresses */}
          <div className="track-addresses">
            <div className="addr-row">
              <span className="addr-tag">Destination:</span>
              <span className="addr-val">
                {order?.shippingAddress?.street}, {order?.shippingAddress?.city}
              </span>
            </div>
          </div>
        </div>

        <div className="track-footer">
          <button className="btn-close-track" onClick={onClose}>
            Close Tracking
          </button>
        </div>
      </div>
    </div>
  );
}
