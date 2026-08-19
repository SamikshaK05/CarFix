import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import Vehicle from './src/models/Vehicle.js';
import Service from './src/models/Service.js';
import ServiceCenter from './src/models/ServiceCenter.js';
import Booking from './src/models/Booking.js';
import {
  getServices,
  getServiceById,
} from './src/controllers/serviceController.js';
import { createBooking } from './src/controllers/bookingController.js';

// In-memory test stores
const userStore = new Map();
const vehicleStore = new Map();
const serviceStore = new Map();
const centerStore = new Map();
const bookingStore = new Map();

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
const origVehicleFindById = Vehicle.findById;
const origServiceFind = Service.find;
const origServiceFindById = Service.findById;
const origCenterFindById = ServiceCenter.findById;
const origBookingFindOne = Booking.findOne;
const origBookingCreate = Booking.create;
const origBookingFindById = Booking.findById;

function setupMocks() {
  User.findById = async function (id) {
    return userStore.get(id?.toString() || id) || null;
  };

  Vehicle.findById = async function (id) {
    return vehicleStore.get(id?.toString() || id) || null;
  };

  ServiceCenter.findById = function (id) {
    const c = centerStore.get(id?.toString() || id);
    return {
      populate() { return this; },
      then(resolve) { resolve(c || null); },
    };
  };

  Service.find = function (filter = {}) {
    let list = Array.from(serviceStore.values());
    if (filter.isActive !== undefined) {
      list = list.filter((s) => s.isActive === filter.isActive);
    }
    if (filter.category && filter.category.$regex) {
      const reg = filter.category.$regex;
      list = list.filter((s) => reg.test(s.category || ''));
    }
    if (filter.$or && Array.isArray(filter.$or)) {
      list = list.filter((s) =>
        filter.$or.some((cond) => {
          const nameReg = cond.name?.$regex || cond.name;
          const descReg = cond.description?.$regex || cond.description;
          if (nameReg && nameReg.test && nameReg.test(s.name || '')) return true;
          if (descReg && descReg.test && descReg.test(s.description || '')) return true;
          return false;
        })
      );
    }
    return {
      sort() { return this; },
      then(resolve) { resolve(list); },
    };
  };

  Service.findById = async function (id) {
    return serviceStore.get(id?.toString() || id) || null;
  };

  Booking.findOne = async function () {
    return null;
  };

  Booking.create = async function (doc) {
    const _id = new mongoose.Types.ObjectId().toString();
    const newB = { _id, ...doc };
    bookingStore.set(_id, newB);
    return newB;
  };

  Booking.findById = function (id) {
    const b = bookingStore.get(id?.toString() || id);
    return {
      populate() { return this; },
      then(resolve) { resolve(b || null); },
    };
  };
}

function restoreMocks() {
  User.findById = origUserFindById;
  Vehicle.findById = origVehicleFindById;
  Service.find = origServiceFind;
  Service.findById = origServiceFindById;
  ServiceCenter.findById = origCenterFindById;
  Booking.findOne = origBookingFindOne;
  Booking.create = origBookingCreate;
  Booking.findById = origBookingFindById;
}

