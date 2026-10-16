import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../services/api';
import './Notifications.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // Fallback
      setNotifications([
        {
          _id: 'n1',
          type: 'order_status',
          title: 'Produce Out for Delivery! 🚚',
          message: 'Delivery partner Karthik Raja is on the way with your FreshHarvest basket (FH-ORD-54321).',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000)
        },
        {
          _id: 'n2',
          type: 'stock_alert',
          title: 'Flash Harvest Surplus Alert! 🍅',
          message: 'Ramasamy Farms just posted 45kg Surplus Organic Tomatoes at ₹26/kg (31% discount).',
          isRead: false,
          createdAt: new Date(Date.now() - 7200000)
        },
        {
          _id: 'n3',
          type: 'payment_status',
          title: 'Payment Confirmed',
          message: 'Transaction TXN-FH-456789 verified successfully via UPI. Thank you for supporting local farmers!',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000)
        }
      ]);
      setUnreadCount(2);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id) {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  function getIcon(type) {
    switch (type) {
      case 'order_status': return '🚚';
      case 'payment_status': return '💳';
      case 'stock_alert': return '🔥';
      case 'harvest_availability': return '🌱';
      case 'bulk_order': return '📦';
      default: return '🔔';
    }
  }

  return (
    <div className="notif-page">
      <div className="notif-header">
        <div>
          <h2>Notifications Center</h2>
          <p className="notif-subtitle">
            Stay updated with farm dispatches, payment confirmations, and flash harvest surplus alerts.
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-mark-all" onClick={handleMarkAllRead}>
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      <div className="notif-filter-bar">
        <button
          className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button
          className={`filter-chip ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {loading && <div className="notif-loading">Loading notifications...</div>}

      {!loading && filtered.length === 0 && (
        <div className="notif-empty">
          <div className="notif-empty-icon">📭</div>
          <h3>No notifications here</h3>
          <p>You are all caught up with your orders and farm updates!</p>
          <Link to="/products" className="btn-shop-now">Browse Farm Produce</Link>
        </div>
      )}

      <div className="notif-list">
        {filtered.map(notif => (
          <div
            key={notif._id}
            className={`notif-card ${!notif.isRead ? 'unread' : ''}`}
            onClick={() => !notif.isRead && handleMarkRead(notif._id)}
          >
            <div className="notif-icon-col">
              <span className="notif-type-icon">{getIcon(notif.type)}</span>
            </div>

            <div className="notif-content-col">
              <div className="notif-title-row">
                <h4 className="notif-title">{notif.title}</h4>
                <span className="notif-time">
                  {notif.createdAt
                    ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now'}
                </span>
              </div>
              <p className="notif-message">{notif.message}</p>
            </div>

            {!notif.isRead && (
              <div className="notif-action-col">
                <span className="unread-dot" title="Unread notification"></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
