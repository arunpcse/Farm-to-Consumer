const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Farmer = require('../models/Farmer');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authMiddleware } = require('../middleware/auth');

// Demo farmers data for fallback when MongoDB is not available
const DEMO_FARMERS = [
  {
    _id: 'f1',
    userId: 'u1',
    farmName: 'Ramasamy Farms',
    native: 'Perundurai',
    state: 'Tamil Nadu',
    district: 'Erode',
    taluk: 'Perundurai',
    village: 'Perundurai',
    experience: '15 Years',
    farmSize: '5 acres',
    farmingType: 'Organic',
    farmingPractices: 'No chemical pesticides, natural compost',
    soilType: 'Red soil',
    fertilizerUsed: 'Vermicompost',
    pestManagement: 'Neem-based',
    bio: 'Growing organic vegetables for over 15 years using traditional methods.',
    isVerified: true,
    rating: 4.8,
    createdAt: new Date('2024-01-01')
  },
  {
    _id: 'f2',
    userId: 'u2',
    farmName: 'Kaveri Valley Orchards',
    native: 'Pollachi',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    taluk: 'Pollachi',
    village: 'Pollachi',
    experience: '8 Years',
    farmSize: '3 acres',
    farmingType: 'Natural',
    farmingPractices: 'Minimal intervention farming',
    soilType: 'Mountain soil',
    fertilizerUsed: 'Organic manure',
    pestManagement: 'Biological control',
    bio: 'Specializing in hill fruits grown without artificial chemicals.',
    isVerified: true,
    rating: 4.9,
    createdAt: new Date('2024-02-01')
  },
  {
    _id: 'f3',
    userId: 'u3',
    farmName: 'Thirunavukkarasu Naturals',
    native: 'Thanjavur',
    state: 'Tamil Nadu',
    district: 'Thanjavur',
    taluk: 'Thanjavur',
    village: 'Thanjavur',
    experience: '22 Years',
    farmSize: '10 acres',
    farmingType: 'Organic',
    farmingPractices: 'Sustainable conventional farming',
    soilType: 'Alluvial soil',
    fertilizerUsed: 'Balanced NPK',
    pestManagement: 'IPM',
    bio: 'Traditional rice and grain farming in the Cauvery delta region.',
    isVerified: true,
    rating: 4.9,
    createdAt: new Date('2024-03-01')
  },
  {
    _id: 'f4',
    userId: 'u4',
    farmName: 'Kangayam Indigenous Dairy',
    native: 'Tiruppur',
    state: 'Tamil Nadu',
    district: 'Tiruppur',
    taluk: 'Kangayam',
    village: 'Tiruppur',
    experience: '10 Years',
    farmSize: '2 acres',
    farmingType: 'Organic',
    farmingPractices: 'Traditional dairy farming',
    soilType: 'Red soil',
    fertilizerUsed: 'Organic feed',
    pestManagement: 'Natural',
    bio: 'Pure A2 milk from indigenous Kangayam cows.',
    isVerified: true,
    rating: 5.0,
    createdAt: new Date('2024-04-01')
  },
  {
    _id: 'f5',
    userId: 'u5',
    farmName: 'Greenfield Agri Co-op',
    native: 'Bhavani',
    state: 'Tamil Nadu',
    district: 'Erode',
    taluk: 'Bhavani',
    village: 'Bhavani',
    experience: '6 Years',
    farmSize: '4 acres',
    farmingType: 'Organic',
    farmingPractices: 'Certified organic farming',
    soilType: 'Black soil',
    fertilizerUsed: 'Bio-fertilizers',
    pestManagement: 'Organic',
    bio: 'Young organic farm focusing on leafy greens and vegetables.',
    isVerified: true,
    rating: 4.7,
    createdAt: new Date('2024-05-01')
  },
  {
    _id: 'f6',
    userId: 'u6',
    farmName: 'Nilgiri Tribal Collective',
    native: 'Kotagiri',
    state: 'Tamil Nadu',
    district: 'Nilgiris',
    taluk: 'Kotagiri',
    village: 'Kotagiri',
    experience: '12 Years',
    farmSize: '6 acres',
    farmingType: 'Natural',
    farmingPractices: 'Natural farming methods',
    soilType: 'Red soil',
    fertilizerUsed: 'Farmyard manure',
    pestManagement: 'Botanical',
    bio: 'Tribal collective harvesting wild honey from Western Ghats.',
    isVerified: true,
    rating: 4.9,
    createdAt: new Date('2024-06-01')
  }
];

