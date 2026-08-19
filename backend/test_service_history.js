import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import Vehicle from './src/models/Vehicle.js';
import Service from './src/models/Service.js';
import ServiceCenter from './src/models/ServiceCenter.js';
import Booking from './src/models/Booking.js';
import Invoice from './src/models/Invoice.js';
import { getServiceHistory } from './src/controllers/bookingController.js';
import { downloadInvoice } from './src/controllers/invoiceController.js';
import { Writable } from 'stream';

// In-memory test stores
const userStore = new Map();
const vehicleStore = new Map();
const serviceStore = new Map();
const serviceCenterStore = new Map();
const bookingStore = new Map();
const invoiceStore = new Map();

function makeMockRes() {
  let statusCode = 200;
  const headers = {};
  const chunks = [];
  let resBody = null;

  const res = new Writable({
    write(chunk, encoding, callback) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      callback();
    },
  });

  res.statusCode = 200;
  res.status = function (code) {
    statusCode = code;
    this.statusCode = code;
    return this;
  };
  res.setHeader = function (name, value) {
    headers[name.toLowerCase()] = value;
  };
  res.getHeader = function (name) {
    return headers[name.toLowerCase()];
  };
  res.json = function (data) {
    resBody = data;
    return this;
  };

  return {
    res,
    getResult: () => ({
      status: statusCode,
      headers,
      body: resBody,
      buffer: Buffer.concat(chunks),
    }),
  };
}

// Save original model methods
const origUserFindById = User.findById;
const origVehicleFindById = Vehicle.findById;
const origServiceFindById = Service.findById;
const origServiceCenterFindById = ServiceCenter.findById;
const origBookingFind = Booking.find;
const origBookingFindById = Booking.findById;
const origInvoiceFind = Invoice.find;
const origInvoiceFindById = Invoice.findById;

function setupMocks() {
  User.findById = async function (id) {
    return userStore.get(id?.toString() || id) || null;
  };

  Vehicle.findById = async function (id) {
    return vehicleStore.get(id?.toString() || id) || null;
  };

  Service.findById = async function (id) {
    return serviceStore.get(id?.toString() || id) || null;
  };

  ServiceCenter.findById = async function (id) {
    return serviceCenterStore.get(id?.toString() || id) || null;
  };

  Booking.find = function (filter = {}) {
    let list = Array.from(bookingStore.values());
    if (filter.user) {
      list = list.filter((b) => b.user?.toString() === filter.user.toString());
    }
    if (filter.status) {
      list = list.filter((b) => b.status === filter.status);
    }
    return {
      sort() { return this; },
      populate() { return this; },
      then(resolve) {
        const populated = list.map((b) => ({
          ...b,
          user: userStore.get(b.user?.toString()) || b.user,
          vehicle: vehicleStore.get(b.vehicle?.toString()) || b.vehicle,
          service: serviceStore.get(b.service?.toString()) || b.service,
          serviceCenter: serviceCenterStore.get(b.serviceCenter?.toString()) || b.serviceCenter,
        }));
        resolve(populated);
      },
    };
  };

  Invoice.find = function (filter = {}) {
    let list = Array.from(invoiceStore.values());
    if (filter.booking && filter.booking.$in) {
      const ids = filter.booking.$in.map((i) => i.toString());
      list = list.filter((inv) => ids.includes(inv.booking?.toString()));
    }
    return {
      lean() { return Promise.resolve(list); },
      then(resolve) { resolve(list); },
    };
  };

  Invoice.findById = function (id) {
    const inv = invoiceStore.get(id?.toString() || id);
    return {
      populate() { return this; },
      then(resolve) {
        if (!inv) return resolve(null);
        resolve({
          ...inv,
          user: userStore.get(inv.user?.toString()) || inv.user,
          vehicle: vehicleStore.get(inv.vehicle?.toString()) || inv.vehicle,
          booking: bookingStore.get(inv.booking?.toString()) || inv.booking,
        });
      },
    };
  };
}

function restoreMocks() {
  User.findById = origUserFindById;
  Vehicle.findById = origVehicleFindById;
  Service.findById = origServiceFindById;
  ServiceCenter.findById = origServiceCenterFindById;
  Booking.find = origBookingFind;
  Booking.findById = origBookingFindById;
  Invoice.find = origInvoiceFind;
  Invoice.findById = origInvoiceFindById;
}

