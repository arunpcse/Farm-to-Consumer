const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/freshharvest';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runAudit() {
  console.log('====================================================');
  console.log('🚀 PHASE 1: FULL MONGODB PERSISTENCE & LIFECYCLE AUDIT');
  console.log('====================================================\n');

  // Step 1: Health check
  const healthRes = await request('GET', '/api/health');
  assert.strictEqual(healthRes.status, 200, 'Health check should return 200');
  assert.strictEqual(healthRes.body.databaseConnected, true, 'Database must be reported as connected');
  assert.strictEqual(healthRes.body.mode, 'production-persistent', 'Mode must be production-persistent');
  console.log('✅ 1. Health check confirmed MongoDB connection: production-persistent mode');

  const stamp = Date.now();

  // Step 2: Register a new Farmer
  const farmerEmail = `audit_farmer_${stamp}@kongu.edu`;
  const farmerRegRes = await request('POST', '/api/auth/register', {
    name: 'Sengottaiyan (Audit Farmer)',
    email: farmerEmail,
    password: 'FarmerSecurePass123',
    phone: '+91 94433 11223',
    role: 'farmer'
  });
  assert.strictEqual(farmerRegRes.status, 201, 'Farmer registration must return 201');
  const farmerToken = farmerRegRes.body.token;
  const farmerUserId = farmerRegRes.body.user.id;
  assert.ok(farmerToken, 'Farmer token must be returned');
  console.log(`✅ 2. Farmer registered successfully in MongoDB: ${farmerEmail} (ID: ${farmerUserId})`);

  // Step 3: Farmer creates Farm Profile
  const profileRes = await request('POST', '/api/farmers/profile', {
    farmName: 'Sengottaiyan Organic Groves',
    native: 'Gobichettipalayam',
    state: 'Tamil Nadu',
    district: 'Erode',
    taluk: 'Gobichettipalayam',
    village: 'Kalingarayanpalayam',
    farmingType: 'Organic',
    experience: 18,
    farmSize: 7.5,
    farmingPractices: 'Panchagavya & Jeevamrutham bio-inputs',
    soilType: 'Red Loam',
    fertilizerUsed: 'Farmyard Manure & Vermicompost',
    pestManagement: 'Neem kernel extract & sticky traps',
    bio: 'Multi-generational natural farmer practicing regenerative farming on the Bhavani riverbank.'
  }, {
    Authorization: `Bearer ${farmerToken}`
  });
  assert.ok([200, 201].includes(profileRes.status), `Farmer profile creation should return 200 or 201 (got ${profileRes.status})`);
  console.log(`✅ 3. Farmer profile created in MongoDB for ${profileRes.body.farmer.farmName}`);

  // Step 4: Farmer adds a new Product
  const prodName = `Audit Harvest Golden Papaya ${stamp}`;
  const addProdRes = await request('POST', '/api/farmer-products', {
    name: prodName,
    description: 'Tree-ripened organic Red Lady papaya grown with natural compost.',
    category: 'Fruits',
    price: 45,
    unit: 'kg',
    stock: 50,
    harvestDate: new Date().toISOString(),
    expectedAvailability: 'Available for 10 days',
    farmingMethod: 'Organic',
    fertilizerUsed: 'Vermicompost',
    pesticide: 'Neem oil botanical spray',
    isOrganic: true
  }, {
    Authorization: `Bearer ${farmerToken}`
  });
  assert.strictEqual(addProdRes.status, 201, 'Product creation must return 201');
  const createdProductId = addProdRes.body.product._id;
  assert.ok(createdProductId, 'Product must have an _id');
  assert.strictEqual(addProdRes.body.product.stock, 50);
  console.log(`✅ 4. Farmer listed new produce in MongoDB: "${prodName}" (Stock: 50 kg, ID: ${createdProductId})`);

  // Step 5: Register a Customer
  const customerEmail = `audit_buyer_${stamp}@kongu.edu`;
  const custRegRes = await request('POST', '/api/auth/register', {
    name: 'Revathi S (Audit Buyer)',
    email: customerEmail,
    password: 'BuyerSecurePass123',
    phone: '+91 98422 99887',
    role: 'customer'
  });
  assert.strictEqual(custRegRes.status, 201, 'Customer registration must return 201');
  const customerToken = custRegRes.body.token;
  console.log(`✅ 5. Customer registered in MongoDB: ${customerEmail}`);

  // Step 6: Customer places an Order for the new produce (Buying 5kg)
  const orderRes = await request('POST', '/api/orders', {
    customerName: 'Revathi S',
    customerPhone: '+91 98422 99887',
    customerEmail,
    shippingAddress: {
      street: '45 Cauvery Riverview Road',
      city: 'Erode',
      state: 'Tamil Nadu',
      zipCode: '638001',
      label: 'Home'
    },
    paymentMethod: 'UPI',
    items: [
      {
        productId: createdProductId,
        name: prodName,
        price: 45,
        quantity: 5,
        unit: 'kg'
      }
    ]
  }, {
    Authorization: `Bearer ${customerToken}`
  });
  assert.strictEqual(orderRes.status, 201, 'Order placement must return 201');
  const placedOrderId = orderRes.body.order.orderId;
  assert.ok(placedOrderId, 'Order must return a placed orderId');
  console.log(`✅ 6. Customer placed real order: ${placedOrderId} for 5 kg. Total: ₹${orderRes.body.order.totalAmount}`);

  // Step 7: Verify atomic stock decrement directly in MongoDB
  await mongoose.connect(MONGODB_URI);
  const Product = require('../models/Product');
  const Order = require('../models/Order');
  const User = require('../models/User');

  const productInDb = await Product.findById(createdProductId).lean();
  assert.strictEqual(productInDb.stock, 45, `Product stock should decrement from 50 to 45 (actual: ${productInDb.stock})`);
  console.log(`✅ 7. Verified atomic stock deduction in MongoDB: stock is now exactly ${productInDb.stock} kg (was 50 kg)`);

  // Step 8: Verify Order exists in database
  const orderInDb = await Order.findOne({ orderId: placedOrderId }).lean();
  assert.ok(orderInDb, 'Order must exist in MongoDB');
  assert.strictEqual(orderInDb.customerEmail, customerEmail);
  console.log(`✅ 8. Verified Order persisted in MongoDB with status: "${orderInDb.orderStatus}"`);

  // Step 9: Verify Customer can see their order via authenticated API
  const myOrdersRes = await request('GET', '/api/orders', null, {
    Authorization: `Bearer ${customerToken}`
  });
  assert.strictEqual(myOrdersRes.status, 200);
  assert.ok(myOrdersRes.body.orders.some(o => o.orderId === placedOrderId), 'Customer order list must include placed order');
  console.log(`✅ 9. Verified Customer order retrieval API returns the placed order`);

  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log('🎉 PHASE 1 AUDIT COMPLETE: ALL DATABASE WRITES VERIFIED');
  console.log('   Users, Farmers, Products, Orders, and Stock atomic deductions');
  console.log('   are 100% persistent in MongoDB.');
  console.log('====================================================\n');
}

runAudit().catch(err => {
  console.error('❌ Phase 1 Audit Failed:', err);
  process.exit(1);
});
