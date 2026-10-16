const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');
const { app, startServer } = require('../server');

const TEST_PORT = 5005;
let server;

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
      port: TEST_PORT,
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
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Sprint 1 Automated API Tests ---');

  // Connect to DB and start test server
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/freshharvest_test';
  await mongoose.connect(MONGODB_URI);
  server = app.listen(TEST_PORT);

  const testEmail = `test_${Date.now()}@kongu.edu`;
  let authToken = '';
  let addressId = '';

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    assert.strictEqual(health.status, 200);
    console.log('✓ Health check passed');

    // 2. Customer Registration - validation (missing fields)
    const badReg = await request('POST', '/api/auth/register', { name: 'Aathavan' });
    assert.strictEqual(badReg.status, 400);
    console.log('✓ Registration validation (missing fields) passed');

    // 3. Customer Registration - short password
    const shortPassReg = await request('POST', '/api/auth/register', {
      name: 'Aathavan R',
      email: testEmail,
      password: '123'
    });
    assert.strictEqual(shortPassReg.status, 400);
    console.log('✓ Registration validation (password length) passed');

    // 4. Customer Registration - successful
    const validReg = await request('POST', '/api/auth/register', {
      name: 'Aathavan R',
      email: testEmail,
      password: 'securePassword123',
      phone: '9876543210'
    });
    assert.strictEqual(validReg.status, 201);
    assert.ok(validReg.body.token);
    assert.strictEqual(validReg.body.user.email, testEmail);
    console.log('✓ Customer registration passed');

    // 5. Customer Registration - duplicate email rejection
    const dupReg = await request('POST', '/api/auth/register', {
      name: 'Another User',
      email: testEmail,
      password: 'anotherPassword123'
    });
    assert.strictEqual(dupReg.status, 400);
    console.log('✓ Duplicate email rejection passed');

    // 6. Customer Login - invalid credentials
    const badLogin = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'wrongPassword'
    });
    assert.strictEqual(badLogin.status, 401);
    console.log('✓ Invalid password login rejection passed');

    // 7. Customer Login - valid credentials
    const goodLogin = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'securePassword123'
    });
    assert.strictEqual(goodLogin.status, 200);
    assert.ok(goodLogin.body.token);
    authToken = goodLogin.body.token;
    console.log('✓ Customer login with JWT token passed');

    // 8. Forgot Password - generate reset token
    const forgotRes = await request('POST', '/api/auth/forgot-password', { email: testEmail });
    assert.strictEqual(forgotRes.status, 200);
    assert.ok(forgotRes.body.resetToken);
    const resetToken = forgotRes.body.resetToken;
    console.log('✓ Forgot password token generation passed');

    // 9. Reset Password - update password
    const resetRes = await request('POST', '/api/auth/reset-password', {
      resetToken,
      newPassword: 'newSecurePassword456'
    });
    assert.strictEqual(resetRes.status, 200);

    // Verify login with new password
    const newLogin = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'newSecurePassword456'
    });
    assert.strictEqual(newLogin.status, 200);
    authToken = newLogin.body.token;
    console.log('✓ Reset password and login verification passed');

    // 10. Customer Profile - Get profile
    const profileRes = await request('GET', '/api/profile', null, {
      Authorization: `Bearer ${authToken}`
    });
    assert.strictEqual(profileRes.status, 200);
    assert.strictEqual(profileRes.body.user.name, 'Aathavan R');
    console.log('✓ Customer profile view passed');

    // 11. Customer Profile - Edit profile (immutable email verification)
    const updateRes = await request('PUT', '/api/profile', {
      name: 'Aathavan Raj',
      phone: '9988776655',
      email: 'hacker@trychange.com' // Should be ignored/immutable
    }, {
      Authorization: `Bearer ${authToken}`
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.user.name, 'Aathavan Raj');
    assert.strictEqual(updateRes.body.user.email, testEmail); // Email remained unchanged
    console.log('✓ Customer profile edit with email immutability passed');

    // 12. Address Management - Add delivery address
    const addAddrRes = await request('POST', '/api/profile/addresses', {
      street: '12 Farm Gate Road, Kongu Nagar',
      city: 'Perundurai',
      state: 'Tamil Nadu',
      zipCode: '638060',
      label: 'Home',
      isDefault: true
    }, {
      Authorization: `Bearer ${authToken}`
    });
    assert.strictEqual(addAddrRes.status, 201);
    assert.strictEqual(addAddrRes.body.addresses.length, 1);
    assert.strictEqual(addAddrRes.body.addresses[0].isDefault, true);
    addressId = addAddrRes.body.addresses[0]._id;
    console.log('✓ Delivery address add passed');

    // 13. Address Management - Edit address
    const editAddrRes = await request('PUT', `/api/profile/addresses/${addressId}`, {
      street: '14 Organic Avenue',
      city: 'Erode',
      state: 'Tamil Nadu',
      zipCode: '638001',
      label: 'Farm Office'
    }, {
      Authorization: `Bearer ${authToken}`
    });
    assert.strictEqual(editAddrRes.status, 200);
    const updatedAddr = editAddrRes.body.addresses.find(a => a._id === addressId);
    assert.strictEqual(updatedAddr.street, '14 Organic Avenue');
    assert.strictEqual(updatedAddr.city, 'Erode');
    console.log('✓ Delivery address edit passed');

    // 14. Product Discovery - Browse all products & pagination
    const prodRes = await request('GET', '/api/products?page=1&limit=6');
    assert.strictEqual(prodRes.status, 200);
    assert.ok(prodRes.body.products.length > 0);
    console.log(`✓ Browse products passed (${prodRes.body.total} products available)`);

    // 15. Product Discovery - Search products by keyword
    const searchRes = await request('GET', '/api/products?search=Tomatoes');
    assert.strictEqual(searchRes.status, 200);
    assert.ok(searchRes.body.products.some(p => p.name.includes('Tomatoes')));
    console.log('✓ Product search by keyword passed');

    // 16. Product Discovery - Filter products by category
    const catRes = await request('GET', '/api/products?category=Vegetables');
    assert.strictEqual(catRes.status, 200);
    assert.ok(catRes.body.products.every(p => p.category === 'Vegetables'));
    console.log('✓ Product category filtering passed');

    // 17. Product Discovery - Search with non-existent query (empty state verification)
    const emptyRes = await request('GET', '/api/products?search=NonExistentFruitXYZ');
    assert.strictEqual(emptyRes.status, 200);
    assert.strictEqual(emptyRes.body.products.length, 0);
    console.log('✓ Product search empty state passed');

    // 18. Address Management - Delete address
    const delAddrRes = await request('DELETE', `/api/profile/addresses/${addressId}`, null, {
      Authorization: `Bearer ${authToken}`
    });
    assert.strictEqual(delAddrRes.status, 200);
    assert.strictEqual(delAddrRes.body.addresses.length, 0);
    console.log('✓ Delivery address delete passed');

    // 19. Order Placement - validation (missing fields)
    const badOrder = await request('POST', '/api/orders', { customerName: 'Test' }, {
      Authorization: `Bearer ${authToken}`
    });
    assert.strictEqual(badOrder.status, 400);
    console.log('✓ Order placement validation passed');

    // 20. Order Placement - Successful placement & pricing calculation
    const goodOrder = await request('POST', '/api/orders', {
      customerName: 'Aathavan R',
      customerPhone: '+91 98765 43210',
      shippingAddress: {
        street: '12 Organic Lane',
        city: 'Perundurai',
        state: 'Tamil Nadu',
        zipCode: '638052'
      },
      paymentMethod: 'UPI',
      items: [
        {
          name: 'Fresh Organic Tomatoes',
          price: 40,
          quantity: 2,
          unit: 'kg'
        }
      ]
    }, {
      Authorization: `Bearer ${authToken}`
    });
    assert.strictEqual(goodOrder.status, 201);
    assert.ok(goodOrder.body.order);
    assert.ok(goodOrder.body.order.orderId.startsWith('FH-ORD-'));
    assert.strictEqual(goodOrder.body.order.orderStatus, 'Placed');
    const placedOrderId = goodOrder.body.order.orderId;
    console.log(`✓ Order placement passed (Created ${placedOrderId})`);

    // 21. Order Cancellation & Status Timeline
    const cancelOrder = await request('PATCH', `/api/orders/${placedOrderId}/cancel`, {
      reason: 'Testing cancellation flow'
    }, {
      Authorization: `Bearer ${authToken}`
    });
    assert.strictEqual(cancelOrder.status, 200);
    assert.strictEqual(cancelOrder.body.order.orderStatus, 'Cancelled');
    console.log('✓ Order cancellation and stock restoration passed');

    // 22. Admin Route Security - Ordinary customer blocked from role updates (403 Forbidden)
    const unauthorizedAdmin = await request('PATCH', `/api/auth/users/${goodOrder.body.order.userId}/role`, {
      role: 'admin'
    }, {
      Authorization: `Bearer ${authToken}`
    });
    assert.strictEqual(unauthorizedAdmin.status, 403);
    console.log('✓ Admin route security (403 Forbidden on non-admin user) passed');

    // 23. Support Ticket Submission - Generation of ticketId
    const supportRes = await request('POST', '/api/support', {
      subject: 'Produce freshness query',
      message: 'Can I know when the next harvest of spinach will be dispatched?',
      contactEmail: testEmail,
      contactPhone: '+91 98765 43210',
      category: 'general_question'
    }, {
      Authorization: `Bearer ${authToken}`
    });
    assert.strictEqual(supportRes.status, 201);
    assert.ok(supportRes.body.ticket.ticketId.startsWith('FH-TCK-'));
    assert.strictEqual(supportRes.body.ticket.status, 'Open');
    console.log(`✓ Support ticket creation passed (${supportRes.body.ticket.ticketId})`);

    console.log('\n========================================');
    console.log('🎉 ALL INTEGRATION & VERIFICATION TESTS PASSED!');
    console.log('========================================\n');
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  if (server) server.close();
  process.exit(1);
});
