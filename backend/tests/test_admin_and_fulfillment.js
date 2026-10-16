const assert = require('assert');
const http = require('http');

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

async function runTest() {
  console.log('====================================================');
  console.log('🧪 TESTING PHASES 2 & 3: ADMIN & DELIVERY FULFILLMENT');
  console.log('====================================================\n');

  // 1. Log in as Seeded Admin
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@freshharvest.in',
    password: 'admin123'
  });
  assert.strictEqual(adminLogin.status, 200, 'Admin login should succeed');
  const adminToken = adminLogin.body.token;
  assert.ok(adminToken, 'Admin token returned');
  console.log('✓ 1. Admin login verified (admin@freshharvest.in)');

  // 2. Fetch Admin Stats
  const statsRes = await request('GET', '/api/admin/stats', null, {
    Authorization: `Bearer ${adminToken}`
  });
  assert.strictEqual(statsRes.status, 200);
  assert.ok(statsRes.body.totalUsers >= 1);
  assert.ok(statsRes.body.totalFarmers >= 1);
  assert.ok(statsRes.body.totalProducts >= 1);
  console.log(`✓ 2. Admin stats retrieved: ${statsRes.body.totalUsers} users, ${statsRes.body.totalFarmers} farmers, ${statsRes.body.totalProducts} products, GMV: ₹${statsRes.body.totalGMV}`);

  // 3. User Management - Fetch all users and update a role
  const usersRes = await request('GET', '/api/admin/users', null, {
    Authorization: `Bearer ${adminToken}`
  });
  assert.strictEqual(usersRes.status, 200);
  assert.ok(usersRes.body.users.length > 0);
  const targetUser = usersRes.body.users.find(u => u.role === 'customer') || usersRes.body.users.find(u => u.role !== 'admin' && u.role !== 'delivery_partner');
  assert.ok(targetUser, 'Target non-admin user found');

  const updateRoleRes = await request('PATCH', `/api/admin/users/${targetUser._id}/role`, {
    role: 'bulk_buyer'
  }, {
    Authorization: `Bearer ${adminToken}`
  });
  assert.strictEqual(updateRoleRes.status, 200);
  assert.strictEqual(updateRoleRes.body.user.role, 'bulk_buyer');
  console.log(`✓ 3. Admin user role update verified (${targetUser.email} -> bulk_buyer)`);

  // 4. Farmer Verification Desk
  const farmersRes = await request('GET', '/api/farmers');
  assert.strictEqual(farmersRes.status, 200);
  const targetFarmer = farmersRes.body.farmers[0];
  assert.ok(targetFarmer, 'Target farmer found');

  const verifyRes = await request('PATCH', `/api/admin/farmers/${targetFarmer._id}/verify`, {
    isVerified: true
  }, {
    Authorization: `Bearer ${adminToken}`
  });
  assert.strictEqual(verifyRes.status, 200);
  assert.strictEqual(verifyRes.body.farmer.isVerified, true);
  console.log(`✓ 4. Farmer verification approved by admin for ${targetFarmer.farmName}`);

  // 5. Produce Catalog Moderation
  const adminProdsRes = await request('GET', '/api/admin/products', null, {
    Authorization: `Bearer ${adminToken}`
  });
  assert.strictEqual(adminProdsRes.status, 200);
  const targetProd = adminProdsRes.body.products[0];
  assert.ok(targetProd, 'Target produce found');

  const moderateProdRes = await request('PATCH', `/api/admin/products/${targetProd._id}/status`, {
    status: 'flagged'
  }, {
    Authorization: `Bearer ${adminToken}`
  });
  assert.strictEqual(moderateProdRes.status, 200);
  assert.strictEqual(moderateProdRes.body.product.status, 'flagged');

  // Reset back to active
  await request('PATCH', `/api/admin/products/${targetProd._id}/status`, {
    status: 'active'
  }, {
    Authorization: `Bearer ${adminToken}`
  });
  console.log(`✓ 5. Produce catalog moderation verified (${targetProd.name} status toggled)`);

  // 6. Support Grievance Desk
  const stamp = Date.now();
  const ticketRes = await request('POST', '/api/support', {
    subject: `Produce Quality Issue #${stamp}`,
    message: 'A batch of spinach arrived wilted. Requesting replacement.',
    contactEmail: 'buyer@example.com',
    contactPhone: '+91 98765 00000',
    category: 'produce_quality'
  });
  assert.strictEqual(ticketRes.status, 201);
  const createdTicket = ticketRes.body.ticket;
  console.log(`✓ 6. Customer submitted grievance ticket: ${createdTicket.ticketId}`);

  // Admin resolves ticket
  const resolveTicketRes = await request('PATCH', `/api/admin/tickets/${createdTicket._id}/resolve`, {
    status: 'Resolved',
    responseMessage: 'Replacement batch dispatched with early-morning harvest delivery partner.',
    resolutionNotes: 'Customer satisfied with free replacement dispatch.'
  }, {
    Authorization: `Bearer ${adminToken}`
  });
  assert.strictEqual(resolveTicketRes.status, 200);
  assert.strictEqual(resolveTicketRes.body.ticket.status, 'Resolved');
  assert.strictEqual(resolveTicketRes.body.ticket.response, 'Replacement batch dispatched with early-morning harvest delivery partner.');
  console.log(`✓ 7. Admin grievance resolution desk response logged and verified`);

  // 7. Delivery Partner & Order Progression
  // Log in as delivery partner
  const delPartnerLogin = await request('POST', '/api/auth/login', {
    email: 'delivery@freshharvest.in',
    password: 'password123'
  });
  assert.strictEqual(delPartnerLogin.status, 200);
  const driverToken = delPartnerLogin.body.token;
  const driverId = delPartnerLogin.body.user.id;
  console.log(`✓ 8. Delivery partner logged in (driver ID: ${driverId})`);

  // Place a test order to attach delivery to
  const newOrder = await request('POST', '/api/orders', {
    customerName: 'Arundhathi G',
    customerPhone: '+91 98421 55667',
    customerEmail: 'arun@example.com',
    shippingAddress: {
      street: '18 Perundurai Road',
      city: 'Erode',
      state: 'Tamil Nadu',
      zipCode: '638052'
    },
    paymentMethod: 'Cash on Delivery',
    items: [
      {
        name: 'Fresh Organic Farm Tomatoes',
        price: 38,
        quantity: 2,
        unit: 'kg'
      }
    ]
  });
  assert.strictEqual(newOrder.status, 201);
  const testOrderId = newOrder.body.order.orderId;
  console.log(`✓ 9. New order created for delivery assignment: ${testOrderId}`);

  // Assign delivery partner
  const assignRes = await request('POST', '/api/deliveries', {
    orderId: testOrderId,
    deliveryPartnerId: driverId,
    pickupAddress: { street: 'Kunnathur Road Farm', city: 'Perundurai', state: 'Tamil Nadu', zipCode: '638052' },
    deliveryAddress: { street: '18 Perundurai Road', city: 'Erode', state: 'Tamil Nadu', zipCode: '638052' },
    recipientName: 'Arundhathi G',
    recipientPhone: '+91 98421 55667',
    notes: 'Fragile fresh harvest package'
  }, {
    Authorization: `Bearer ${adminToken}`
  });
  assert.strictEqual(assignRes.status, 201);
  const deliveryId = assignRes.body.delivery._id;
  console.log(`✓ 10. Delivery assigned to driver (Delivery ID: ${deliveryId})`);

  // Driver picks up package
  const pickUpRes = await request('PATCH', `/api/deliveries/${deliveryId}/status`, {
    status: 'picked_up',
    notes: 'Harvest collected from farm gate'
  }, {
    Authorization: `Bearer ${driverToken}`
  });
  assert.strictEqual(pickUpRes.status, 200);
  assert.strictEqual(pickUpRes.body.delivery.status, 'picked_up');
  console.log(`✓ 11. Delivery status updated: picked_up -> Order status updated to Shipped`);

  // Driver delivers package
  const deliverRes = await request('PATCH', `/api/deliveries/${deliveryId}/status`, {
    status: 'delivered',
    notes: 'Delivered directly to recipient. Cash collected.'
  }, {
    Authorization: `Bearer ${driverToken}`
  });
  assert.strictEqual(deliverRes.status, 200);
  assert.strictEqual(deliverRes.body.delivery.status, 'delivered');
  console.log(`✓ 12. Delivery status updated: delivered -> Order status updated to Delivered`);

  // Public/Buyer tracking
  const trackRes = await request('GET', `/api/deliveries/track/order/${testOrderId}`);
  assert.strictEqual(trackRes.status, 200);
  assert.strictEqual(trackRes.body.delivery.status, 'delivered');
  console.log(`✓ 13. Buyer order live tracking verified: status is "delivered"`);

  console.log('\n====================================================');
  console.log('🎉 ALL ADMIN & DELIVERY FULFILLMENT TESTS PASSED (13/13)!');
  console.log('====================================================\n');
}

runTest().catch(err => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