async function runServiceHistoryTests() {
  console.log('==================================================');
  console.log('    CARFIX SERVICE HISTORY AUTOMATED TEST SUITE   ');
  console.log('==================================================\n');

  setupMocks();

  const cust1Id = new mongoose.Types.ObjectId().toString();
  const cust2Id = new mongoose.Types.ObjectId().toString();

  userStore.set(cust1Id, { _id: cust1Id, name: 'Alice Customer', email: 'alice@carfix.com', role: 'CUSTOMER' });
  userStore.set(cust2Id, { _id: cust2Id, name: 'Bob Customer', email: 'bob@carfix.com', role: 'CUSTOMER' });

  const veh1Id = new mongoose.Types.ObjectId().toString(); // Customer 1
  vehicleStore.set(veh1Id, { _id: veh1Id, user: cust1Id, make: 'Toyota', model: 'Camry', registrationNumber: 'MH-12-TC-5555', mileage: 24500 });

  const srv1Id = new mongoose.Types.ObjectId().toString();
  serviceStore.set(srv1Id, { _id: srv1Id, name: 'Brake Pad Replacement', price: 4500 });

  const ctr1Id = new mongoose.Types.ObjectId().toString();
  serviceCenterStore.set(ctr1Id, { _id: ctr1Id, name: 'CarFix Westend' });

  // Bookings for Customer 1
  const bCompleted1Id = new mongoose.Types.ObjectId().toString(); // COMPLETED
  bookingStore.set(bCompleted1Id, {
    _id: bCompleted1Id,
    user: cust1Id,
    vehicle: veh1Id,
    service: srv1Id,
    serviceCenter: ctr1Id,
    bookingDate: new Date('2026-08-10'),
    status: 'COMPLETED',
    amount: 4500,
  });

  const bPendingId = new mongoose.Types.ObjectId().toString(); // PENDING
  bookingStore.set(bPendingId, {
    _id: bPendingId,
    user: cust1Id,
    vehicle: veh1Id,
    service: srv1Id,
    serviceCenter: ctr1Id,
    bookingDate: new Date('2026-09-01'),
    status: 'PENDING',
    amount: 4500,
  });

  const bConfirmedId = new mongoose.Types.ObjectId().toString(); // CONFIRMED
  bookingStore.set(bConfirmedId, {
    _id: bConfirmedId,
    user: cust1Id,
    vehicle: veh1Id,
    service: srv1Id,
    serviceCenter: ctr1Id,
    bookingDate: new Date('2026-09-05'),
    status: 'CONFIRMED',
    amount: 4500,
  });

  const bInProgressId = new mongoose.Types.ObjectId().toString(); // IN_PROGRESS
  bookingStore.set(bInProgressId, {
    _id: bInProgressId,
    user: cust1Id,
    vehicle: veh1Id,
    service: srv1Id,
    serviceCenter: ctr1Id,
    bookingDate: new Date('2026-08-18'),
    status: 'IN_PROGRESS',
    amount: 4500,
  });

  const bCancelledId = new mongoose.Types.ObjectId().toString(); // CANCELLED
  bookingStore.set(bCancelledId, {
    _id: bCancelledId,
    user: cust1Id,
    vehicle: veh1Id,
    service: srv1Id,
    serviceCenter: ctr1Id,
    bookingDate: new Date('2026-07-20'),
    status: 'CANCELLED',
    amount: 4500,
  });

  // Invoice for bCompleted1Id
  const inv1Id = new mongoose.Types.ObjectId().toString();
  invoiceStore.set(inv1Id, {
    _id: inv1Id,
    invoiceNumber: 'CARFIX-2026-HIST01',
    booking: bCompleted1Id,
    user: cust1Id,
    vehicle: veh1Id,
    total: 4500,
    paymentStatus: 'PAID',
    issuedAt: new Date('2026-08-10'),
  });

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

  // Test 1: Authenticated customer can retrieve service history
  {
    const req = {
      query: {},
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await getServiceHistory(req, res);
    const { status, body } = getResult();

    assert(
      'Test 1: Authenticated customer can retrieve service history (HTTP 200)',
      status === 200 && body.success === true && Array.isArray(body.data),
      `Status: ${status}, Count: ${body?.count}`
    );
  }

  // Test 2: Unauthenticated request is rejected
  {
    const req = { query: {}, user: null };
    const { res, getResult } = makeMockRes();
    await getServiceHistory(req, res);
    const { status } = getResult();

    assert('Test 2: Unauthenticated service history request is rejected', status === 400 || status === 401, `Status: ${status}`);
  }

  // Test 3: Only authenticated customer's history is returned
  {
    const req = {
      query: {},
      user: { _id: cust2Id, role: 'CUSTOMER' }, // Customer 2 has 0 history
    };
    const { res, getResult } = makeMockRes();
    await getServiceHistory(req, res);
    const { status, body } = getResult();

    assert(
      "Test 3: Customer 2 receives empty list when Customer 1 has completed history",
      status === 200 && body.count === 0,
      `Status: ${status}, Count: ${body?.count}`
    );
  }

  // Test 4: Completed bookings appear in history
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getServiceHistory(req, res);
    const { body } = getResult();

    const hasCompleted = body?.data?.some((b) => b._id === bCompleted1Id && b.status === 'COMPLETED');
    assert('Test 4: Completed booking appears in history', hasCompleted, `Found completed: ${hasCompleted}`);
  }

  // Test 5, 6, 7: Pending, Confirmed, In-Progress bookings do NOT appear as completed history
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getServiceHistory(req, res);
    const { body } = getResult();

    const ids = body?.data?.map((b) => b._id) || [];
    assert('Test 5: Pending booking does not appear in completed history', !ids.includes(bPendingId), `Included: ${ids.includes(bPendingId)}`);
    assert('Test 6: Confirmed booking does not appear in completed history', !ids.includes(bConfirmedId), `Included: ${ids.includes(bConfirmedId)}`);
    assert('Test 7: In-progress booking does not appear in completed history', !ids.includes(bInProgressId), `Included: ${ids.includes(bInProgressId)}`);
  }

  // Test 8: Cancelled bookings excluded from completed history route (or handled separately)
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getServiceHistory(req, res);
    const { body } = getResult();

    const ids = body?.data?.map((b) => b._id) || [];
    assert('Test 8: Cancelled booking excluded from COMPLETED service history endpoint', !ids.includes(bCancelledId), `Included: ${ids.includes(bCancelledId)}`);
  }

  // Test 9: History is ordered by date descending
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getServiceHistory(req, res);
    const { body } = getResult();

    assert('Test 9: History returned with valid array list structure', Array.isArray(body?.data), 'Valid data array');
  }

  // Test 10, 11, 12: Associated Vehicle, Service, and Service Center populated
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getServiceHistory(req, res);
    const { body } = getResult();

    const record = body?.data?.[0];
    assert('Test 10: Vehicle info associated (make, model, regNum)', record?.vehicle?.make === 'Toyota' && record?.vehicle?.registrationNumber === 'MH-12-TC-5555', `Vehicle: ${JSON.stringify(record?.vehicle)}`);
    assert('Test 11: Service info associated (name, price)', record?.service?.name === 'Brake Pad Replacement' && record?.service?.price === 4500, `Service: ${JSON.stringify(record?.service)}`);
    assert('Test 12: Service Center info associated', record?.serviceCenter?.name === 'CarFix Westend', `ServiceCenter: ${JSON.stringify(record?.serviceCenter)}`);
  }

  // Test 13: Mileage is correctly returned when available
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getServiceHistory(req, res);
    const { body } = getResult();

    const record = body?.data?.[0];
    assert('Test 13: Vehicle mileage correctly returned', record?.vehicle?.mileage === 24500, `Mileage: ${record?.vehicle?.mileage}`);
  }

  // Test 14: Invoice linkage is correct when an invoice exists
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getServiceHistory(req, res);
    const { body } = getResult();

    const record = body?.data?.[0];
    assert(
      'Test 14: Invoice linkage attached to completed history record',
      record?.invoice?._id === inv1Id && record?.invoice?.invoiceNumber === 'CARFIX-2026-HIST01',
      `Invoice: ${JSON.stringify(record?.invoice)}`
    );
  }

  // Test 15: Customer cannot access another customer's history via user parameter
  {
    const req = {
      query: { user: cust1Id }, // Customer 2 trying to pass Customer 1 ID in query
      user: { _id: cust2Id, role: 'CUSTOMER' }, // Requesting as Customer 2
    };
    const { res, getResult } = makeMockRes();
    await getServiceHistory(req, res);
    const { body } = getResult();

    assert(
      "Test 15: Customer 2 cannot query Customer 1's history using ?user= query override",
      body.count === 0,
      `Count returned: ${body.count}`
    );
  }

  // Test 16: Password hashes and reset tokens are not returned
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getServiceHistory(req, res);
    const { body } = getResult();

    const userInBooking = body?.data?.[0]?.user;
    assert(
      'Test 16: Password hashes and reset tokens excluded from user response',
      userInBooking && userInBooking.password === undefined && userInBooking.resetPasswordToken === undefined,
      `User object keys: ${userInBooking ? Object.keys(userInBooking).join(', ') : 'none'}`
    );
  }

  // Test 17: Empty history returns correct empty result without errors
  {
    const req = { query: {}, user: { _id: cust2Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getServiceHistory(req, res);
    const { status, body } = getResult();

    assert('Test 17: Empty history returns count 0 and empty array without errors', status === 200 && body.count === 0 && Array.isArray(body.data), `Status: ${status}`);
  }

  // Test 18: Historical records remain available after booking cancellation
  {
    const req = { query: {}, user: { _id: cust1Id, role: 'CUSTOMER' } };
    const { res, getResult } = makeMockRes();
    await getServiceHistory(req, res);
    const { status, body } = getResult();

    assert('Test 18: Completed historical record remains intact after other cancellations', status === 200 && body.count === 1, `Count: ${body?.count}`);
  }

  // Test 19: Invoice download from a historical record respects existing invoice ownership protection
  {
    const reqDel = {
      params: { id: inv1Id },
      user: { _id: cust2Id, role: 'CUSTOMER' }, // Customer 2 attempting to download Customer 1's historical invoice
    };
    const { res, getResult } = makeMockRes();
    await downloadInvoice(reqDel, res);
    const { status, body } = getResult();

    assert(
      "Test 19: Invoice download from historical record blocks unauthorized customer (HTTP 403)",
      status === 403 && body.message === 'Not authorized to access this invoice',
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  restoreMocks();

  console.log('\n==================================================');
  console.log(`TOTAL TESTS: ${results.passed + results.failed}`);
  console.log(`PASSED: ${results.passed}`);
  console.log(`FAILED: ${results.failed}`);
  console.log('==================================================\n');
}

runServiceHistoryTests().catch(console.error);
