const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const { router: productRoutes } = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const farmerProductRoutes = require('./routes/farmerProductRoutes');
const bulkOrderRoutes = require('./routes/bulkOrderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const surplusRoutes = require('./routes/surplusRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const contactRoutes = require('./routes/contactRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supportRoutes = require('./routes/supportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/freshharvest';

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', orderRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/farmer-products', farmerProductRoutes);
app.use('/api/bulk-orders', bulkOrderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/surplus', surplusRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);

// Health check (Reports honest database state)
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'OK',
    project: 'FreshHarvest',
    databaseConnected: isDbConnected,
    mode: isDbConnected ? 'production-persistent' : 'demo-fallback',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Connect to MongoDB & Start server
async function startServer() {
  console.log(`[FreshHarvest] Initializing backend services on port ${PORT}...`);
  console.log(`[FreshHarvest] Connecting to MongoDB database at ${MONGODB_URI}...`);
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ [FreshHarvest] Successfully connected to MongoDB at ${MONGODB_URI}`);

    const server = app.listen(PORT, () => {
      console.log(`🚀 [FreshHarvest] Backend API running live at http://localhost:${PORT}`);
      console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ [FreshHarvest] Port ${PORT} is already in use by another process.`);
        console.error(`💡 Tip: Another instance is holding port ${PORT}. Run 'npm run free-port' in the backend folder to clear it.\n`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
      }
    });
    return server;
  } catch (err) {
    console.warn(`⚠️ [FreshHarvest] Could not connect to MongoDB: ${err.message}`);
    console.log(`[FreshHarvest] Starting HTTP server in fallback mode on port ${PORT}...`);
    const server = app.listen(PORT, () => {
      console.log(`🚀 [FreshHarvest] Backend API running at http://localhost:${PORT} (Database pending)`);
      console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ [FreshHarvest] Port ${PORT} is already in use by another process.`);
        console.error(`💡 Tip: Another instance is holding port ${PORT}. Run 'npm run free-port' in the backend folder to clear it.\n`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
      }
    });
    return server;
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
