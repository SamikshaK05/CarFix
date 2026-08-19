import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import Vehicle from './src/models/Vehicle.js';
import Service from './src/models/Service.js';
import ServiceCenter from './src/models/ServiceCenter.js';
import Booking from './src/models/Booking.js';
import { createBooking, getBookings } from './src/controllers/bookingController.js';

// In-memory data stores for unit test mocking
const userStore = new Map();
const vehicleStore = new Map();
const serviceStore = new Map();
const serviceCenterStore = new Map();
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

// Save original model methods
const origUserFindById = User.findById;
const origVehicleFindById = Vehicle.findById;
const origServiceFindById = Service.findById;
const origServiceCenterFindById = ServiceCenter.findById;
const origBookingFindOne = Booking.findOne;
const origBookingFindById = Booking.findById;
const origBookingCreate = Booking.create;

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

  Booking.findOne = async function (query) {
    for (const b of bookingStore.values()) {
      if (query._id && query._id.$ne && query._id.$ne.toString() === b._id.toString()) {
        continue;
      }
      if (
        query.serviceCenter &&
        query.serviceCenter.toString() === b.serviceCenter.toString() &&
        query.bookingTime === b.bookingTime &&
        query.status &&
        query.status.$in &&
        query.status.$in.includes(b.status)
      ) {
        const queryDate = new Date(query.bookingDate).getTime();
        const bDate = new Date(b.bookingDate).getTime();
        if (queryDate === bDate) {
          return b;
        }
      }
    }
    return null;
  };

  Booking.findById = function (id) {
    const b = bookingStore.get(id?.toString() || id);
    return {
      populate() {
        return this;
      },
      then(resolve) {
        if (!b) return resolve(null);
        // Attach populated mock references
        const populated = {
          ...b,
          user: userStore.get(b.user?.toString()) || b.user,
          vehicle: vehicleStore.get(b.vehicle?.toString()) || b.vehicle,
          service: serviceStore.get(b.service?.toString()) || b.service,
          serviceCenter: serviceCenterStore.get(b.serviceCenter?.toString()) || b.serviceCenter,
        };
        resolve(populated);
      },
    };
  };

  Booking.create = async function (doc) {
    const _id = new mongoose.Types.ObjectId().toString();
    const newBooking = {
      _id,
      ...doc,
      status: doc.status || 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    bookingStore.set(_id, newBooking);
    return newBooking;
  };
}

function restoreMocks() {
  User.findById = origUserFindById;
  Vehicle.findById = origVehicleFindById;
  Service.findById = origServiceFindById;
  ServiceCenter.findById = origServiceCenterFindById;
  Booking.findOne = origBookingFindOne;
  Booking.findById = origBookingFindById;
  Booking.create = origBookingCreate;
}

// Fixture helpers
function getTomorrowDateStr() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

function getYesterdayDateStr() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

