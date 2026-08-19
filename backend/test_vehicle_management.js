import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import Vehicle from './src/models/Vehicle.js';
import Booking from './src/models/Booking.js';
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from './src/controllers/vehicleController.js';

// In-memory test stores
const userStore = new Map();
const vehicleStore = new Map();
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

// Preserve original model methods
const origUserFindById = User.findById;
const origVehicleFind = Vehicle.find;
const origVehicleFindById = Vehicle.findById;
const origVehicleFindOne = Vehicle.findOne;
const origVehicleCreate = Vehicle.create;
const origVehicleFindByIdAndUpdate = Vehicle.findByIdAndUpdate;
const origVehicleFindByIdAndDelete = Vehicle.findByIdAndDelete;
const origBookingFindOne = Booking.findOne;

function setupVehicleMocks() {
  User.findById = async function (id) {
    return userStore.get(id?.toString() || id) || null;
  };

  Vehicle.find = function (filter = {}) {
    let list = Array.from(vehicleStore.values());
    if (filter.user) {
      list = list.filter((v) => v.user?.toString() === filter.user.toString());
    }
    return {
      populate() {
        return this;
      },
      sort() {
        return list.map((v) => ({
          ...v,
          user: userStore.get(v.user?.toString()) || v.user,
        }));
      },
    };
  };

  Vehicle.findById = function (id) {
    const v = vehicleStore.get(id?.toString() || id);
    return {
      populate() {
        return this;
      },
      then(resolve) {
        if (!v) return resolve(null);
        const populated = {
          ...v,
          user: userStore.get(v.user?.toString()) || v.user,
        };
        resolve(populated);
      },
    };
  };

  Vehicle.findOne = async function (query) {
    const regToFind = query.registrationNumber;
    for (const v of vehicleStore.values()) {
      if (query._id && query._id.$ne && query._id.$ne.toString() === v._id.toString()) {
        continue;
      }
      if (v.registrationNumber === regToFind) {
        return v;
      }
    }
    return null;
  };

  Vehicle.create = async function (doc) {
    const _id = new mongoose.Types.ObjectId().toString();
    const newVehicle = {
      _id,
      ...doc,
      user: doc.user?.toString() || doc.user,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vehicleStore.set(_id, newVehicle);
    return newVehicle;
  };

  Vehicle.findByIdAndUpdate = function (id, updateData, options) {
    const existing = vehicleStore.get(id?.toString() || id);
    if (!existing) return { populate() { return Promise.resolve(null); } };

    const updated = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    vehicleStore.set(id.toString(), updated);

    return {
      populate() {
        return Promise.resolve({
          ...updated,
          user: userStore.get(updated.user?.toString()) || updated.user,
        });
      },
    };
  };

  Vehicle.findByIdAndDelete = async function (id) {
    const deleted = vehicleStore.get(id?.toString() || id);
    vehicleStore.delete(id?.toString() || id);
    return deleted;
  };

  Booking.findOne = async function (query) {
    if (query.vehicle) {
      const vehId = query.vehicle.toString();
      for (const b of bookingStore.values()) {
        if (
          b.vehicle?.toString() === vehId &&
          query.status &&
          query.status.$in &&
          query.status.$in.includes(b.status)
        ) {
          return b;
        }
      }
    }
    return null;
  };
}

function restoreVehicleMocks() {
  User.findById = origUserFindById;
  Vehicle.find = origVehicleFind;
  Vehicle.findById = origVehicleFindById;
  Vehicle.findOne = origVehicleFindOne;
  Vehicle.create = origVehicleCreate;
  Vehicle.findByIdAndUpdate = origVehicleFindByIdAndUpdate;
  Vehicle.findByIdAndDelete = origVehicleFindByIdAndDelete;
  Booking.findOne = origBookingFindOne;
}

async function runVehicleTests() {
  console.log('==================================================');
  console.log('  CARFIX VEHICLE MANAGEMENT AUTOMATED TEST SUITE  ');
  console.log('==================================================\n');

  setupVehicleMocks();

  const cust1Id = new mongoose.Types.ObjectId().toString();
  const cust2Id = new mongoose.Types.ObjectId().toString();

  userStore.set(cust1Id, { _id: cust1Id, name: 'Alice Customer', email: 'alice@carfix.com', role: 'CUSTOMER' });
  userStore.set(cust2Id, { _id: cust2Id, name: 'Bob Customer', email: 'bob@carfix.com', role: 'CUSTOMER' });

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

  let veh1Id = null;

  // Test 1: Authenticated customer can create a vehicle
  {
    const req = {
      body: {
        make: 'Toyota',
        model: 'Corolla',
        year: 2023,
        registrationNumber: 'MH-12-TC-9999',
        fuelType: 'Petrol',
        color: 'Silver',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createVehicle(req, res);
    const { status, body } = getResult();

    veh1Id = body?.data?._id;
    assert(
      'Test 1: Authenticated customer can create a vehicle',
      status === 201 && body.success === true && body.data?.make === 'Toyota',
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 2: Unauthenticated vehicle creation is rejected
  {
    const req = {
      body: {
        make: 'Honda',
        model: 'Civic',
        year: 2022,
        registrationNumber: 'MH-12-HC-1111',
        fuelType: 'Petrol',
      },
      user: null,
    };
    const { res, getResult } = makeMockRes();
    await createVehicle(req, res);
    const { status, body } = getResult();

    assert(
      'Test 2: Unauthenticated vehicle creation is rejected',
      status === 400 || status === 401,
      `Status: ${status}`
    );
  }

  // Test 3: Customer can retrieve their own vehicles
  {
    const req = {
      query: {},
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await getVehicles(req, res);
    const { status, body } = getResult();

    assert(
      'Test 3: Customer can retrieve their own vehicles',
      status === 200 && Array.isArray(body.data) && body.data.length === 1,
      `Status: ${status}, Count: ${body.count}`
    );
  }

  // Test 4: Customer cannot retrieve another customer's vehicles
  {
    const req = {
      query: {},
      user: { _id: cust2Id, role: 'CUSTOMER' }, // Requesting as Customer 2
    };
    const { res, getResult } = makeMockRes();
    await getVehicles(req, res);
    const { status, body } = getResult();

    assert(
      "Test 4: Customer 2 receives only their own empty vehicle list",
      status === 200 && Array.isArray(body.data) && body.data.length === 0,
      `Status: ${status}, Count: ${body.count}`
    );
  }

  // Test 5: Customer can update their own vehicle
  {
    const req = {
      params: { id: veh1Id },
      body: { color: 'Pearl White', mileage: 15000 },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await updateVehicle(req, res);
    const { status, body } = getResult();

    assert(
      'Test 5: Customer can update their own vehicle',
      status === 200 && body.data?.color === 'Pearl White',
      `Status: ${status}, Color: ${body.data?.color}`
    );
  }

  // Test 6: Customer cannot update another customer's vehicle
  {
    const req = {
      params: { id: veh1Id }, // Vehicle owned by Customer 1
      body: { color: 'Black' },
      user: { _id: cust2Id, role: 'CUSTOMER' }, // Requesting as Customer 2
    };
    const { res, getResult } = makeMockRes();
    await updateVehicle(req, res);
    const { status, body } = getResult();

    assert(
      "Test 6: Customer cannot update another customer's vehicle (HTTP 403)",
      status === 403 && body.message === 'Not authorized to modify this vehicle',
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  // Create a second vehicle for Customer 2
  let veh2Id = null;
  {
    const req = {
      body: {
        make: 'Hyundai',
        model: 'Creta',
        year: 2024,
        registrationNumber: 'MH-12-HY-8888',
        fuelType: 'Diesel',
      },
      user: { _id: cust2Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createVehicle(req, res);
    const { body } = getResult();
    veh2Id = body?.data?._id;
  }

  // Test 7: Customer can delete their own vehicle (tested on an extra vehicle for Customer 1)
  {
    const reqCreate = {
      body: {
        make: 'Nissan',
        model: 'Sunny',
        year: 2021,
        registrationNumber: 'MH-12-NS-7777',
        fuelType: 'Petrol',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res: resCreate, getResult: getResCreate } = makeMockRes();
    await createVehicle(reqCreate, resCreate);
    const { body: bodyCreate } = getResCreate();
    const tempVehId = bodyCreate?.data?._id;

    const reqDel = {
      params: { id: tempVehId },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res: resDel, getResult: getResDel } = makeMockRes();
    await deleteVehicle(reqDel, resDel);
    const { status: statusDel } = getResDel();

    assert(
      'Test 7: Customer can delete their own vehicle (HTTP 200)',
      statusDel === 200,
      `Status: ${statusDel}`
    );
  }

  // Test 8: Customer cannot delete another customer's vehicle
  {
    const reqUnauthorized = {
      params: { id: veh2Id }, // Vehicle owned by Customer 2
      user: { _id: cust1Id, role: 'CUSTOMER' }, // Customer 1
    };
    const { res: res1, getResult: getRes1 } = makeMockRes();
    await deleteVehicle(reqUnauthorized, res1);
    const { status: status1 } = getRes1();

    assert(
      "Test 8: Customer cannot delete another customer's vehicle (HTTP 403)",
      status1 === 403,
      `Status: ${status1}`
    );
  }

  // Test 9: Duplicate registration number is rejected (HTTP 409)
  {
    const req = {
      body: {
        make: 'Ford',
        model: 'Mustang',
        year: 2022,
        registrationNumber: 'MH-12-TC-9999', // Matches Customer 1's vehicle reg
        fuelType: 'Petrol',
      },
      user: { _id: cust2Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createVehicle(req, res);
    const { status, body } = getResult();

    assert(
      'Test 9: Duplicate registration number is rejected (HTTP 409)',
      status === 409 && body.message.includes('registration number already exists'),
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  // Test 10: Editing a vehicle to another existing registration number is rejected
  {
    const req = {
      params: { id: veh2Id },
      body: { registrationNumber: 'MH-12-TC-9999' }, // Exists on veh1Id
      user: { _id: cust2Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await updateVehicle(req, res);
    const { status, body } = getResult();

    assert(
      'Test 10: Updating vehicle to an existing registration number is rejected (HTTP 409)',
      status === 409 && body.message.includes('registration number already exists'),
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  // Test 11: Invalid vehicle ID format is rejected
  {
    const req = {
      params: { id: 'invalid-id-format' },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await getVehicleById(req, res);
    const { status } = getResult();

    assert('Test 11: Invalid vehicle ID is rejected (HTTP 400)', status === 400, `Status: ${status}`);
  }

  // Test 12: Non-existent vehicle returns HTTP 404
  {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const req = {
      params: { id: nonExistentId },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await getVehicleById(req, res);
    const { status, body } = getResult();

    assert('Test 12: Non-existent vehicle returns HTTP 404', status === 404 && body.message === 'Vehicle not found', `Status: ${status}`);
  }

  // Test 13: Required vehicle fields are validated (missing make)
  {
    const req = {
      body: {
        make: '',
        model: 'Corolla',
        year: 2023,
        registrationNumber: 'MH-12-XX-1111',
        fuelType: 'Petrol',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createVehicle(req, res);
    const { status, body } = getResult();

    assert('Test 13: Missing make is rejected (HTTP 400)', status === 400 && body.message === 'Make is required', `Status: ${status}`);
  }

  // Test 14: Invalid field values are rejected (invalid year & invalid fuelType)
  {
    const reqBadYear = {
      body: {
        make: 'Honda',
        model: 'Civic',
        year: 1850, // Invalid year
        registrationNumber: 'MH-12-XX-2222',
        fuelType: 'Petrol',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res: resYear, getResult: getResYear } = makeMockRes();
    await createVehicle(reqBadYear, resYear);
    const { status: statusYear } = getResYear();

    assert('Test 14: Invalid vehicle year is rejected (HTTP 400)', statusYear === 400, `Status: ${statusYear}`);
  }

  // Test 15: Vehicle ownership is determined from JWT rather than request body
  {
    const req = {
      body: {
        user: cust2Id, // Attempting to assign to Customer 2
        make: 'BMW',
        model: 'X5',
        year: 2024,
        registrationNumber: 'MH-12-BM-5555',
        fuelType: 'Petrol',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' }, // Authenticated as Customer 1
    };
    const { res, getResult } = makeMockRes();
    await createVehicle(req, res);
    const { status, body } = getResult();
    const assignedUser = body?.data?.user;
    const assignedId = assignedUser?._id ? assignedUser._id.toString() : assignedUser?.toString();

    assert(
      'Test 15: Vehicle owner is assigned from JWT ID, ignoring body.user',
      status === 201 && assignedId === cust1Id,
      `Assigned user: ${assignedId} vs Auth user: ${cust1Id}`
    );
  }

  // Test 16: Password/security-sensitive fields cannot be injected
  {
    const req = {
      body: {
        make: 'Audi',
        model: 'A6',
        year: 2023,
        registrationNumber: 'MH-12-AU-6666',
        fuelType: 'Petrol',
        role: 'ADMIN', // Injection attempt
        password: 'hackedpassword',
      },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await createVehicle(req, res);
    const { body } = getResult();

    assert(
      'Test 16: Security sensitive fields ignored during vehicle creation',
      body?.data?.role === undefined && body?.data?.password === undefined,
      'Clean vehicle document'
    );
  }

  // Test 17: Created vehicle persists in database
  {
    const stored = vehicleStore.get(veh1Id);
    assert(
      'Test 17: Created vehicle persists in database',
      stored && stored.make === 'Toyota',
      `Stored make: ${stored?.make}`
    );
  }

  // Test 18: Updated vehicle persists after re-fetch
  {
    const req = {
      params: { id: veh1Id },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await getVehicleById(req, res);
    const { body } = getResult();

    assert(
      'Test 18: Updated vehicle color persists on re-fetch',
      body?.data?.color === 'Pearl White',
      `Re-fetched color: ${body?.data?.color}`
    );
  }

  // Test 19: Deleted vehicle is no longer returned
  {
    const reqDel = {
      params: { id: veh2Id },
      user: { _id: cust2Id, role: 'CUSTOMER' },
    };
    const { res: resDel, getResult: getResDel } = makeMockRes();
    await deleteVehicle(reqDel, resDel);
    const { status: statusDel } = getResDel();

    const reqFetch = {
      params: { id: veh2Id },
      user: { _id: cust2Id, role: 'CUSTOMER' },
    };
    const { res: resFetch, getResult: getResFetch } = makeMockRes();
    await getVehicleById(reqFetch, resFetch);
    const { status: statusFetch } = getResFetch();

    assert(
      'Test 19: Deleted vehicle is no longer returned (HTTP 404)',
      statusDel === 200 && statusFetch === 404,
      `Delete status: ${statusDel}, Fetch status: ${statusFetch}`
    );
  }

  // Test 20: Existing active booking prevents vehicle deletion
  {
    // Attach active booking to veh1Id
    const activeBookingId = new mongoose.Types.ObjectId().toString();
    bookingStore.set(activeBookingId, {
      _id: activeBookingId,
      user: cust1Id,
      vehicle: veh1Id,
      status: 'CONFIRMED',
    });

    const reqDel = {
      params: { id: veh1Id },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await deleteVehicle(reqDel, res);
    const { status, body } = getResult();

    assert(
      'Test 20: Deleting vehicle with active booking is blocked (HTTP 400)',
      status === 400 && body.message.includes('active bookings'),
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  restoreVehicleMocks();

  console.log('\n==================================================');
  console.log(`TOTAL TESTS: ${results.passed + results.failed}`);
  console.log(`PASSED: ${results.passed}`);
  console.log(`FAILED: ${results.failed}`);
  console.log('==================================================\n');
}

runVehicleTests().catch(console.error);
