const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Farmer = require('./models/Farmer');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Payment = require('./models/Payment');
const Review = require('./models/Review');
const BulkOrder = require('./models/BulkOrder');
const SurplusListing = require('./models/SurplusListing');
const Notification = require('./models/Notification');
const ContactInquiry = require('./models/ContactInquiry');
const Delivery = require('./models/Delivery');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/freshharvest';

async function seedDatabase() {
  console.log(`[FreshHarvest Seed] Connecting to MongoDB at ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB.');

  // Clean collections
  console.log('Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Farmer.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
    Review.deleteMany({}),
    BulkOrder.deleteMany({}),
    SurplusListing.deleteMany({}),
    Notification.deleteMany({}),
    ContactInquiry.deleteMany({}),
    Delivery.deleteMany({})
  ]);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);

  console.log('Seeding Users across all roles (Consumer, Farmer, Bulk Buyer, Delivery Partner, Admin)...');
  const userDocs = await User.insertMany([
    {
      name: 'R. Murugan (Farmer)',
      email: 'farmer@freshharvest.in',
      password: passwordHash,
      phone: '+91 98427 12340',
      role: 'farmer',
      addresses: [{
        street: 'SF No. 142, Kunnathur Road',
        city: 'Perundurai',
        state: 'Tamil Nadu',
        zipCode: '638052',
        label: 'Farm Headquarter',
        isDefault: true
      }]
    },
    {
      name: 'K. Lakshmi (Farmer)',
      email: 'kaveri@freshharvest.in',
      password: passwordHash,
      phone: '+91 94432 56781',
      role: 'farmer',
      addresses: [{
        street: 'Valparai Main Road',
        city: 'Pollachi',
        state: 'Tamil Nadu',
        zipCode: '642001',
        label: 'Orchard Gate',
        isDefault: true
      }]
    },
    {
      name: 'Priya Sundaram (Consumer)',
      email: 'customer@freshharvest.in',
      password: passwordHash,
      phone: '+91 98765 43210',
      role: 'customer',
      addresses: [{
        street: '42 Avinashi Road, Peelamedu',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zipCode: '641004',
        label: 'Home',
        isDefault: true
      }]
    },
    {
      name: 'Senthil Nathan (Bulk Buyer)',
      email: 'bulkbuyer@freshharvest.in',
      password: passwordHash,
      phone: '+91 98941 77890',
      role: 'bulk_buyer',
      businessName: 'Annamalai Grand Hotel & Messes',
      businessType: 'hotel',
      gstNumber: '33AAAAA0000A1Z5',
      addresses: [{
        street: '15 Gandhi Road, Central Kitchen',
        city: 'Erode',
        state: 'Tamil Nadu',
        zipCode: '638001',
        label: 'Central Kitchen',
        isDefault: true
      }]
    },
    {
      name: 'Karthik Raja (Delivery Partner)',
      email: 'delivery@freshharvest.in',
      password: passwordHash,
      phone: '+91 97500 11223',
      role: 'delivery_partner',
      vehicleNumber: 'TN-33-AX-8942',
      licenseNumber: 'TN3320210045678',
      isAvailable: true,
      addresses: [{
        street: 'Bhavani Road Hub',
        city: 'Erode',
        state: 'Tamil Nadu',
        zipCode: '638004',
        label: 'Base Station',
        isDefault: true
      }]
    },
    {
      name: 'FreshHarvest Admin',
      email: 'admin@freshharvest.in',
      password: adminPasswordHash,
      phone: '+91 90000 00001',
      role: 'admin',
      addresses: [{
        street: 'AgriTech Hub, Tidel Park',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zipCode: '641014',
        label: 'Platform Office',
        isDefault: true
      }]
    }
  ]);

  const [farmerUser1, farmerUser2, customerUser, bulkBuyerUser, deliveryUser, adminUser] = userDocs;

  console.log('Seeding Farmer Profiles with Native & Farming Practices...');
  const farmerDocs = await Farmer.insertMany([
    {
      userId: farmerUser1._id,
      farmName: 'Ramasamy Farms',
      native: 'Perundurai',
      state: 'Tamil Nadu',
      district: 'Erode',
      taluk: 'Perundurai',
      village: 'Perundurai',
      experience: 15,
      farmSize: '5 acres',
      farmingType: 'Organic',
      farmingPractices: 'No chemical pesticides, enriched vermicompost, drip irrigation',
      soilType: 'Rich Red Loamy Soil',
      fertilizerUsed: 'Vermicompost & Panchagavya',
      pestManagement: 'Neem seed kernel extract & yellow sticky traps',
      isVerified: true,
      rating: 4.8,
      totalReviews: 24,
      bio: 'Family farm cultivating organic heirloom vegetables for over 15 years in Kongu belt.'
    },
    {
      userId: farmerUser2._id,
      farmName: 'Kaveri Valley Orchards',
      native: 'Pollachi',
      state: 'Tamil Nadu',
      district: 'Coimbatore',
      taluk: 'Pollachi',
      village: 'Anamalai Foothills',
      experience: 10,
      farmSize: '8 acres',
      farmingType: 'Natural',
      farmingPractices: 'Subhash Palekar natural farming, multi-cropping, zero chemicals',
      soilType: 'Alluvial Mountain Soil',
      fertilizerUsed: 'Jeevamrutham & farmyard organic compost',
      pestManagement: 'Biological natural predator balance',
      isVerified: true,
      rating: 4.9,
      totalReviews: 38,
      bio: 'Sustainably growing hill bananas, coconuts, and exotic fruits at the foothills of Western Ghats.'
    }
  ]);

  const [farmer1, farmer2] = farmerDocs;

  console.log('Seeding Products with Harvest Dates, Transparent Info & Stock...');
  const productDocs = await Product.insertMany([
    {
      name: 'Fresh Organic Farm Tomatoes',
      description: 'Vine-ripened, hand-picked farm fresh tomatoes. Rich in antioxidants and bursting with natural flavor.',
      category: 'Vegetables',
      price: 38,
      unit: 'kg',
      stock: 75,
      farmerName: 'Ramasamy Farms',
      farmLocation: 'Perundurai, Erode',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      rating: 4.8,
      isOrganic: true,
      harvestDate: new Date('2026-10-12'),
      expectedAvailability: 'Available daily through Nov 2026',
      minimumOrderQuantity: 1,
      farmingInformation: 'Cultivated in open-air beds using heritage country seeds',
      fertilizerInfo: '100% Organic Vermicompost',
      pestManagementInfo: 'Neem-based organic repellant',
      status: 'active'
    },
    {
      name: 'Hilltop Cavendish Bananas',
      description: 'Naturally sweetened, chemical-free bananas harvested from the pristine foothills of Anamalai.',
      category: 'Fruits',
      price: 55,
      unit: 'dozen',
      stock: 50,
      farmerName: 'Kaveri Valley Orchards',
      farmLocation: 'Pollachi, Coimbatore',
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
      rating: 4.9,
      isOrganic: true,
      harvestDate: new Date('2026-10-13'),
      expectedAvailability: 'Harvested weekly on Tuesdays & Fridays',
      minimumOrderQuantity: 1,
      farmingInformation: 'Rain-fed hill orchard nourished by natural mountain springs',
      fertilizerInfo: 'Jeevamrutham and organic leaf mulch',
      pestManagementInfo: 'Biological natural control',
      status: 'active'
    },
    {
      name: 'Traditional Brown Ponni Rice',
      description: 'Unpolished traditional single-boiled rice rich in fiber, vitamins, and minerals.',
      category: 'Grains & Pulses',
      price: 85,
      unit: 'kg',
      stock: 150,
      farmerName: 'Ramasamy Farms',
      farmLocation: 'Perundurai, Erode',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
      rating: 4.9,
      isOrganic: true,
      harvestDate: new Date('2026-09-25'),
      expectedAvailability: 'Year-round cured grain stock',
      minimumOrderQuantity: 2,
      farmingInformation: 'Aged traditional paddy naturally sun-dried and de-husked',
      fertilizerInfo: 'Green manure (Daincha) plowing',
      pestManagementInfo: 'Traditional light traps',
      status: 'active'
    },
    {
      name: 'Fresh Crisp Country Spinach (Palak)',
      description: 'Farm-picked early morning tender palak leaves. Iron-packed, vibrant green, crisp and clean.',
      category: 'Vegetables',
      price: 25,
      unit: 'bunch',
      stock: 45,
      farmerName: 'Ramasamy Farms',
      farmLocation: 'Perundurai, Erode',
      image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80',
      rating: 4.7,
      isOrganic: true,
      harvestDate: new Date('2026-10-14'),
      expectedAvailability: 'Harvested daily at 5:00 AM',
      minimumOrderQuantity: 1,
      farmingInformation: 'Raised bed organic greens watered with well water',
      fertilizerInfo: 'Compost tea & bio-enzymes',
      pestManagementInfo: 'No spraying - manual physical inspection',
      status: 'active'
    },
    {
      name: 'Fresh Tender Coconuts (Pollachi Green)',
      description: 'Super sweet, electrolyte-rich natural tender coconut water with soft coconut malai.',
      category: 'Fruits',
      price: 45,
      unit: 'piece',
      stock: 80,
      farmerName: 'Kaveri Valley Orchards',
      farmLocation: 'Pollachi, Coimbatore',
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
      rating: 4.8,
      isOrganic: true,
      harvestDate: new Date('2026-10-14'),
      expectedAvailability: 'Harvested twice weekly',
      minimumOrderQuantity: 2,
      farmingInformation: 'Famous Pollachi tall native varieties',
      fertilizerInfo: 'Coir pith compost & salt basin',
      pestManagementInfo: 'Rhino beetle pheromone traps',
      status: 'active'
    },
    {
      name: 'Fresh Seedless Watermelon',
      description: 'Sweet, hydrating, juicy red watermelon cultivated without artificial stimulants.',
      category: 'Fruits',
      price: 32,
      unit: 'kg',
      stock: 40,
      farmerName: 'Kaveri Valley Orchards',
      farmLocation: 'Pollachi, Coimbatore',
      image: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=600&auto=format&fit=crop&q=80',
      rating: 4.6,
      isOrganic: true,
      harvestDate: new Date('2026-10-10'),
      expectedAvailability: 'Available through end of month',
      minimumOrderQuantity: 2,
      farmingInformation: 'Sun-drenched field melon with high brix sweetness',
      fertilizerInfo: 'Farmyard organic compost',
      pestManagementInfo: 'Botanical sprays',
      status: 'active'
    }
  ]);

  const [pTomato, pBanana, pRice, pSpinach, pCoconut, pMelon] = productDocs;

  console.log('Seeding Surplus & Unsold Produce (Module 12) with Flash Discounts...');
  const surplusDocs = await SurplusListing.insertMany([
    {
      productId: pTomato._id.toString(),
      farmerId: farmer1._id.toString(),
      farmerName: 'Ramasamy Farms',
      productName: 'Fresh Organic Farm Tomatoes (Surplus Batch)',
      productImage: pTomato.image,
      availableQuantity: 45,
      standardPrice: 38,
      offerPrice: 26,
      minimumOrderQuantity: 5,
      offerStartDate: new Date('2026-10-12'),
      offerEndDate: new Date(Date.now() + 48 * 3600000), // 2 days ahead
      offerNotes: 'High harvest yield this week! Offering 31% discount for local families and bulk mess kitchens to prevent wastage.',
      status: 'active'
    },
    {
      productId: pBanana._id.toString(),
      farmerId: farmer2._id.toString(),
      farmerName: 'Kaveri Valley Orchards',
      productName: 'Hilltop Cavendish Bananas (Flash Harvest)',
      productImage: pBanana.image,
      availableQuantity: 25,
      standardPrice: 55,
      offerPrice: 42,
      minimumOrderQuantity: 3,
      offerStartDate: new Date('2026-10-13'),
      offerEndDate: new Date(Date.now() + 72 * 3600000), // 3 days ahead
      offerNotes: 'Fresh harvested bunches ready for immediate consumption. Discounted to clear inventory before weekend.',
      status: 'active'
    },
    {
      productId: pSpinach._id.toString(),
      farmerId: farmer1._id.toString(),
      farmerName: 'Ramasamy Farms',
      productName: 'Country Spinach Palak (Evening Fresh Clearance)',
      productImage: pSpinach.image,
      availableQuantity: 20,
      standardPrice: 25,
      offerPrice: 18,
      minimumOrderQuantity: 3,
      offerStartDate: new Date('2026-10-14'),
      offerEndDate: new Date(Date.now() + 24 * 3600000), // 1 day ahead
      offerNotes: 'Today morning harvest remainder. Maximum nutritional value at clearance price.',
      status: 'active'
    }
  ]);

  console.log('Seeding Orders & Payments...');
  const orderDoc1 = await Order.create({
    orderId: 'FH-ORD-54321',
    userId: customerUser._id.toString(),
    customerName: customerUser.name,
    customerEmail: customerUser.email,
    customerPhone: customerUser.phone,
    shippingAddress: customerUser.addresses[0],
    items: [
      {
        productId: pTomato._id.toString(),
        name: pTomato.name,
        price: pTomato.price,
        quantity: 3,
        unit: pTomato.unit,
        image: pTomato.image,
        farmerName: pTomato.farmerName
      },
      {
        productId: pSpinach._id.toString(),
        name: pSpinach.name,
        price: pSpinach.price,
        quantity: 2,
        unit: pSpinach.unit,
        image: pSpinach.image,
        farmerName: pSpinach.farmerName
      }
    ],
    subtotal: 164,
    deliveryFee: 40,
    tax: 8,
    totalAmount: 212,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    transactionId: 'TXN-FH-456789',
    orderStatus: 'Out for Delivery',
    statusTimeline: [
      { status: 'Placed', timestamp: new Date(Date.now() - 18 * 3600000), note: 'Order placed via UPI' },
      { status: 'Packed', timestamp: new Date(Date.now() - 10 * 3600000), note: 'Freshly harvested and boxed at Ramasamy Farms' },
      { status: 'Out for Delivery', timestamp: new Date(Date.now() - 2 * 3600000), note: 'Handed over to delivery driver Karthik Raja' }
    ],
    estimatedDelivery: new Date(Date.now() + 3600000)
  });

  await Payment.create({
    transactionId: 'TXN-FH-456789',
    orderId: 'FH-ORD-54321',
    userId: customerUser._id.toString(),
    customerName: customerUser.name,
    customerEmail: customerUser.email,
    amount: 212,
    paymentMethod: 'UPI',
    status: 'Completed',
    gatewayReference: 'UPI_REF_98124801'
  });

  console.log('Seeding Delivery Partner Assignment (Module 18)...');
  await Delivery.create({
    orderId: orderDoc1._id,
    deliveryPartnerId: deliveryUser._id,
    deliveryPartnerName: deliveryUser.name,
    pickupAddress: {
      street: 'SF No. 142, Kunnathur Road',
      city: 'Perundurai',
      state: 'Tamil Nadu',
      zipCode: '638052'
    },
    deliveryAddress: {
      street: customerUser.addresses[0].street,
      city: customerUser.addresses[0].city,
      state: customerUser.addresses[0].state,
      zipCode: customerUser.addresses[0].zipCode
    },
    recipientName: customerUser.name,
    recipientPhone: customerUser.phone,
    pickupTime: new Date(Date.now() - 2 * 3600000),
    estimatedDeliveryTime: new Date(Date.now() + 3600000),
    status: 'out_for_delivery',
    notes: 'Fragile fresh greens - keep ventilated',
    distance: 18.5,
    deliveryFee: 65
  });

  console.log('Seeding Bulk Orders (Modules 10 & 11)...');
  await BulkOrder.create({
    bulkOrderId: 'FH-BLK-9081',
    buyerId: bulkBuyerUser._id.toString(),
    buyerName: 'Annamalai Grand Hotel & Messes',
    buyerEmail: bulkBuyerUser.email,
    buyerPhone: bulkBuyerUser.phone,
    buyerType: 'Hotel',
    farmerId: farmer1._id.toString(),
    farmerName: farmer1.farmName,
    items: [
      {
        productId: pTomato._id.toString(),
        name: 'Fresh Organic Farm Tomatoes',
        quantity: 120,
        pricePerUnit: 32,
        unit: 'kg',
        totalPrice: 3840
      },
      {
        productId: pRice._id.toString(),
        name: 'Traditional Brown Ponni Rice',
        quantity: 200,
        pricePerUnit: 78,
        unit: 'kg',
        totalPrice: 15600
      }
    ],
    totalAmount: 19440,
    deliveryAddress: {
      street: '15 Gandhi Road, Central Kitchen',
      city: 'Erode',
      district: 'Erode',
      state: 'Tamil Nadu',
      zipCode: '638001'
    },
    requestedDeliveryDate: new Date(Date.now() + 48 * 3600000),
    status: 'Accepted',
    farmerNote: 'Accepted with special bulk pricing. Harvest scheduled for tomorrow morning.',
    buyerNote: 'Need crates delivered directly to our cold storage loading dock by 8 AM.'
  });

  console.log('Seeding Notifications (Module 23)...');
  await Notification.insertMany([
    {
      userId: customerUser._id,
      type: 'order_status',
      title: 'Produce Out for Delivery! 🚚',
      message: 'Delivery partner Karthik Raja is on his way with your FreshHarvest basket (FH-ORD-54321).',
      priority: 'high',
      isRead: false
    },
    {
      userId: customerUser._id,
      type: 'stock_alert',
      title: 'Flash Surplus Deal Available! 🍅',
      message: 'Ramasamy Farms posted 45kg Surplus Organic Tomatoes at ₹26/kg (31% discount).',
      priority: 'normal',
      isRead: false
    },
    {
      userId: farmerUser1._id,
      type: 'bulk_order',
      title: 'New Bulk Order Accepted',
      message: 'Bulk order FH-BLK-9081 from Annamalai Grand Hotel confirmed for 320kg produce.',
      priority: 'high',
      isRead: false
    }
  ]);

  console.log('Seeding Direct Inquiries (Module 9 & 26)...');
  await ContactInquiry.create({
    userId: customerUser._id,
    farmerId: farmer1._id,
    farmerName: farmer1.farmName,
    productId: pTomato._id,
    productName: pTomato.name,
    inquiryType: 'harvest_schedule',
    subject: 'Next harvest date for bulk cherry tomatoes?',
    message: 'Hello Ramasamy sir, we are hosting a family gathering next weekend and would love 15kg of your organic tomatoes. Will you have fresh stock on Friday?',
    contactEmail: customerUser.email,
    contactPhone: customerUser.phone,
    status: 'responded',
    response: 'Vanakkam Priya madam! Yes, our second field harvest will be completed by Thursday afternoon. You can place the order by Wednesday.'
  });

  console.log('Seeding Reviews (Module 22)...');
  await Review.create({
    orderId: 'FH-ORD-12345',
    productId: pTomato._id.toString(),
    farmerId: farmer1._id.toString(),
    reviewerId: customerUser._id.toString(),
    reviewerName: 'Priya Sundaram',
    rating: 5,
    comment: 'The sweetest tomatoes we have tasted in years! You can literally smell the earth and natural care. Arrived super fresh.'
  });

  console.log('✨ FreshHarvest Database Seeding COMPLETE! All 32 modules are connected and loaded.');
  process.exit(0);
}

seedDatabase().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
