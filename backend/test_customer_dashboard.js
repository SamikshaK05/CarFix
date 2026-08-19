import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import Vehicle from './src/models/Vehicle.js';
import Booking from './src/models/Booking.js';
import Invoice from './src/models/Invoice.js';
import Review from './src/models/Review.js';
import { getCustomerDashboard } from './src/controllers/customerController.js';

// In-memory test stores
const userStore = new Map();
const vehicleStore = new Map();
const bookingStore = new Map();
const invoiceStore = new Map();
const reviewStore = new Map();

function makeMockRes() {
  let statusCode = 200;
  let resBody = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      resBody = data;
      return this;
    },
  };

  return {
    res,
    getResult: () => ({ status: statusCode, body: resBody }),
  };
}

// Preserve original methods
const origUserFindById = User.findById;
const origVehicleFind = Vehicle.find;
const origVehicleCount = Vehicle.countDocuments;
const origBookingFind = Booking.find;
const origBookingCount = Booking.countDocuments;
const origInvoiceFind = Invoice.find;
const origInvoiceCount = Invoice.countDocuments;
const origReviewFind = Review.find;
const origReviewCount = Review.countDocuments;

function setupDashboardMocks() {
  User.findById = async function (id) {
    return userStore.get(id?.toString() || id) || null;
  };

  Vehicle.find = function (filter = {}) {
    let list = Array.from(vehicleStore.values());
    if (filter.user) {
      list = list.filter((v) => v.user?.toString() === filter.user.toString());
    }
    return {
      select() { return this; },
      sort() { return this; },
      lean() { return Promise.resolve(list); },
      then(resolve) { resolve(list); },
    };
  };

  Vehicle.countDocuments = async function (filter = {}) {
    let list = Array.from(vehicleStore.values());
    if (filter.user) {
      list = list.filter((v) => v.user?.toString() === filter.user.toString());
    }
    return list.length;
  };

  Booking.find = function (filter = {}) {
    let list = Array.from(bookingStore.values());
    if (filter.user) {
      list = list.filter((b) => b.user?.toString() === filter.user.toString());
    }
    if (filter.status && filter.status.$in) {
      list = list.filter((b) => filter.status.$in.includes(b.status));
    }
    return {
      sort() { return this; },
      limit() { return this; },
      populate() { return this; },
      lean() {
        const populated = list.map((b) => ({
          ...b,
          vehicle: vehicleStore.get(b.vehicle?.toString()) || b.vehicle,
        }));
        return Promise.resolve(populated);
      },
    };
  };

  Booking.countDocuments = async function (filter = {}) {
    let list = Array.from(bookingStore.values());
    if (filter.user) {
      list = list.filter((b) => b.user?.toString() === filter.user.toString());
    }
    if (filter.status) {
      if (typeof filter.status === 'string') {
        list = list.filter((b) => b.status === filter.status);
      } else if (filter.status.$in) {
        list = list.filter((b) => filter.status.$in.includes(b.status));
      }
    }
    return list.length;
  };

  Invoice.find = function (filter = {}) {
    let list = Array.from(invoiceStore.values());
    if (filter.user) {
      list = list.filter((inv) => inv.user?.toString() === filter.user.toString());
    }
    return {
      sort() { return this; },
      limit() { return this; },
      select() { return this; },
      populate() { return this; },
      lean() { return Promise.resolve(list); },
    };
  };

  Invoice.countDocuments = async function (filter = {}) {
    let list = Array.from(invoiceStore.values());
    if (filter.user) {
      list = list.filter((inv) => inv.user?.toString() === filter.user.toString());
    }
    if (filter.paymentStatus) {
      list = list.filter((inv) => inv.paymentStatus === filter.paymentStatus);
    }
    return list.length;
  };

  Review.find = function (filter = {}) {
    let list = Array.from(reviewStore.values());
    if (filter.user) {
      list = list.filter((r) => r.user?.toString() === filter.user.toString());
    }
    return {
      sort() { return this; },
      limit() { return this; },
      populate() { return this; },
      lean() { return Promise.resolve(list); },
    };
  };

  Review.countDocuments = async function (filter = {}) {
    let list = Array.from(reviewStore.values());
    if (filter.user) {
      list = list.filter((r) => r.user?.toString() === filter.user.toString());
    }
    return list.length;
  };
}

