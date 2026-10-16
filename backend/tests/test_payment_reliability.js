/**
 * FreshHarvest — Phase 4: Payment and Checkout Reliability Automated Test Suite
 *
 * Tests:
 * 1. Idempotency protection (repeated order submission returns duplicate replay without deducting stock twice)
 * 2. Gateway order initialization in sandbox mode (INR, paise calculation, order_rzp_test_ prefix)
 * 3. Cryptographic server-side HMAC-SHA256 signature verification (Valid signature confirms order & payment)
 * 4. Tampered / forged signature rejection (400 Bad Request, status marked Payment Failed, stock safely restored)
 * 5. Payment abandonment / cancellation & automated produce stock rollback
 * 6. Payment retry workflow (re-reserves stock safely, resets status, issues fresh gateway order)
 * 7. Duplicate payment prevention (blocking new gateway orders for already paid orders)
 * 8. Cash on Delivery (COD) flow and delivery reconciliation upon fulfillment
 * 9. Stock boundary validation (insufficient stock rejection, preventing negative inventory)
 */

const http = require('http');
const assert = require('assert');
const crypto = require('crypto');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/freshharvest';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'freshharvest_secret_key_123';

function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 TESTING PHASE 4: PAYMENT AND CHECKOUT RELIABILITY');
  console.log('====================================================\n');

  await mongoose.connect(MONGODB_URI);
  const Product = require('../models/Product');
  const Order = require('../models/Order');
  const Payment = require('../models/Payment');

  const ts = Date.now();
  const testCustomerEmail = `pay_audit_${ts}@kongu.edu`;

  // Register a test customer
  const regRes = await request('POST', '/api/auth/register', {
    name: 'Audit Customer',
    email: testCustomerEmail,
    password: 'Password123!',
    phone: '9842211223',
    role: 'customer'
  });
  assert.strictEqual(regRes.status, 201);
  const customerToken = regRes.body.token;
  const customerId = regRes.body.user.id;
  const authHeader = { Authorization: `Bearer ${customerToken}` };
  console.log(`✓ 1. Test customer registered: ${testCustomerEmail}`);

  // Create an audited produce item with known starting stock (50 kg)
  const testProd = new Product({
    name: `Payment Test Alphonso Mango ${ts}`,
    category: 'Fruits',
    description: 'Farm fresh sweet Alphonso mangoes for payment reliability audit',
    price: 100,
    unit: 'kg',
    stock: 50,
    farmerName: 'Erode Agro Tech',
    isOrganic: true,
    status: 'active'
  });
  await testProd.save();
  const testProdId = testProd._id.toString();
  console.log(`✓ 2. Audit produce created in DB: "${testProd.name}" (Initial stock: 50 kg, Price: ₹100/kg)`);

  // ---------------------------------------------------------
  // Test 3: Idempotency Protection
  // ---------------------------------------------------------
  const idempotencyKey = `idem_key_${ts}_${crypto.randomBytes(4).toString('hex')}`;
  const orderData = {
    idempotencyKey,
    customerName: 'Audit Customer',
    customerEmail: testCustomerEmail,
    customerPhone: '9842211223',
    shippingAddress: {
      street: '12 KEC Avenue',
      city: 'Perundurai',
      state: 'Tamil Nadu',
      zipCode: '638052'
    },
    paymentMethod: 'UPI',
    items: [
      {
        productId: testProdId,
        name: testProd.name,
        price: 100,
        quantity: 5,
        unit: 'kg'
      }
    ]
  };

  const initialOrderRes = await request('POST', '/api/orders', orderData, {
    ...authHeader,
    'Idempotency-Key': idempotencyKey
  });
  assert.strictEqual(initialOrderRes.status, 201, 'Initial order must return 201');
  const placedOrderId = initialOrderRes.body.order.orderId;
  assert.ok(placedOrderId, 'Order must have a valid orderId');
  console.log(`✓ 3a. Initial order placed: ${placedOrderId} (5 kg purchased)`);

  // Verify stock was decremented from 50 to 45
  let prodInDb = await Product.findById(testProdId);
  assert.strictEqual(prodInDb.stock, 45, 'Stock must decrement to 45');
  console.log('✓ 3b. Stock decremented from 50 kg to 45 kg in MongoDB');

  // Re-submit identical order with SAME idempotency key (simulating duplicate network request)
  const duplicateOrderRes = await request('POST', '/api/orders', orderData, {
    ...authHeader,
    'Idempotency-Key': idempotencyKey
  });
  assert.strictEqual(duplicateOrderRes.status, 200, 'Duplicate replay must return 200 OK');
  assert.strictEqual(duplicateOrderRes.body.isDuplicateReplay, true, 'isDuplicateReplay flag must be true');
  assert.strictEqual(duplicateOrderRes.body.order.orderId, placedOrderId, 'Must return identical order');

  // Verify stock was NOT decremented a second time!
  prodInDb = await Product.findById(testProdId);
  assert.strictEqual(prodInDb.stock, 45, 'Duplicate request must NOT decrement stock again (remains 45 kg)');
  console.log('✓ 3c. Idempotency verified: Duplicate order blocked & stock not deducted twice');

  // ---------------------------------------------------------
  // Test 4: Gateway Order Creation in Sandbox Mode
  // ---------------------------------------------------------
  const gatewayOrderRes = await request('POST', '/api/payments/create-gateway-order', {
    orderId: placedOrderId,
    amount: initialOrderRes.body.order.totalAmount
  }, authHeader);
  assert.strictEqual(gatewayOrderRes.status, 200);
  assert.ok(gatewayOrderRes.body.gatewayOrderId.startsWith('order_rzp_test_'));
  assert.strictEqual(gatewayOrderRes.body.currency, 'INR');
  assert.strictEqual(gatewayOrderRes.body.amount, Math.round(initialOrderRes.body.order.totalAmount * 100));
  const gatewayOrderId = gatewayOrderRes.body.gatewayOrderId;
  console.log(`✓ 4. Sandbox Gateway Order created: ${gatewayOrderId} (Amount: ${gatewayOrderRes.body.amount} paise)`);

  // ---------------------------------------------------------
  // Test 5: Rejection of Forged / Tampered Payment Signature
  // ---------------------------------------------------------
  // We'll create another order specifically to test signature forgery & automatic stock rollback
  const forgeOrderRes = await request('POST', '/api/orders', {
    customerName: 'Audit Customer',
    customerEmail: testCustomerEmail,
    customerPhone: '9842211223',
    shippingAddress: {
      street: '12 KEC Avenue',
      city: 'Perundurai',
      state: 'Tamil Nadu',
      zipCode: '638052'
    },
    paymentMethod: 'Credit/Debit Card',
    items: [
      {
        productId: testProdId,
        name: testProd.name,
        price: 100,
        quantity: 10,
        unit: 'kg'
      }
    ]
  }, authHeader);
  assert.strictEqual(forgeOrderRes.status, 201);
  const forgeOrderId = forgeOrderRes.body.order.orderId;

  // Stock should now be 45 - 10 = 35 kg
  prodInDb = await Product.findById(testProdId);
  assert.strictEqual(prodInDb.stock, 35);
  console.log(`✓ 5a. Created order ${forgeOrderId} reserving 10 kg (Stock now 35 kg)`);

  // Submit forged signature
  const fakePaymentId = 'pay_fake_signature_hack_999';
  const badSignature = '000000000000000000000000000000000000000000000000000000000000dead';
  const forgeVerifyRes = await request('POST', '/api/payments/verify-signature', {
    orderId: forgeOrderId,
    razorpay_order_id: gatewayOrderId,
    razorpay_payment_id: fakePaymentId,
    razorpay_signature: badSignature
  }, authHeader);

  assert.strictEqual(forgeVerifyRes.status, 400, 'Tampered signature must be rejected with 400');
  assert.strictEqual(forgeVerifyRes.body.verified, false);
  console.log('✓ 5b. Forged payment signature rejected by server with 400 Bad Request');

  // Verify server automatically marked order as Payment Failed and restored stock back to 45 kg
  const failedOrder = await Order.findOne({ orderId: forgeOrderId });
  assert.strictEqual(failedOrder.orderStatus, 'Payment Failed');
  assert.strictEqual(failedOrder.paymentStatus, 'Failed');

  prodInDb = await Product.findById(testProdId);
  assert.strictEqual(prodInDb.stock, 45, 'Stock must be safely restored to 45 kg after signature failure');
  console.log('✓ 5c. Safe rollback verified: Reserved 10 kg restored back to product catalog (Stock: 45 kg)');

  // ---------------------------------------------------------
  // Test 6: Server-side Cryptographic HMAC-SHA256 Signature Verification (Valid)
  // ---------------------------------------------------------
  const realPaymentId = 'pay_rzp_mock_' + crypto.randomBytes(5).toString('hex');
  const validSignaturePayload = `${gatewayOrderId}|${realPaymentId}`;
  const validSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(validSignaturePayload)
    .digest('hex');

  const validVerifyRes = await request('POST', '/api/payments/verify-signature', {
    orderId: placedOrderId,
    razorpay_order_id: gatewayOrderId,
    razorpay_payment_id: realPaymentId,
    razorpay_signature: validSignature
  }, authHeader);

  assert.strictEqual(validVerifyRes.status, 200);
  assert.strictEqual(validVerifyRes.body.verified, true);
  console.log(`✓ 6a. Valid HMAC-SHA256 signature verified for ${placedOrderId}`);

  // Verify database state for Order and Payment
  const confirmedOrder = await Order.findOne({ orderId: placedOrderId });
  assert.strictEqual(confirmedOrder.paymentStatus, 'Paid');
  assert.strictEqual(confirmedOrder.orderStatus, 'Placed');

  const confirmedPayment = await Payment.findOne({ orderId: placedOrderId });
  assert.strictEqual(confirmedPayment.status, 'Completed');
  assert.strictEqual(confirmedPayment.razorpayPaymentId, realPaymentId);
  console.log('✓ 6b. Order & Payment records reconciled to Paid / Completed in MongoDB');

  // Idempotent re-verification test
  const reverifyRes = await request('POST', '/api/payments/verify-signature', {
    orderId: placedOrderId,
    razorpay_order_id: gatewayOrderId,
    razorpay_payment_id: realPaymentId,
    razorpay_signature: validSignature
  }, authHeader);
  assert.strictEqual(reverifyRes.status, 200);
  assert.strictEqual(reverifyRes.body.alreadyProcessed, true);
  console.log('✓ 6c. Duplicate signature verification handled idempotently without error');

  // ---------------------------------------------------------
  // Test 7: Duplicate Payment Prevention on Paid Orders
  // ---------------------------------------------------------
  const dupPaymentAttempt = await request('POST', '/api/payments/create-gateway-order', {
    orderId: placedOrderId,
    amount: confirmedOrder.totalAmount
  }, authHeader);
  assert.strictEqual(dupPaymentAttempt.status, 400, 'Cannot create gateway order for already paid order');
  assert.strictEqual(dupPaymentAttempt.body.alreadyPaid, true);
  console.log('✓ 7. Duplicate payment prevention verified: Attempt to re-pay paid order blocked');

  // ---------------------------------------------------------
  // Test 8: Payment Cancellation & Safe Stock Rollback (/api/payments/fail)
  // ---------------------------------------------------------
  const abandonOrderRes = await request('POST', '/api/orders', {
    customerName: 'Audit Customer',
    customerEmail: testCustomerEmail,
    customerPhone: '9842211223',
    shippingAddress: {
      street: '12 KEC Avenue',
      city: 'Perundurai',
      state: 'Tamil Nadu',
      zipCode: '638052'
    },
    paymentMethod: 'Net Banking',
    items: [
      {
        productId: testProdId,
        name: testProd.name,
        price: 100,
        quantity: 8,
        unit: 'kg'
      }
    ]
  }, authHeader);
  assert.strictEqual(abandonOrderRes.status, 201);
  const abandonOrderId = abandonOrderRes.body.order.orderId;

  // Stock decremented by 8: 45 - 8 = 37 kg
  prodInDb = await Product.findById(testProdId);
  assert.strictEqual(prodInDb.stock, 37);
  console.log(`✓ 8a. Created order ${abandonOrderId} (reserving 8 kg, stock now 37 kg)`);

  // Customer closes payment modal or transaction aborts
  const failRes = await request('POST', '/api/payments/fail', {
    orderId: abandonOrderId,
    reason: 'Customer dismissed payment gateway window'
  }, authHeader);
  assert.strictEqual(failRes.status, 200);
  assert.strictEqual(failRes.body.status, 'Payment Failed');

  // Check stock restored to 45 kg
  prodInDb = await Product.findById(testProdId);
  assert.strictEqual(prodInDb.stock, 45, 'Stock must be restored to 45 kg');
  console.log('✓ 8b. Payment abandonment handled: Status marked "Payment Failed" and 8 kg stock returned');

  // ---------------------------------------------------------
  // Test 9: Safe Retry Workflow (/api/payments/retry)
  // ---------------------------------------------------------
  const retryRes = await request('POST', '/api/payments/retry', {
    orderId: abandonOrderId
  }, authHeader);
  assert.strictEqual(retryRes.status, 200);
  assert.ok(retryRes.body.gatewayOrderId.startsWith('order_rzp_test_'));

  // Stock should be re-reserved: 45 - 8 = 37 kg
  prodInDb = await Product.findById(testProdId);
  assert.strictEqual(prodInDb.stock, 37, 'Stock re-reserved for retry');
  console.log(`✓ 9a. Payment retry successful: Stock re-reserved (37 kg) and new gateway order issued (${retryRes.body.gatewayOrderId})`);

  // Complete retry with valid signature
  const retryPaymentId = 'pay_retry_success_' + crypto.randomBytes(4).toString('hex');
  const retrySig = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${retryRes.body.gatewayOrderId}|${retryPaymentId}`)
    .digest('hex');

  const confirmRetryRes = await request('POST', '/api/payments/verify-signature', {
    orderId: abandonOrderId,
    razorpay_order_id: retryRes.body.gatewayOrderId,
    razorpay_payment_id: retryPaymentId,
    razorpay_signature: retrySig
  }, authHeader);
  assert.strictEqual(confirmRetryRes.status, 200);
  assert.strictEqual(confirmRetryRes.body.verified, true);

  const retriedOrder = await Order.findOne({ orderId: abandonOrderId });
  assert.strictEqual(retriedOrder.paymentStatus, 'Paid');
  console.log('✓ 9b. Retried order payment confirmed and verified via HMAC signature');

  // ---------------------------------------------------------
  // Test 10: Cash on Delivery (COD) Flow & Delivery Fulfillment Reconciliation
  // ---------------------------------------------------------
  const codOrderRes = await request('POST', '/api/orders', {
    customerName: 'Audit Customer',
    customerEmail: testCustomerEmail,
    customerPhone: '9842211223',
    shippingAddress: {
      street: '12 KEC Avenue',
      city: 'Perundurai',
      state: 'Tamil Nadu',
      zipCode: '638052'
    },
    paymentMethod: 'Cash on Delivery',
    items: [
      {
        productId: testProdId,
        name: testProd.name,
        price: 100,
        quantity: 2,
        unit: 'kg'
      }
    ]
  }, authHeader);
  assert.strictEqual(codOrderRes.status, 201);
  const codOrderId = codOrderRes.body.order.orderId;
  assert.strictEqual(codOrderRes.body.order.paymentStatus, 'Pending', 'COD order initial payment status must be Pending');
  assert.strictEqual(codOrderRes.body.order.orderStatus, 'Placed');
  console.log(`✓ 10a. Cash on Delivery order placed: ${codOrderId} (Initial paymentStatus: Pending)`);

  // Admin login for delivery fulfillment
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@freshharvest.in',
    password: 'admin123'
  });
  const adminToken = adminLogin.body.token;

  // Assign delivery to driver
  const Delivery = require('../models/Delivery');
  const deliveryRecord = new Delivery({
    orderId: codOrderId,
    deliveryPartnerId: new mongoose.Types.ObjectId(customerId),
    deliveryPartnerName: 'Audit Driver',
    recipientName: 'Audit Customer',
    recipientPhone: '9842211223',
    pickupAddress: {
      street: 'Farm Gate 1',
      city: 'Perundurai',
      state: 'Tamil Nadu',
      zipCode: '638052'
    },
    deliveryAddress: {
      street: '12 KEC Avenue',
      city: 'Perundurai',
      state: 'Tamil Nadu',
      zipCode: '638052'
    },
    status: 'assigned'
  });
  await deliveryRecord.save();

  // Driver delivers COD package -> marks delivered
  const deliverRes = await request('PATCH', `/api/deliveries/${deliveryRecord._id}/status`, {
    status: 'delivered',
    notes: 'Cash of ₹250 collected at door by driver'
  }, { Authorization: `Bearer ${adminToken}` });
  assert.strictEqual(deliverRes.status, 200);

  // Verify COD payment auto-reconciles to Paid upon successful delivery
  const deliveredCodOrder = await Order.findOne({ orderId: codOrderId });
  assert.strictEqual(deliveredCodOrder.orderStatus, 'Delivered');
  assert.strictEqual(deliveredCodOrder.paymentStatus, 'Paid', 'Delivered COD order must reconcile paymentStatus to Paid');

  const deliveredCodPayment = await Payment.findOne({ orderId: codOrderId });
  assert.strictEqual(deliveredCodPayment.status, 'Completed', 'Payment record status must reconcile to Completed');
  console.log('✓ 10b. COD delivery fulfillment verified: Order & Payment reconciled to Paid / Completed');

  // ---------------------------------------------------------
  // Test 11: Insufficient Stock Boundary Validation
  // ---------------------------------------------------------
  // Current stock of testProd is: 37 - 2 = 35 kg
  prodInDb = await Product.findById(testProdId);
  const currentAvailableStock = prodInDb.stock;

  // Attempt to buy more than available (e.g. 500 kg)
  const excessiveOrderRes = await request('POST', '/api/orders', {
    customerName: 'Audit Customer',
    customerEmail: testCustomerEmail,
    customerPhone: '9842211223',
    shippingAddress: {
      street: '12 KEC Avenue',
      city: 'Perundurai',
      state: 'Tamil Nadu',
      zipCode: '638052'
    },
    paymentMethod: 'UPI',
    items: [
      {
        productId: testProdId,
        name: testProd.name,
        price: 100,
        quantity: currentAvailableStock + 100,
        unit: 'kg'
      }
    ]
  }, authHeader);

  assert.strictEqual(excessiveOrderRes.status, 400, 'Excessive quantity must return 400 Bad Request');
  assert.ok(excessiveOrderRes.body.message.includes('Insufficient stock'));

  // Verify stock remained intact
  prodInDb = await Product.findById(testProdId);
  assert.strictEqual(prodInDb.stock, currentAvailableStock, 'Stock must not change or become negative');
  console.log(`✓ 11. Insufficient stock boundary validation passed (Stock remained ${currentAvailableStock} kg, never negative)`);

  // Clean up audit test produce & orders
  await Product.findByIdAndDelete(testProdId);
  await Order.deleteMany({ customerEmail: testCustomerEmail });
  await Payment.deleteMany({ customerEmail: testCustomerEmail });
  await Delivery.deleteMany({ orderId: { $in: [placedOrderId, forgeOrderId, abandonOrderId, codOrderId] } });
  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log('🎉 ALL 11 PAYMENT & CHECKOUT RELIABILITY TESTS PASSED!');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