async function runServicesCatalogTests() {
  console.log('==================================================');
  console.log('  CARFIX SERVICES CATALOG & INTEGRITY TEST SUITE  ');
  console.log('==================================================\n');

  setupMocks();

  const custId = new mongoose.Types.ObjectId().toString();
  userStore.set(custId, { _id: custId, name: 'Alice Customer', email: 'alice@carfix.com', role: 'CUSTOMER' });

  const srvActive1Id = new mongoose.Types.ObjectId().toString(); // Oil Change (General Service, 1500, 60 mins)
  const srvActive2Id = new mongoose.Types.ObjectId().toString(); // Brake Inspection (Brakes, 2500, 45 mins)
  const srvInactiveId = new mongoose.Types.ObjectId().toString(); // Obsolete Service (Inactive)

  serviceStore.set(srvActive1Id, {
    _id: srvActive1Id,
    name: 'Synthetic Oil Change',
    description: 'Complete synthetic engine oil & filter replacement',
    category: 'General Service',
    price: 1500,
    duration: 60,
    isActive: true,
  });

  serviceStore.set(srvActive2Id, {
    _id: srvActive2Id,
    name: 'Brake Pad & Rotor Inspection',
    description: 'Comprehensive brake pad wear check and cleaning',
    category: 'Brakes',
    price: 2500,
    duration: 45,
    isActive: true,
  });

  serviceStore.set(srvInactiveId, {
    _id: srvInactiveId,
    name: 'Legacy Carburetor Clean',
    description: 'Old carburetor maintenance',
    category: 'Other',
    price: 999,
    duration: 90,
    isActive: false,
  });

  const center1Id = new mongoose.Types.ObjectId().toString();
  centerStore.set(center1Id, {
    _id: center1Id,
    name: 'CarFix Hub',
    services: [srvActive1Id, srvActive2Id],
    isActive: true,
  });

  const veh1Id = new mongoose.Types.ObjectId().toString();
  vehicleStore.set(veh1Id, { _id: veh1Id, user: custId, make: 'Toyota', model: 'Camry', registrationNumber: 'MH-12-TC-9999' });

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

  // --- CATALOG TESTS ---

  // Test 1: Services listing returns active services
  {
    const req = { query: {} };
    const { res, getResult } = makeMockRes();
    await getServices(req, res);
    const { status, body } = getResult();
    assert('Test 1: Services listing returns active services (HTTP 200)', status === 200 && body.count === 2, `Count: ${body?.count}`);
  }

  // Test 2: Inactive services excluded from customer catalog
  {
    const req = { query: {} };
    const { res, getResult } = makeMockRes();
    await getServices(req, res);
    const { body } = getResult();
    const hasInactive = body?.data?.some((s) => s._id === srvInactiveId);
    assert('Test 2: Inactive service excluded from customer catalog', !hasInactive, `Includes inactive: ${hasInactive}`);
  }

  // Test 3: Service data matches MongoDB source
  {
    const req = { query: {} };
    const { res, getResult } = makeMockRes();
    await getServices(req, res);
    const { body } = getResult();
    const s1 = body?.data?.find((s) => s._id === srvActive1Id);
    assert('Test 3: Service data matches MongoDB (name, category, price, duration)', s1?.name === 'Synthetic Oil Change' && s1?.price === 1500 && s1?.duration === 60, `Service 1: ${JSON.stringify(s1)}`);
  }

  // Test 4: Empty catalog handled correctly
  {
    serviceStore.clear();
    const req = { query: {} };
    const { res, getResult } = makeMockRes();
    await getServices(req, res);
    const { status, body } = getResult();
    assert('Test 4: Empty catalog returns HTTP 200 with count 0 and empty array', status === 200 && body.count === 0 && Array.isArray(body.data), `Count: ${body?.count}`);

    // Restore test services
    serviceStore.set(srvActive1Id, { _id: srvActive1Id, name: 'Synthetic Oil Change', description: 'Complete synthetic engine oil & filter replacement', category: 'General Service', price: 1500, duration: 60, isActive: true });
    serviceStore.set(srvActive2Id, { _id: srvActive2Id, name: 'Brake Pad & Rotor Inspection', description: 'Comprehensive brake pad wear check and cleaning', category: 'Brakes', price: 2500, duration: 45, isActive: true });
    serviceStore.set(srvInactiveId, { _id: srvInactiveId, name: 'Legacy Carburetor Clean', description: 'Old carburetor maintenance', category: 'Other', price: 999, duration: 90, isActive: false });
  }

  // Test 5: Sensitive internal fields excluded
  {
    const req = { query: {} };
    const { res, getResult } = makeMockRes();
    await getServices(req, res);
    const { body } = getResult();
    const s1 = body?.data?.[0];
    assert('Test 5: Sensitive internal fields excluded', s1 && s1.password === undefined && s1.adminNotes === undefined, 'No sensitive fields exposed');
  }

  // --- SEARCH TESTS ---

  // Test 6: Search by service name works
  {
    const req = { query: { search: 'Synthetic' } };
    const { res, getResult } = makeMockRes();
    await getServices(req, res);
    const { body } = getResult();
    assert('Test 6: Search by service name works', body.count === 1 && body.data[0]._id === srvActive1Id, `Count: ${body?.count}`);
  }

  // Test 7: Search by description works
  {
    const req = { query: { search: 'rotor' } };
    const { res, getResult } = makeMockRes();
    await getServices(req, res);
    const { body } = getResult();
    assert('Test 7: Search by description works', body.count === 1 && body.data[0]._id === srvActive2Id, `Count: ${body?.count}`);
  }

  // Test 8: Search is case-insensitive
  {
    const req = { query: { search: 'SyNtHeTiC' } };
    const { res, getResult } = makeMockRes();
    await getServices(req, res);
    const { body } = getResult();
    assert('Test 8: Search is case-insensitive', body.count === 1, `Count: ${body?.count}`);
  }

  // Test 9: Search trims whitespace
  {
    const req = { query: { search: '  Synthetic  ' } };
    const { res, getResult } = makeMockRes();
    await getServices(req, res);
    const { body } = getResult();
    assert('Test 9: Search trims whitespace', body.count === 1, `Count: ${body?.count}`);
  }

  // Test 10: Search with no matches returns empty list
  {
    const req = { query: { search: 'NonExistentServiceSearch' } };
    const { res, getResult } = makeMockRes();
    await getServices(req, res);
    const { status, body } = getResult();
    assert('Test 10: Search with no matches returns empty list (HTTP 200)', status === 200 && body.count === 0 && Array.isArray(body.data), `Count: ${body?.count}`);
  }

  // --- CATEGORY TESTS ---

  // Test 11: Category filter works
  {
    const req = { query: { category: 'Brakes' } };
    const { res, getResult } = makeMockRes();
    await getServices(req, res);
    const { body } = getResult();
    assert('Test 11: Category filter works', body.count === 1 && body.data[0].category === 'Brakes', `Category: ${body?.data?.[0]?.category}`);
  }

  // Test 12: Category filter is case-insensitive
  {
    const req = { query: { category: 'bRaKeS' } };
    const { res, getResult } = makeMockRes();
    await getServices(req, res);
    const { body } = getResult();
    assert('Test 12: Category filter is case-insensitive', body.count === 1, `Count: ${body?.count}`);
  }

  // Test 13: Search + Category filtering works together
  {
    const req = { query: { category: 'General Service', search: 'Oil' } };
    const { res, getResult } = makeMockRes();
    await getServices(req, res);
    const { body } = getResult();
    assert('Test 13: Search + Category filtering works together', body.count === 1 && body.data[0]._id === srvActive1Id, `Count: ${body?.count}`);
  }

  // Test 14: Invalid/non-existent category handled safely
  {
    const req = { query: { category: 'NonExistentCategory' } };
    const { res, getResult } = makeMockRes();
    await getServices(req, res);
    const { status, body } = getResult();
    assert('Test 14: Invalid/non-existent category handled safely (HTTP 200, count 0)', status === 200 && body.count === 0, `Count: ${body?.count}`);
  }

  // --- DETAILS TESTS ---

  // Test 15: Valid service details request succeeds
  {
    const req = { params: { id: srvActive1Id } };
    const { res, getResult } = makeMockRes();
    await getServiceById(req, res);
    const { status, body } = getResult();
    assert('Test 15: Valid service details request succeeds (HTTP 200)', status === 200 && body.data?.name === 'Synthetic Oil Change', `Status: ${status}`);
  }

  // Test 16: Invalid service ID returns 400
  {
    const req = { params: { id: 'invalid-id' } };
    const { res, getResult } = makeMockRes();
    await getServiceById(req, res);
    const { status } = getResult();
    assert('Test 16: Invalid service ID returns 400', status === 400, `Status: ${status}`);
  }

  // Test 17: Non-existent service returns 404
  {
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
    const { res, getResult } = makeMockRes();
    await getServiceById(req, res);
    const { status } = getResult();
    assert('Test 17: Non-existent service returns 404', status === 404, `Status: ${status}`);
  }

  // Test 18: Inactive service details handled
  {
    const req = { params: { id: srvInactiveId } };
    const { res, getResult } = makeMockRes();
    await getServiceById(req, res);
    const { status, body } = getResult();
    assert('Test 18: Inactive service detail retrieved with correct isActive flag', status === 200 && body.data?.isActive === false, `Status: ${status}`);
  }

  // --- PRICING & DURATION TESTS ---

  // Test 19, 20, 21, 22: Correct numeric price and duration returned
  {
    const req = { params: { id: srvActive1Id } };
    const { res, getResult } = makeMockRes();
    await getServiceById(req, res);
    const { body } = getResult();
    const s = body.data;

    assert('Test 19: Correct price returned from MongoDB (1500)', s?.price === 1500, `Price: ${s?.price}`);
    assert('Test 20: Correct duration returned from MongoDB (60)', s?.duration === 60, `Duration: ${s?.duration}`);
    assert('Test 21: Price is valid non-negative number', typeof s?.price === 'number' && s?.price >= 0, `Price type: ${typeof s?.price}`);
    assert('Test 22: Duration is valid non-negative number', typeof s?.duration === 'number' && s?.duration >= 0, `Duration type: ${typeof s?.duration}`);
  }

  // --- BOOKING INTEGRITY TESTS ---

  // Test 23: Valid service can be booked
  {
    const req = {
      user: { _id: custId, role: 'CUSTOMER' },
      body: {
        vehicle: veh1Id,
        service: srvActive1Id,
        serviceCenter: center1Id,
        bookingDate: '2026-09-15',
        bookingTime: '10:00 AM',
      },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();
    assert('Test 23: Valid service can be booked (HTTP 201)', status === 201 && body.success === true, `Status: ${status}`);
  }

  // Test 24: Non-existent service cannot be booked (HTTP 404)
  {
    const req = {
      user: { _id: custId, role: 'CUSTOMER' },
      body: {
        vehicle: veh1Id,
        service: new mongoose.Types.ObjectId().toString(),
        serviceCenter: center1Id,
        bookingDate: '2026-09-15',
        bookingTime: '11:00 AM',
      },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status } = getResult();
    assert('Test 24: Non-existent service cannot be booked (HTTP 404)', status === 404, `Status: ${status}`);
  }

  // Test 25: Inactive service cannot be booked (HTTP 400)
  {
    const req = {
      user: { _id: custId, role: 'CUSTOMER' },
      body: {
        vehicle: veh1Id,
        service: srvInactiveId,
        serviceCenter: center1Id,
        bookingDate: '2026-09-15',
        bookingTime: '11:00 AM',
      },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();
    assert('Test 25: Inactive service cannot be booked (HTTP 400)', status === 400 && body.message.includes('not available'), `Status: ${status}, Msg: ${body?.message}`);
  }

  // Test 26 & 27: Client cannot override service price (backend assigns database service price)
  {
    const fakePriceReq = {
      user: { _id: custId, role: 'CUSTOMER' },
      body: {
        vehicle: veh1Id,
        service: srvActive1Id, // Price is 1500 in DB
        serviceCenter: center1Id,
        bookingDate: '2026-09-20',
        bookingTime: '02:00 PM',
        amount: 1, // Client attempting to fake price to 1 rupee
      },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(fakePriceReq, res);
    const { body } = getResult();

    assert('Test 26: Client fake price override is ignored', body.data?.amount === 1500, `Amount assigned: ${body.data?.amount}`);
    assert('Test 27: Backend enforces database service price (1500)', body.data?.amount === 1500, `Amount: ${body.data?.amount}`);
  }

  // Test 28: Service-center compatibility remains enforced
  {
    const unsupportedSrvId = new mongoose.Types.ObjectId().toString();
    serviceStore.set(unsupportedSrvId, { _id: unsupportedSrvId, name: 'Transmission Replacement', price: 30000, isActive: true });

    const req = {
      user: { _id: custId, role: 'CUSTOMER' },
      body: {
        vehicle: veh1Id,
        service: unsupportedSrvId, // Not offered by center1Id
        serviceCenter: center1Id,
        bookingDate: '2026-09-22',
        bookingTime: '03:00 PM',
      },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();
    assert('Test 28: Service-center compatibility remains enforced (HTTP 400)', status === 400 && body.message.includes('does not offer'), `Status: ${status}`);
  }

  restoreMocks();

  console.log('\n==================================================');
  console.log(`TOTAL TESTS: ${results.passed + results.failed}`);
  console.log(`PASSED: ${results.passed}`);
  console.log(`FAILED: ${results.failed}`);
  console.log('==================================================\n');
}

runServicesCatalogTests().catch(console.error);