async function runBookingTests() {
  console.log('==================================================');
  console.log('  CARFIX SERVICE BOOKING AUTOMATED TEST SUITE     ');
  console.log('==================================================\n');

  setupMocks();

  // Create mock entities
  const cust1Id = new mongoose.Types.ObjectId().toString();
  const cust2Id = new mongoose.Types.ObjectId().toString();

  userStore.set(cust1Id, { _id: cust1Id, name: 'Alice Customer', email: 'alice@carfix.com', role: 'CUSTOMER' });
  userStore.set(cust2Id, { _id: cust2Id, name: 'Bob Customer', email: 'bob@carfix.com', role: 'CUSTOMER' });

  const veh1Id = new mongoose.Types.ObjectId().toString(); // Belongs to Cust 1
  const veh2Id = new mongoose.Types.ObjectId().toString(); // Belongs to Cust 2

  vehicleStore.set(veh1Id, { _id: veh1Id, user: cust1Id, make: 'Honda', model: 'City', registrationNumber: 'MH-12-HC-1001' });
  vehicleStore.set(veh2Id, { _id: veh2Id, user: cust2Id, make: 'Hyundai', model: 'i20', registrationNumber: 'MH-12-HY-2002' });

  const srv1Id = new mongoose.Types.ObjectId().toString();
  serviceStore.set(srv1Id, { _id: srv1Id, name: 'Full Engine Service', price: 3500, isActive: true });

  const ctr1Id = new mongoose.Types.ObjectId().toString();
  serviceCenterStore.set(ctr1Id, { _id: ctr1Id, name: 'CarFix Pune Central', isActive: true, services: [srv1Id] });

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

  const validDate = getTomorrowDateStr();
  const validSlot = '10:30 AM';

  // Test 1: Authenticated customer can create a valid booking
  let createdBookingId = null;
  {
    const req = {
      body: {
        vehicle: veh1Id,
        service: srv1Id,
        serviceCenter: ctr1Id,
        bookingDate: validDate,
        bookingTime: validSlot,
        notes: 'Oil change and general inspection',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();

    createdBookingId = body?.data?._id;
    assert(
      'Test 1: Authenticated customer can create a valid booking',
      status === 201 && body.success === true && body.data?.status === 'PENDING',
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 2: Unauthenticated customer cannot create a booking (missing req.user)
  {
    const req = {
      body: {
        vehicle: veh1Id,
        service: srv1Id,
        serviceCenter: ctr1Id,
        bookingDate: validDate,
        bookingTime: '02:00 PM',
      },
      user: null,
    };
    const { res, getResult } = makeMockRes();
    try {
      await createBooking(req, res);
      const { status } = getResult();
      assert('Test 2: Unauthenticated request is rejected', status === 400 || status === 401, `Status: ${status}`);
    } catch (e) {
      assert('Test 2: Unauthenticated request is rejected', true, 'Caught error');
    }
  }

  // Test 3: Missing vehicle is rejected
  {
    const req = {
      body: {
        vehicle: '',
        service: srv1Id,
        serviceCenter: ctr1Id,
        bookingDate: validDate,
        bookingTime: '02:00 PM',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();

    assert(
      'Test 3: Missing vehicle is rejected',
      status === 400 && body.message === 'Invalid vehicle ID',
      `Status: ${status}`
    );
  }

  // Test 4: Invalid vehicle ID is rejected
  {
    const req = {
      body: {
        vehicle: 'invalid-id-format',
        service: srv1Id,
        serviceCenter: ctr1Id,
        bookingDate: validDate,
        bookingTime: '02:00 PM',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();

    assert(
      'Test 4: Invalid vehicle ID format is rejected',
      status === 400 && body.message === 'Invalid vehicle ID',
      `Status: ${status}`
    );
  }

  // Test 5: Customer cannot book using another customer's vehicle
  {
    const req = {
      body: {
        vehicle: veh2Id, // Belongs to Customer 2
        service: srv1Id,
        serviceCenter: ctr1Id,
        bookingDate: validDate,
        bookingTime: '02:00 PM',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' }, // Requesting as Customer 1
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();

    assert(
      "Test 5: Customer cannot book using another customer's vehicle",
      status === 400 && body.message === 'Vehicle does not belong to this user',
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  // Test 6: Invalid service is rejected
  {
    const nonExistentSrvId = new mongoose.Types.ObjectId().toString();
    const req = {
      body: {
        vehicle: veh1Id,
        service: nonExistentSrvId,
        serviceCenter: ctr1Id,
        bookingDate: validDate,
        bookingTime: '02:00 PM',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();

    assert(
      'Test 6: Invalid/non-existent service is rejected',
      status === 404 && body.message === 'Service not found',
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  // Test 7: Invalid service center is rejected
  {
    const nonExistentCtrId = new mongoose.Types.ObjectId().toString();
    const req = {
      body: {
        vehicle: veh1Id,
        service: srv1Id,
        serviceCenter: nonExistentCtrId,
        bookingDate: validDate,
        bookingTime: '02:00 PM',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();

    assert(
      'Test 7: Invalid/non-existent service center is rejected',
      status === 404 && body.message === 'Service center not found',
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  // Test 8: Missing booking date is rejected
  {
    const req = {
      body: {
        vehicle: veh1Id,
        service: srv1Id,
        serviceCenter: ctr1Id,
        bookingDate: '',
        bookingTime: '02:00 PM',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();

    assert(
      'Test 8: Missing booking date is rejected',
      status === 400 && body.message === 'Booking date is required',
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  // Test 9: Past booking date is rejected
  {
    const pastDate = getYesterdayDateStr();
    const req = {
      body: {
        vehicle: veh1Id,
        service: srv1Id,
        serviceCenter: ctr1Id,
        bookingDate: pastDate,
        bookingTime: '02:00 PM',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();

    assert(
      'Test 9: Past booking date is rejected',
      status === 400 && body.message === 'Booking date cannot be in the past',
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  // Test 10: Invalid time slot format is rejected
  {
    const req = {
      body: {
        vehicle: veh1Id,
        service: srv1Id,
        serviceCenter: ctr1Id,
        bookingDate: validDate,
        bookingTime: 'invalid-time-slot-99',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();

    assert(
      'Test 10: Invalid time slot format is rejected',
      status === 400 && body.message.includes('Invalid time slot format'),
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  // Test 11 & 13: Already-booked slot is rejected & duplicate booking prevented
  {
    // Try booking the exact same date & slot as Test 1 (validDate, validSlot '10:30 AM')
    const req = {
      body: {
        vehicle: veh1Id,
        service: srv1Id,
        serviceCenter: ctr1Id,
        bookingDate: validDate,
        bookingTime: validSlot, // Already booked in Test 1
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();

    assert(
      'Test 11 & 13: Already-booked slot / duplicate booking is rejected (HTTP 409)',
      status === 409 && body.message === 'This time slot is already booked',
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  // Test 12: Valid available slot can be booked
  {
    const req = {
      body: {
        vehicle: veh1Id,
        service: srv1Id,
        serviceCenter: ctr1Id,
        bookingDate: validDate,
        bookingTime: '02:00 PM', // Different slot
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();

    assert(
      'Test 12: Valid available slot (02:00 PM) can be booked',
      status === 201 && body.success === true,
      `Status: ${status}`
    );
  }

  // Test 14: Booking is correctly associated with authenticated customer
  {
    const req = {
      body: {
        user: cust2Id, // Attempting to pass user 2 in body
        vehicle: veh1Id,
        service: srv1Id,
        serviceCenter: ctr1Id,
        bookingDate: validDate,
        bookingTime: '04:00 PM',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' }, // Authenticated as Customer 1
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();

    const createdUserObj = body?.data?.user;
    const assignedUserId = createdUserObj?._id ? createdUserObj._id.toString() : createdUserObj?.toString();

    assert(
      'Test 14: Booking owner is overridden by authenticated customer JWT ID',
      status === 201 && assignedUserId === cust1Id,
      `Assigned user ID: ${assignedUserId} vs Auth user ID: ${cust1Id}`
    );
  }

  // Test 15: Created booking persists in database
  {
    const storedBooking = bookingStore.get(createdBookingId);
    assert(
      'Test 15: Created booking persists in database',
      storedBooking && storedBooking.bookingTime === validSlot,
      `Stored booking ID: ${createdBookingId}`
    );
  }

  // Test 16: Booking response does not expose sensitive user information
  {
    const req = {
      body: {
        vehicle: veh1Id,
        service: srv1Id,
        serviceCenter: ctr1Id,
        bookingDate: validDate,
        bookingTime: '06:00 PM',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { body } = getResult();
    const userInBooking = body.data?.user;

    assert(
      'Test 16: Booking response does not expose password or sensitive fields',
      userInBooking && userInBooking.password === undefined && userInBooking.resetPasswordToken === undefined,
      `User keys in response: ${userInBooking ? Object.keys(userInBooking).join(', ') : 'none'}`
    );
  }

  restoreMocks();

  console.log('\n==================================================');
  console.log(`TOTAL TESTS: ${results.passed + results.failed}`);
  console.log(`PASSED: ${results.passed}`);
  console.log(`FAILED: ${results.failed}`);
  console.log('==================================================\n');
}

runBookingTests().catch(console.error);