// Demo users corresponding to farmers
const DEMO_USERS = [
  { _id: 'u1', name: 'R. Murugan', email: 'murugan@example.com', phone: '9876543210' },
  { _id: 'u2', name: 'K. Lakshmi', email: 'lakshmi@example.com', phone: '9876543211' },
  { _id: 'u3', name: 'Thirunavukkarasu', email: 'thiru@example.com', phone: '9876543212' },
  { _id: 'u4', name: 'K. Raju', email: 'raju@example.com', phone: '9876543213' },
  { _id: 'u5', name: 'M. Kumar', email: 'kumar@example.com', phone: '9876543214' },
  { _id: 'u6', name: 'S. Tribal', email: 'tribal@example.com', phone: '9876543215' }
];

// Demo products (must match the ones in productRoutes)
const DEMO_PRODUCTS = [
  {
    _id: 'demo-1',
    name: 'Fresh Organic Farm Tomatoes',
    description: 'Vine-ripened, hand-picked farm fresh tomatoes. Rich in antioxidants and bursting with natural flavor.',
    category: 'Vegetables',
    price: 38,
    unit: 'kg',
    stock: 65,
    farmerName: 'Ramasamy Farms',
    farmLocation: 'Perundurai, Erode',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    isOrganic: true
  },
  {
    _id: 'demo-2',
    name: 'Hilltop Cavendish Bananas',
    description: 'Naturally sweetened, chemical-free bananas harvested from the foothills of Sirumalai.',
    category: 'Fruits',
    price: 55,
    unit: 'dozen',
    stock: 40,
    farmerName: 'Kaveri Valley Orchards',
    farmLocation: 'Pollachi, Coimbatore',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    isOrganic: true
  },
  {
    _id: 'demo-3',
    name: 'Traditional Brown Ponni Rice',
    description: 'Unpolished traditional single-boiled rice rich in fiber, vitamins, and minerals.',
    category: 'Grains & Pulses',
    price: 85,
    unit: 'kg',
    stock: 120,
    farmerName: 'Thirunavukkarasu Naturals',
    farmLocation: 'Thanjavur, Tamil Nadu',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    isOrganic: true
  },
  {
    _id: 'demo-4',
    name: 'Pure Desi A2 Cow Milk',
    description: 'Raw, unpasteurized, nutrient-dense pure A2 milk directly from grass-fed Kangayam cows.',
    category: 'Dairy & Organic',
    price: 70,
    unit: 'litre',
    stock: 30,
    farmerName: 'Kangayam Indigenous Dairy',
    farmLocation: 'Tiruppur, Tamil Nadu',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80',
    rating: 5.0,
    isOrganic: true
  },
  {
    _id: 'demo-5',
    name: 'Fresh Crisp Country Spinach (Palak)',
    description: 'Crisp, iron-rich fresh green spinach harvested early morning for maximum nutrition.',
    category: 'Vegetables',
    price: 25,
    unit: 'bunch',
    stock: 50,
    farmerName: 'Greenfield Agri Co-op',
    farmLocation: 'Bhavani, Erode',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    isOrganic: true
  },
  {
    _id: 'demo-6',
    name: 'Wild Forest Raw Honey',
    description: 'Unprocessed, unheated multi-floral natural honey sustainably gathered from Western Ghats apiaries.',
    category: 'Dairy & Organic',
    price: 320,
    unit: '500g',
    stock: 25,
    farmerName: 'Nilgiri Tribal Collective',
    farmLocation: 'Kotagiri, Nilgiris',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    isOrganic: true
  },
  {
    _id: 'demo-7',
    name: 'Fresh Seedless Watermelon',
    description: 'Sweet, hydrating, juicy red watermelon cultivated without artificial stimulants.',
    category: 'Fruits',
    price: 32,
    unit: 'kg',
    stock: 35,
    farmerName: 'Marudham Sun Farms',
    farmLocation: 'Dharmapuri, Tamil Nadu',
    image: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=600&auto=format&fit=crop&q=80',
    rating: 4.6,
    isOrganic: true
  },
  {
    _id: 'demo-8',
    name: 'Raw Organic Turmeric Fingers',
    description: 'High-curcumin fresh Salem turmeric roots. Naturally sun-dried and pesticide-free.',
    category: 'Herbs & Spices',
    price: 140,
    unit: '500g',
    stock: 45,
    farmerName: 'Kongu Spice Growers',
    farmLocation: 'Salem, Tamil Nadu',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    isOrganic: true
  },
  {
    _id: 'demo-9',
    name: 'Organic Country Carrots',
    description: 'Crunchy sweet carrots straight from the cool hills of Ooty. Loaded with beta carotene.',
    category: 'Vegetables',
    price: 45,
    unit: 'kg',
    stock: 55,
    farmerName: 'Highland Organic Growers',
    farmLocation: 'Ooty, Nilgiris',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    isOrganic: true
  },
  {
    _id: 'demo-10',
    name: 'Fresh Farm Onions',
    description: 'Locally grown onions, perfect for everyday cooking.',
    category: 'Vegetables',
    price: 35,
    unit: 'kg',
    stock: 80,
    farmerName: 'Ramasamy Farms',
    farmLocation: 'Perundurai, Erode',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
    rating: 4.6,
    isOrganic: true
  },
  {
    _id: 'demo-11',
    name: 'Coconuts',
    description: 'Fresh tender coconuts from the hills.',
    category: 'Fruits',
    price: 45,
    unit: 'piece',
    stock: 60,
    farmerName: 'Kaveri Valley Orchards',
    farmLocation: 'Pollachi, Coimbatore',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    isOrganic: true
  },
  {
    _id: 'demo-12',
    name: 'Basmati Rice',
    description: 'Premium aromatic basmati rice.',
    category: 'Grains & Pulses',
    price: 120,
    unit: 'kg',
    stock: 90,
    farmerName: 'Thirunavukkarasu Naturals',
    farmLocation: 'Thanjavur, Tamil Nadu',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    isOrganic: true
  }
];

