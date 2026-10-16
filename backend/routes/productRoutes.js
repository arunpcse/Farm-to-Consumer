const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const INITIAL_PRODUCTS = [
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
    isOrganic: true,
    harvestDate: new Date('2024-10-10'),
    expectedAvailability: 'Available until Oct 25',
    minimumOrderQuantity: 1,
    farmingInformation: 'Organic farming with natural compost',
    fertilizerInfo: 'Vermicompost',
    pestManagementInfo: 'Neem-based pest control',
    status: 'active'
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
    isOrganic: true,
    harvestDate: new Date('2024-10-08'),
    expectedAvailability: 'Available year-round',
    minimumOrderQuantity: 3,
    farmingInformation: 'Natural hill farming',
    fertilizerInfo: 'Organic manure',
    pestManagementInfo: 'Biological control',
    status: 'active'
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
    isOrganic: true,
    harvestDate: new Date('2024-09-15'),
    expectedAvailability: 'Available until Dec 2024',
    minimumOrderQuantity: 5,
    farmingInformation: 'Traditional Cauvery delta farming',
    fertilizerInfo: 'Balanced NPK',
    pestManagementInfo: 'IPM',
    status: 'active'
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
    isOrganic: true,
    harvestDate: new Date('2024-10-13'),
    expectedAvailability: 'Daily fresh supply',
    minimumOrderQuantity: 2,
    farmingInformation: 'Indigenous cow dairy farming',
    fertilizerInfo: 'Organic feed',
    pestManagementInfo: 'Natural',
    status: 'active'
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
    isOrganic: true,
    harvestDate: new Date('2024-10-12'),
    expectedAvailability: 'Available until Oct 22',
    minimumOrderQuantity: 2,
    farmingInformation: 'Certified organic farming',
    fertilizerInfo: 'Bio-fertilizers',
    pestManagementInfo: 'Organic',
    status: 'active'
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
    isOrganic: true,
    harvestDate: new Date('2024-08-01'),
    expectedAvailability: 'Limited stock available',
    minimumOrderQuantity: 1,
    farmingInformation: 'Wild honey collection',
    fertilizerInfo: 'N/A',
    pestManagementInfo: 'N/A',
    status: 'active'
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
    isOrganic: true,
    harvestDate: new Date('2024-10-05'),
    expectedAvailability: 'Available until Nov 15',
    minimumOrderQuantity: 2,
    farmingInformation: 'Natural farming',
    fertilizerInfo: 'Farmyard manure',
    pestManagementInfo: 'Botanical',
    status: 'active'
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
    isOrganic: true,
    harvestDate: new Date('2024-09-20'),
    expectedAvailability: 'Available year-round',
    minimumOrderQuantity: 1,
    farmingInformation: 'Traditional spice farming',
    fertilizerInfo: 'Organic + chemical',
    pestManagementInfo: 'Integrated',
    status: 'active'
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
    isOrganic: true,
    harvestDate: new Date('2024-10-11'),
    expectedAvailability: 'Available until Oct 28',
    minimumOrderQuantity: 1,
    farmingInformation: 'Hill organic farming',
    fertilizerInfo: 'Bio-fertilizers',
    pestManagementInfo: 'Organic',
    status: 'active'
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
    isOrganic: true,
    harvestDate: new Date('2024-10-09'),
    expectedAvailability: 'Available until Nov 10',
    minimumOrderQuantity: 2,
    farmingInformation: 'Organic farming',
    fertilizerInfo: 'Vermicompost',
    pestManagementInfo: 'Neem-based',
    status: 'active'
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
    isOrganic: true,
    harvestDate: new Date('2024-10-07'),
    expectedAvailability: 'Available year-round',
    minimumOrderQuantity: 5,
    farmingInformation: 'Natural coconut farming',
    fertilizerInfo: 'Organic manure',
    pestManagementInfo: 'Biological',
    status: 'active'
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
    isOrganic: true,
    harvestDate: new Date('2024-09-10'),
    expectedAvailability: 'Available until Dec 2024',
    minimumOrderQuantity: 5,
    farmingInformation: 'Traditional rice farming',
    fertilizerInfo: 'Balanced NPK',
    pestManagementInfo: 'IPM',
    status: 'active'
  }
];

// Seed initial products if collection is empty
async function seedProductsIfNeeded() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      const toInsert = INITIAL_PRODUCTS.map(({ _id, ...rest }) => rest);
      await Product.insertMany(toInsert);
      console.log('Seeded initial FreshHarvest products into database.');
    }
  } catch (err) {
    console.error('Error seeding products:', err.message);
  }
}

// GET /api/products - Browse, search, filter, paginate
router.get('/', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning demo data');
      return returnDemoData(req, res);
    }

    await seedProductsIfNeeded();

    const {
      search = '',
      category = 'All',
      page = 1,
      limit = 6,
      sortBy = 'newest'
    } = req.query;

    const query = {};

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Search query (case-insensitive substring match on name, description, farmerName)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { farmerName: searchRegex },
        { farmLocation: searchRegex }
      ];
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'price-low') sortOptions = { price: 1 };
    if (sortBy === 'price-high') sortOptions = { price: -1 };
    if (sortBy === 'rating') sortOptions = { rating: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 6);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const categories = [
      'All',
      'Vegetables',
      'Fruits',
      'Grains & Pulses',
      'Dairy & Organic',
      'Herbs & Spices'
    ];

    res.status(200).json({
      products,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      categories
    });
  } catch (error) {
    console.error('Error retrieving products, falling back to demo data:', error.message);
    return returnDemoData(req, res);
  }
});

// Fallback function to return demo data when MongoDB is not available
function returnDemoData(req, res) {
  const {
    search = '',
    category = 'All',
    page = 1,
    limit = 6,
    sortBy = 'newest'
  } = req.query;

  let filteredProducts = [...INITIAL_PRODUCTS];

  // Category filter
  if (category && category !== 'All') {
    filteredProducts = filteredProducts.filter(p => p.category === category);
  }

  // Search filter
  if (search && search.trim() !== '') {
    const searchLower = search.trim().toLowerCase();
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.farmerName.toLowerCase().includes(searchLower) ||
      p.farmLocation.toLowerCase().includes(searchLower)
    );
  }

  // Sorting
  if (sortBy === 'price-low') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    filteredProducts.sort((a, b) => b.rating - a.rating);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 6);
  const skip = (pageNum - 1) * limitNum;

  const total = filteredProducts.length;
  const products = filteredProducts.slice(skip, skip + limitNum);

  const categories = [
    'All',
    'Vegetables',
    'Fruits',
    'Grains & Pulses',
    'Dairy & Organic',
    'Herbs & Spices'
  ];

  res.status(200).json({
    products,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    categories
  });
}

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  const categories = [
    'All',
    'Vegetables',
    'Fruits',
    'Grains & Pulses',
    'Dairy & Organic',
    'Herbs & Spices'
  ];
  res.status(200).json({ categories });
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    let product = null;
    const { id } = req.params;

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product) {
      product = await Product.findOne({ _id: id }).catch(() => null);
    }
    if (!product) {
      product = INITIAL_PRODUCTS.find(p => p._id === id);
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.status(200).json({ product });
  } catch (error) {
    const fallback = INITIAL_PRODUCTS.find(p => p._id === req.params.id);
    if (fallback) {
      return res.status(200).json({ product: fallback });
    }
    res.status(500).json({ message: 'Error fetching product details.', error: error.message });
  }
});

module.exports = { router, INITIAL_PRODUCTS };