function restoreDashboardMocks() {
  User.findById = origUserFindById;
  Vehicle.find = origVehicleFind;
  Vehicle.countDocuments = origVehicleCount;
  Booking.find = origBookingFind;
  Booking.countDocuments = origBookingCount;
  Invoice.find = origInvoiceFind;
  Invoice.countDocuments = origInvoiceCount;
  Review.find = origReviewFind;
  Review.countDocuments = origReviewCount;
}

async function runDashboardTests() {
  console.log('==================================================');
  console.log('  CARFIX CUSTOMER DASHBOARD AUTOMATED TEST SUITE  ');
  console.log('==================================================\n');

  setupDashboardMocks();

  const cust1Id = new mongoose.Types.ObjectId().toString();
  const cust2Id = new mongoose.Types.ObjectId().toString();

  userStore.set(cust1Id, { _id: cust1Id, name: 'Alice Customer', email: 'alice@carfix.com', role: 'CUSTOMER' });
  userStore.set(cust2Id, { _id: cust2Id, name: 'Bob Customer', email: 'bob@carfix.com', role: 'CUSTOMER' });

  // Customer 1 Vehicles
  const v1Id = new mongoose.Types.ObjectId().toString();
  const v2Id = new mongoose.Types.ObjectId().toString();
  vehicleStore.set(v1Id, { _id: v1Id, user: cust1Id, make: 'Toyota', model: 'Camry', registrationNumber: 'MH-12-TC-1010' });
  vehicleStore.set(v2Id, { _id: v2Id, user: cust1Id, make: 'Honda', model: 'City', registrationNumber: 'MH-12-HC-2020' });

  // Customer 2 Vehicle
  const v3Id = new mongoose.Types.ObjectId().toString();
  vehicleStore.set(v3Id, { _id: v3Id, user: cust2Id, make: 'Hyundai', model: 'Verna', registrationNumber: 'MH-12-HY-3030' });

  // Customer 1 Bookings (1 PENDING, 1 CONFIRMED, 1 COMPLETED, 1 CANCELLED)
  const b1Id = new mongoose.Types.ObjectId().toString(); // PENDING (active)
  const b2Id = new mongoose.Types.ObjectId().toString(); // CONFIRMED (active)
  const b3Id = new mongoose.Types.ObjectId().toString(); // COMPLETED
  const b4Id = new mongoose.Types.ObjectId().toString(); // CANCELLED

  bookingStore.set(b1Id, { _id: b1Id, user: cust1Id, vehicle: v1Id, status: 'PENDING', createdAt: new Date('2026-08-01T10:00:00Z') });
  bookingStore.set(b2Id, { _id: b2Id, user: cust1Id, vehicle: v1Id, status: 'CONFIRMED', createdAt: new Date('2026-08-05T10:00:00Z') });
  bookingStore.set(b3Id, { _id: b3Id, user: cust1Id, vehicle: v2Id, status: 'COMPLETED', createdAt: new Date('2026-07-20T10:00:00Z') });
  bookingStore.set(b4Id, { _id: b4Id, user: cust1Id, vehicle: v2Id, status: 'CANCELLED', createdAt: new Date('2026-07-15T10:00:00Z') });

  // Customer 1 Invoices (1 PENDING, 1 PAID)
  const inv1Id = new mongoose.Types.ObjectId().toString(); // PENDING
  const inv2Id = new mongoose.Types.ObjectId().toString(); // PAID

  invoiceStore.set(inv1Id, { _id: inv1Id, user: cust1Id, booking: b1Id, vehicle: v1Id, invoiceNumber: 'CARFIX-2026-0001', total: 3500, paymentStatus: 'PENDING', issuedAt: new Date('2026-08-02') });
  invoiceStore.set(inv2Id, { _id: inv2Id, user: cust1Id, booking: b3Id, vehicle: v2Id, invoiceNumber: 'CARFIX-2026-0002', total: 4500, paymentStatus: 'PAID', issuedAt: new Date('2026-07-21') });

  const results = { passed: 0, failed: 0 };
  function assert(testName, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      results.passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      results.failed++;
    }
  }

  // Test 1: Authenticated customer can retrieve dashboard
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getCustomerDashboard(req, res);
    const { status, body } = getResult();

    assert(
      'Test 1: Authenticated customer can retrieve dashboard (HTTP 200)',
      status === 200 && body.success === true && body.data !== undefined,
      `Status: ${status}`
    );
  }

  // Test 2: Unauthenticated dashboard request is rejected (HTTP 401)
  {
    const req = { query: {}, user: null };
    const { res, getResult } = makeMockRes();
    await getCustomerDashboard(req, res);
    const { status } = getResult();

    assert('Test 2: Unauthenticated dashboard request is rejected (HTTP 401)', status === 401, `Status: ${status}`);
  }

  // Test 3 & 4: Total vehicles count is correct & excludes another customer's vehicles
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getCustomerDashboard(req, res);
    const { body } = getResult();

    assert('Test 3: Total vehicles count is correct (2)', body.data?.totalVehicles === 2, `Count: ${body.data?.totalVehicles}`);
    assert("Test 4: Customer 2's vehicle is excluded from Customer 1 count", body.data?.totalVehicles === 2, `Count: ${body.data?.totalVehicles}`);
  }

  // Test 5, 6, 7: Active booking count is correct (2: PENDING + CONFIRMED) & excludes COMPLETED / CANCELLED
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getCustomerDashboard(req, res);
    const { body } = getResult();

    assert('Test 5: Active booking count is correct (2)', body.data?.activeBookings === 2, `Active: ${body.data?.activeBookings}`);
    assert('Test 6: Completed bookings excluded from active count', body.data?.activeBookings === 2, `Active: ${body.data?.activeBookings}`);
    assert('Test 7: Cancelled bookings excluded from active count', body.data?.activeBookings === 2, `Active: ${body.data?.activeBookings}`);
  }

  // Test 8: Completed service count is correct (1)
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getCustomerDashboard(req, res);
    const { body } = getResult();

    assert('Test 8: Completed service count is correct (1)', body.data?.completedServices === 1, `Completed: ${body.data?.completedServices}`);
  }

  // Test 9 & 10: Pending invoice count is correct (1) & paid invoices excluded
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getCustomerDashboard(req, res);
    const { body } = getResult();

    assert('Test 9: Pending invoice count is correct (1)', body.data?.pendingInvoices === 1, `Pending invoices: ${body.data?.pendingInvoices}`);
    assert('Test 10: Paid/non-pending invoices excluded from pending invoice count', body.data?.pendingInvoices === 1, `Pending invoices: ${body.data?.pendingInvoices}`);
  }

  // Test 11 & 12: Recent activity belongs strictly to authenticated customer & sorted newest first
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getCustomerDashboard(req, res);
    const { body } = getResult();
    const act = body.data?.recentActivity || [];

    const isSorted = act.length > 1 ? new Date(act[0].timestamp) >= new Date(act[1].timestamp) : true;

    assert('Test 11: Recent activity feed generated for authenticated customer', act.length > 0, `Activity items: ${act.length}`);
    assert('Test 12: Recent activity is sorted newest first', isSorted, `Top timestamp: ${act[0]?.timestamp}`);
  }

  // Test 13: ?user= override cannot access another customer's dashboard
  {
    const req = {
      query: { user: cust1Id }, // Customer 2 passing Customer 1 ID
      user: { _id: cust2Id, role: 'CUSTOMER' }, // Requesting as Customer 2
    };
    const { res, getResult } = makeMockRes();
    await getCustomerDashboard(req, res);
    const { body } = getResult();

    assert(
      "Test 13: Customer 2 cannot query Customer 1 dashboard via ?user= query parameter",
      body.data?.totalVehicles === 1 && body.data?.activeBookings === 0,
      `Cust 2 vehicles: ${body.data?.totalVehicles}, active: ${body.data?.activeBookings}`
    );
  }

  // Test 14: Sensitive fields are not returned
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getCustomerDashboard(req, res);
    const { body } = getResult();

    const uObj = body.data?.user;
    assert(
      'Test 14: Password hashes and reset tokens excluded from dashboard response',
      uObj && uObj.password === undefined && uObj.resetPasswordToken === undefined,
      `User keys: ${uObj ? Object.keys(uObj).join(', ') : 'none'}`
    );
  }

  // Test 15: Empty customer data returns valid zero metrics
  {
    const newCustId = new mongoose.Types.ObjectId().toString();
    userStore.set(newCustId, { _id: newCustId, name: 'New Customer', role: 'CUSTOMER' });

    const req = { query: {}, user: { _id: newCustId, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getCustomerDashboard(req, res);
    const { status, body } = getResult();

    assert(
      'Test 15: New customer with zero records receives valid zero metrics without errors',
      status === 200 && body.data?.totalVehicles === 0 && body.data?.activeBookings === 0 && body.data?.pendingInvoices === 0,
      `Zero metrics verified`
    );
  }

  // Test 16: Dashboard values match MongoDB source records
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getCustomerDashboard(req, res);
    const { body } = getResult();

    assert(
      'Test 16: Dashboard metrics match MongoDB source record counts',
      body.data?.totalVehicles === 2 && body.data?.stats?.activeBookings === 2,
      `Source counts verified`
    );
  }

  // Test 17: Newly created booking updates active booking metric (+1)
  {
    const bNewId = new mongoose.Types.ObjectId().toString();
    bookingStore.set(bNewId, { _id: bNewId, user: cust1Id, vehicle: v1Id, status: 'PENDING', createdAt: new Date() });

    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getCustomerDashboard(req, res);
    const { body } = getResult();

    assert(
      'Test 17: Creating a new booking increments active bookings metric to 3',
      body.data?.activeBookings === 3,
      `Active bookings count: ${body.data?.activeBookings}`
    );
  }

  // Test 18: Completed booking updates completed service metric (+1)
  {
    const bComp2Id = new mongoose.Types.ObjectId().toString();
    bookingStore.set(bComp2Id, { _id: bComp2Id, user: cust1Id, vehicle: v1Id, status: 'COMPLETED', createdAt: new Date() });

    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getCustomerDashboard(req, res);
    const { body } = getResult();

    assert(
      'Test 18: Completing a booking increments completed services metric to 2',
      body.data?.completedServices === 2,
      `Completed services count: ${body.data?.completedServices}`
    );
  }

  // Test 19: Cancelled booking is removed from active booking count (-1)
  {
    // Update b1Id from PENDING to CANCELLED
    const existingB1 = bookingStore.get(b1Id);
    bookingStore.set(b1Id, { ...existingB1, status: 'CANCELLED' });

    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getCustomerDashboard(req, res);
    const { body } = getResult();

    assert(
      'Test 19: Cancelling a booking removes it from active bookings count',
      body.data?.activeBookings === 2,
      `Active bookings count: ${body.data?.activeBookings}`
    );
  }

  // Test 20: New pending invoice updates pending invoice count (+1)
  {
    const inv3Id = new mongoose.Types.ObjectId().toString();
    invoiceStore.set(inv3Id, { _id: inv3Id, user: cust1Id, booking: b1Id, vehicle: v1Id, invoiceNumber: 'CARFIX-2026-0003', total: 2000, paymentStatus: 'PENDING', issuedAt: new Date() });

    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getCustomerDashboard(req, res);
    const { body } = getResult();

    assert(
      'Test 20: Issuing a new pending invoice increments pending invoices metric to 2',
      body.data?.pendingInvoices === 2,
      `Pending invoices count: ${body.data?.pendingInvoices}`
    );
  }

  restoreDashboardMocks();

  console.log('\n==================================================');
  console.log(`TOTAL TESTS: ${results.passed + results.failed}`);
  console.log(`PASSED: ${results.passed}`);
  console.log(`FAILED: ${results.failed}`);
  console.log('==================================================\n');
}

runDashboardTests().catch(console.error);