// ─────────────────────────────────────────────
// GET /api/farmers
// List all farmers with optional filters
// Query: ?state=&district=&taluk=&village=&search=&page=&limit=
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning demo farmers');
      return returnDemoFarmers(req, res);
    }

    const {
      state,
      district,
      taluk,
      village,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};

    if (state) filter.state = { $regex: state, $options: 'i' };
    if (district) filter.district = { $regex: district, $options: 'i' };
    if (taluk) filter.taluk = { $regex: taluk, $options: 'i' };
    if (village) filter.village = { $regex: village, $options: 'i' };

    // text search on farmName, native, village, district
    if (search) {
      filter.$or = [
        { farmName: { $regex: search, $options: 'i' } },
        { native: { $regex: search, $options: 'i' } },
        { village: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * pageSize;

    const [farmers, total] = await Promise.all([
      Farmer.find(filter)
        .sort({ isVerified: -1, rating: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Farmer.countDocuments(filter)
    ]);

    // Populate user info (name, email, phone) for each farmer
    const userIds = farmers.map(f => f.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email phone')
      .lean();

    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const enriched = farmers.map(f => ({
      ...f,
      user: userMap[f.userId ? f.userId.toString() : ''] || null
    }));

    res.json({
      farmers: enriched,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (err) {
    console.error('[farmerRoutes] GET /api/farmers error:', err);
    return returnDemoFarmers(req, res);
  }
});

// Fallback function to return demo farmers when MongoDB is not available
function returnDemoFarmers(req, res) {
  const {
    state,
    district,
    taluk,
    village,
    search,
    page = 1,
    limit = 20
  } = req.query;

  let filteredFarmers = [...DEMO_FARMERS];

  // Apply filters
  if (state) {
    filteredFarmers = filteredFarmers.filter(f => 
      f.state.toLowerCase().includes(state.toLowerCase())
    );
  }
  if (district) {
    filteredFarmers = filteredFarmers.filter(f => 
      f.district.toLowerCase().includes(district.toLowerCase())
    );
  }
  if (taluk) {
    filteredFarmers = filteredFarmers.filter(f => 
      f.taluk.toLowerCase().includes(taluk.toLowerCase())
    );
  }
  if (village) {
    filteredFarmers = filteredFarmers.filter(f => 
      f.village.toLowerCase().includes(village.toLowerCase()) ||
      f.native.toLowerCase().includes(village.toLowerCase())
    );
  }
  if (search) {
    const searchLower = search.toLowerCase();
    filteredFarmers = filteredFarmers.filter(f =>
      f.farmName.toLowerCase().includes(searchLower) ||
      f.native.toLowerCase().includes(searchLower) ||
      f.bio.toLowerCase().includes(searchLower)
    );
  }

  // Sort by verified status, then rating
  filteredFarmers.sort((a, b) => {
    if (a.isVerified !== b.isVerified) return b.isVerified - a.isVerified;
    return b.rating - a.rating;
  });

  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * pageSize;

  const total = filteredFarmers.length;
  const farmers = filteredFarmers.slice(skip, skip + pageSize);

  // Attach demo user info
  const userMap = {};
  DEMO_USERS.forEach(u => { userMap[u._id] = u; });

  const enriched = farmers.map(f => ({
    ...f,
    user: userMap[f.userId] || null,
    name: userMap[f.userId]?.name || 'Farmer',
    reviewCount: Math.floor(Math.random() * 100) + 30,
    productCount: Math.floor(Math.random() * 20) + 5
  }));

  res.json({
    farmers: enriched,
    pagination: {
      total,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}

// ─────────────────────────────────────────────
// GET /api/farmers/my/profile  (must come before /:farmerId)
// Logged-in farmer's own profile
// ─────────────────────────────────────────────
router.get('/my/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const farmer = await Farmer.findOne({ userId }).lean();
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found. Please create your profile first.' });
    }

    const user = await User.findById(userId).select('name email phone').lean();
    res.json({ farmer: { ...farmer, user } });
  } catch (err) {
    console.error('[farmerRoutes] GET /my/profile error:', err);
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/farmers/my/products
// Logged-in farmer's products
// ─────────────────────────────────────────────
router.get('/my/products', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    // Find farmer profile to get the farmerId string
    const farmer = await Farmer.findOne({ userId }).lean();
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    const farmerId = farmer._id.toString();
    const products = await Product.find({ farmerId }).sort({ createdAt: -1 }).lean();

    res.json({ products, total: products.length });
  } catch (err) {
    console.error('[farmerRoutes] GET /my/products error:', err);
    res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/farmers/my/orders
// Incoming orders that contain this farmer's products
// ─────────────────────────────────────────────
router.get('/my/orders', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Farmer role required.' });
    }

    const userId = req.user.id || req.user._id;
    const farmer = await Farmer.findOne({ userId }).lean();
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    const farmerId = farmer._id.toString();
    const farmerName = farmer.farmName;

    // Find orders where any item belongs to this farmer
    const orders = await Order.find({
      $or: [
        { 'items.farmerId': farmerId },
        { 'items.farmerName': farmerName }
      ]
    }).sort({ createdAt: -1 }).lean();

    res.json({ orders, total: orders.length });
  } catch (err) {
    console.error('[farmerRoutes] GET /my/orders error:', err);
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/farmers/my/earnings
// Comprehensive financial summary and order-level breakdown for the logged-in farmer
// Supports ?timeframe=all|month|week|today&startDate=&endDate=
// ─────────────────────────────────────────────
router.get('/my/earnings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const farmer = await Farmer.findOne({ userId }).lean();
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    const farmerId = farmer._id.toString();
    const farmerName = farmer.farmName;
    const { timeframe = 'all', startDate, endDate } = req.query;

    const orders = await Order.find({
      $or: [
        { 'items.farmerId': farmerId },
        { 'items.farmerName': farmerName }
      ]
    }).sort({ createdAt: -1 }).lean();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    let deliveredRevenue = 0;
    let pendingRevenue = 0;
    let cancelledRevenue = 0;
    let completedOrders = 0;
    let pendingOrders = 0;
    let cancelledOrders = 0;

    let thisMonth = 0;
    let lastMonth = 0;
    let thisWeek = 0;
    let today = 0;

    const cropStats = {};
    const orderHistory = [];

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);

      // Sum only items that belong to this farmer
      const farmerItems = (order.items || []).filter(
        item => String(item.farmerId) === farmerId || item.farmerName === farmerName
      );
      if (farmerItems.length === 0) return;

      const orderGross = farmerItems.reduce(
        (sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)),
        0
      );

      const isDelivered = order.orderStatus === 'Delivered';
      const isPending = ['Placed', 'Farmer Accepted', 'Preparing', 'Ready for Pickup', 'Packed', 'Shipped', 'Out for Delivery'].includes(order.orderStatus);
      const isCancelled = ['Cancelled', 'Payment Failed'].includes(order.orderStatus);

      // Check timeframe filter for summary filtering if requested
      let withinFilter = true;
      if (timeframe === 'month') withinFilter = orderDate >= startOfThisMonth;
      else if (timeframe === 'week') withinFilter = orderDate >= startOfThisWeek;
      else if (timeframe === 'today') withinFilter = orderDate >= startOfToday;
      else if (startDate && endDate) withinFilter = orderDate >= new Date(startDate) && orderDate <= new Date(endDate);

      // Global period counters
      if (isDelivered) {
        if (orderDate >= startOfThisMonth) thisMonth += orderGross;
        else if (orderDate >= startOfLastMonth && orderDate <= endOfLastMonth) lastMonth += orderGross;
        if (orderDate >= startOfThisWeek) thisWeek += orderGross;
        if (orderDate >= startOfToday) today += orderGross;
      }

      if (isDelivered) {
        deliveredRevenue += orderGross;
        completedOrders += 1;

        // Crop sales volume accumulation for delivered orders
        farmerItems.forEach(it => {
          const key = it.name || 'Organic Produce';
          if (!cropStats[key]) {
            cropStats[key] = {
              name: key,
              category: it.category || 'Vegetables',
              unit: it.unit || 'kg',
              unitsSold: 0,
              totalAmount: 0,
              orderCount: 0
            };
          }
          cropStats[key].unitsSold += Number(it.quantity || 1);
          cropStats[key].totalAmount += (Number(it.price || 0) * Number(it.quantity || 1));
          cropStats[key].orderCount += 1;
        });
      } else if (isPending) {
        pendingRevenue += orderGross;
        pendingOrders += 1;
      } else if (isCancelled) {
        cancelledRevenue += orderGross;
        cancelledOrders += 1;
      }

      // Add to order history
      if (withinFilter) {
        const netDisbursed = isDelivered ? Number((orderGross * 0.95).toFixed(2)) : 0;
        let settlementStatus = 'Pending Fulfillment';
        if (isDelivered) settlementStatus = 'Settled to Bank';
        else if (isCancelled) settlementStatus = 'Void / Cancelled';

        orderHistory.push({
          orderId: order.orderId,
          _id: order._id,
          customerName: order.customerName,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus || 'Pending',
          paymentMethod: order.paymentMethod || 'Cash on Delivery',
          grossAmount: Number(orderGross.toFixed(2)),
          netPayout: netDisbursed,
          settlementStatus,
          items: farmerItems.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit, price: i.price })),
          createdAt: order.createdAt
        });
      }
    });

    const platformFeeRate = 0.05; // 5% marketplace facilitation fee
    const platformFees = Number((deliveredRevenue * platformFeeRate).toFixed(2));
    const netEarnings = Number((deliveredRevenue - platformFees).toFixed(2));

    const cropsBreakdown = Object.values(cropStats).map(c => ({
      name: c.name,
      category: c.category,
      unit: c.unit,
      unitsSold: c.unitsSold,
      averageRate: `₹${(c.totalAmount / (c.unitsSold || 1)).toFixed(2)} / ${c.unit}`,
      grossSales: `₹${c.totalAmount.toLocaleString('en-IN')}`,
      netPayout: `₹${(c.totalAmount * 0.95).toLocaleString('en-IN')}`
    }));

    res.json({
      // Totals
      totalEarnings: netEarnings, // Backwards compatible with existing totalEarnings
      grossSales: parseFloat(deliveredRevenue.toFixed(2)),
      deliveredRevenue: parseFloat(deliveredRevenue.toFixed(2)),
      netEarnings,
      platformFeeRate: '5%',
      platformFees,
      pendingRevenue: parseFloat(pendingRevenue.toFixed(2)),
      cancelledRevenue: parseFloat(cancelledRevenue.toFixed(2)),

      // Order counts
      totalOrders: orders.length,
      completedOrders,
      pendingOrders,
      cancelledOrders,

      // Period summaries (Delivered)
      today: parseFloat(today.toFixed(2)),
      thisWeek: parseFloat(thisWeek.toFixed(2)),
      thisMonth: parseFloat(thisMonth.toFixed(2)),
      lastMonth: parseFloat(lastMonth.toFixed(2)),

      // Breakdowns
      timeframe,
      cropsBreakdown,
      orderHistory
    });
  } catch (err) {
    console.error('[farmerRoutes] GET /my/earnings error:', err);
    res.status(500).json({ message: 'Failed to fetch earnings', error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/farmers/profile
// Create or update the logged-in farmer's profile
// ─────────────────────────────────────────────
router.post('/profile', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Farmer role required.' });
    }

    const userId = req.user.id || req.user._id;
    const {
      farmName,
      native,
      state,
      district,
      taluk,
      village,
      experience,
      farmSize,
      farmingType,
      farmingPractices,
      soilType,
      fertilizerUsed,
      pestManagement,
      bio,
      profileImage
    } = req.body;

    if (!farmName || !native || !district) {
      return res.status(400).json({ message: 'farmName, native, and district are required.' });
    }

    const updateData = {
      userId,
      farmName,
      native,
      district,
      ...(state !== undefined && { state }),
      ...(taluk !== undefined && { taluk }),
      ...(village !== undefined && { village }),
      ...(experience !== undefined && { experience }),
      ...(farmSize !== undefined && { farmSize }),
      ...(farmingType !== undefined && { farmingType }),
      ...(farmingPractices !== undefined && { farmingPractices }),
      ...(soilType !== undefined && { soilType }),
      ...(fertilizerUsed !== undefined && { fertilizerUsed }),
      ...(pestManagement !== undefined && { pestManagement }),
      ...(bio !== undefined && { bio }),
      ...(profileImage !== undefined && { profileImage })
    };

    const farmer = await Farmer.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    res.status(200).json({ message: 'Farmer profile saved successfully.', farmer });
  } catch (err) {
    console.error('[farmerRoutes] POST /profile error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Farmer profile already exists for this user.' });
    }
    res.status(500).json({ message: 'Failed to save farmer profile', error: err.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/farmers/orders/:orderId/accept
// Farmer accepts an order
// ─────────────────────────────────────────────
router.patch('/orders/:orderId/accept', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Farmer role required.' });
    }

    const { orderId } = req.params;
    const order = await Order.findOneAndUpdate(
      { orderId },
      {
        $set: { orderStatus: 'Farmer Accepted' },
        $push: {
          statusTimeline: {
            status: 'Farmer Accepted',
            timestamp: new Date(),
            note: req.body.note || 'Order accepted by farmer'
          }
        }
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json({ message: 'Order accepted successfully.', order });
  } catch (err) {
    console.error('[farmerRoutes] PATCH /orders/:orderId/accept error:', err);
    res.status(500).json({ message: 'Failed to accept order', error: err.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/farmers/orders/:orderId/reject
// Farmer rejects an order
// ─────────────────────────────────────────────
router.patch('/orders/:orderId/reject', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Farmer role required.' });
    }

    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOneAndUpdate(
      { orderId },
      {
        $set: {
          orderStatus: 'Cancelled',
          cancellationReason: reason || 'Rejected by farmer'
        },
        $push: {
          statusTimeline: {
            status: 'Cancelled',
            timestamp: new Date(),
            note: reason || 'Rejected by farmer'
          }
        }
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json({ message: 'Order rejected successfully.', order });
  } catch (err) {
    console.error('[farmerRoutes] PATCH /orders/:orderId/reject error:', err);
    res.status(500).json({ message: 'Failed to reject order', error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/farmers/:farmerId
// Single farmer profile + all their products
// ─────────────────────────────────────────────
router.get('/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;

    // Check if MongoDB is connected, if not use demo data
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning demo farmer profile');
      return returnDemoFarmerProfile(req, res);
    }

    if (!mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({ message: 'Invalid farmerId format.' });
    }

    const farmer = await Farmer.findById(farmerId).lean();
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found.' });
    }

    const [user, products] = await Promise.all([
      User.findById(farmer.userId).select('name email phone').lean(),
      Product.find({ farmerId: farmerId }).sort({ createdAt: -1 }).lean()
    ]);

    res.json({
      farmer: { ...farmer, user },
      products,
      totalProducts: products.length
    });
  } catch (err) {
    console.error('[farmerRoutes] GET /:farmerId error:', err);
    return returnDemoFarmerProfile(req, res);
  }
});

// Fallback function to return demo farmer profile when MongoDB is not available
function returnDemoFarmerProfile(req, res) {
  const { farmerId } = req.params;
  
  // Find demo farmer by ID
  const farmer = DEMO_FARMERS.find(f => f._id === farmerId);
  if (!farmer) {
    return res.status(404).json({ message: 'Farmer not found.' });
  }

  // Get demo user
  const user = DEMO_USERS.find(u => u._id === farmer.userId) || { name: 'Farmer', email: '', phone: '' };

  // Get demo products for this farmer (filter products by matching farmer name)
  const products = DEMO_PRODUCTS.filter(p => p.farmerName === farmer.farmName);

  res.json({
    farmer: { 
      ...farmer, 
      user,
      name: user.name,
      reviewCount: Math.floor(Math.random() * 100) + 30
    },
    products,
    totalProducts: products.length
  });
}

module.exports = router;
