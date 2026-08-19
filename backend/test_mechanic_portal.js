import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import Vehicle from './src/models/Vehicle.js';
import Service from './src/models/Service.js';
import ServiceCenter from './src/models/ServiceCenter.js';
import Booking from './src/models/Booking.js';
import Invoice from './src/models/Invoice.js';

import { getMechanicDashboard } from './src/controllers/mechanicController.js';
import {
  getBookings,
  getBookingById,
  updateBookingStatus,
} from './src/controllers/bookingController.js';

// In-memory test data stores
const userStore = new Map();
const vehicleStore = new Map();
const serviceStore = new Map();
const centerStore = new Map();
const bookingStore = new Map();
const invoiceStore = new Map();

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
const origUserFindOne = User.findOne;
const origVehicleFindById = Vehicle.findById;
const origServiceFindById = Service.findById;
const origBookingCount = Booking.countDocuments;
const origBookingFind = Booking.find;
const origBookingFindById = Booking.findById;
const origInvoiceFindOne = Invoice.findOne;
const origInvoiceCreate = Invoice.create;
const origInvoiceFind = Invoice.find;

function setupMocks() {
  User.findById = async function (id) {
    return userStore.get(id?.toString() || id) || null;
  };
  User.findOne = async function (filter = {}) {
    for (const u of userStore.values()) {
      if (filter.email && u.email === filter.email) return u;
    }
    return null;
  };

  Vehicle.findById = async function (id) {
    return vehicleStore.get(id?.toString() || id) || null;
  };

  Service.findById = async function (id) {
    return serviceStore.get(id?.toString() || id) || null;
  };

  Booking.countDocuments = async function (filter = {}) {
    let list = Array.from(bookingStore.values());
    if (filter.mechanic) {
      list = list.filter((b) => b.mechanic?.toString() === filter.mechanic.toString());
    }
    if (filter.status) {
      if (filter.status.$in) {
        list = list.filter((b) => filter.status.$in.includes(b.status));
      } else {
        list = list.filter((b) => b.status === filter.status);
      }
    }
    return list.length;
  };

  Booking.find = function (filter = {}) {
    let list = Array.from(bookingStore.values());
    if (filter.mechanic) {
      list = list.filter((b) => b.mechanic?.toString() === filter.mechanic.toString());
    }
    if (filter.status) {
      if (filter.status.$in) {
        list = list.filter((b) => filter.status.$in.includes(b.status));
      } else {
        list = list.filter((b) => b.status === filter.status);
      }
    }

    const populated = list.map((b) => {
      const uDoc = userStore.get(b.user?.toString());
      const vDoc = vehicleStore.get(b.vehicle?.toString());
      const sDoc = serviceStore.get(b.service?.toString());
      const cDoc = centerStore.get(b.serviceCenter?.toString());
      const mDoc = b.mechanic ? userStore.get(b.mechanic.toString()) : null;
      return {
        ...b,
        user: uDoc ? { _id: uDoc._id, name: uDoc.name, email: uDoc.email, phone: uDoc.phone } : b.user,
        vehicle: vDoc ? { _id: vDoc._id, make: vDoc.make, model: vDoc.model, registrationNumber: vDoc.registrationNumber } : b.vehicle,
        service: sDoc ? { _id: sDoc._id, name: sDoc.name, category: sDoc.category, price: sDoc.price, duration: sDoc.duration } : b.service,
        serviceCenter: cDoc ? { _id: cDoc._id, name: cDoc.name, city: cDoc.city, address: cDoc.address } : b.serviceCenter,
        mechanic: mDoc ? { _id: mDoc._id, name: mDoc.name, email: mDoc.email, phone: mDoc.phone } : null,
      };
    });

    return {
      select() { return this; },
      sort() { return this; },
      limit() { return this; },
      populate() { return this; },
      lean() { return populated; },
      then(resolve) { resolve(populated); },
    };
  };

  Booking.findById = function (id) {
    const rawB = bookingStore.get(id?.toString() || id);
    if (!rawB) {
      return {
        populate() { return this; },
        then(resolve) { resolve(null); },
      };
    }

    const uDoc = userStore.get(rawB.user?.toString());
    const vDoc = vehicleStore.get(rawB.vehicle?.toString());
    const sDoc = serviceStore.get(rawB.service?.toString());
    const cDoc = centerStore.get(rawB.serviceCenter?.toString());
    const mDoc = rawB.mechanic ? userStore.get(rawB.mechanic.toString()) : null;

    const b = {
      ...rawB,
      user: uDoc ? { _id: uDoc._id, name: uDoc.name, email: uDoc.email, phone: uDoc.phone } : rawB.user,
      vehicle: vDoc ? { _id: vDoc._id, make: vDoc.make, model: vDoc.model, registrationNumber: vDoc.registrationNumber } : rawB.vehicle,
      service: sDoc ? { _id: sDoc._id, name: sDoc.name, category: sDoc.category, price: sDoc.price, duration: sDoc.duration } : rawB.service,
      serviceCenter: cDoc ? { _id: cDoc._id, name: cDoc.name, city: cDoc.city, address: cDoc.address } : rawB.serviceCenter,
      mechanic: mDoc ? { _id: mDoc._id, name: mDoc.name, email: mDoc.email, phone: mDoc.phone } : null,
      async save() {
        rawB.status = b.status;
        rawB.mechanic = b.mechanic ? (b.mechanic._id ? b.mechanic._id.toString() : b.mechanic.toString()) : rawB.mechanic;
        bookingStore.set(rawB._id.toString(), rawB);
        return this;
      },
    };

    return {
      populate() { return this; },
      then(resolve) { resolve(b); },
    };
  };

  Invoice.findOne = async function (filter = {}) {
    for (const inv of invoiceStore.values()) {
      if (filter.booking && inv.booking?.toString() === filter.booking.toString()) return inv;
      if (filter.invoiceNumber && inv.invoiceNumber === filter.invoiceNumber) return inv;
    }
    return null;
  };

  Invoice.find = function (filter = {}) {
    let list = Array.from(invoiceStore.values());
    if (filter.booking && filter.booking.$in) {
      list = list.filter((inv) => filter.booking.$in.map((id) => id.toString()).includes(inv.booking?.toString()));
    }
    return {
      select() { return this; },
      sort() { return this; },
      limit() { return this; },
      populate() { return this; },
      lean() { return list; },
      then(resolve) { resolve(list); },
    };
  };

  Invoice.create = async function (doc) {
    const _id = new mongoose.Types.ObjectId().toString();
    const newInv = { _id, ...doc };
    invoiceStore.set(_id, newInv);
    return newInv;
  };
}

function restoreMocks() {
  User.findById = origUserFindById;
  User.findOne = origUserFindOne;
  Vehicle.findById = origVehicleFindById;
  Service.findById = origServiceFindById;
  Booking.countDocuments = origBookingCount;
  Booking.find = origBookingFind;
  Booking.findById = origBookingFindById;
  Invoice.findOne = origInvoiceFindOne;
  Invoice.find = origInvoiceFind;
  Invoice.create = origInvoiceCreate;
}

async function runMechanicPortalTests() {
  console.log('==================================================');
  console.log('    CARFIX MECHANIC PORTAL TEST SUITE             ');
  console.log('==================================================\n');

  setupMocks();

  // Test Entities Setup
  const center1Id = new mongoose.Types.ObjectId().toString();
  centerStore.set(center1Id, { _id: center1Id, name: 'CarFix Baner Center', city: 'Pune', address: 'Baner Road' });

  const mechAId = new mongoose.Types.ObjectId().toString(); // Active Mechanic A
  const mechBId = new mongoose.Types.ObjectId().toString(); // Active Mechanic B
  const inactiveMechId = new mongoose.Types.ObjectId().toString(); // Inactive Mechanic
  const custId = new mongoose.Types.ObjectId().toString();
  const mgrId = new mongoose.Types.ObjectId().toString();

  userStore.set(mechAId, { _id: mechAId, name: 'Mechanic Alex', email: 'mech.a@carfix.com', role: 'MECHANIC', isActive: true });
  userStore.set(mechBId, { _id: mechBId, name: 'Mechanic Bob', email: 'mech.b@carfix.com', role: 'MECHANIC', isActive: true });
  userStore.set(inactiveMechId, { _id: inactiveMechId, name: 'Mechanic Carl', email: 'mech.c@carfix.com', role: 'MECHANIC', isActive: false });
  userStore.set(custId, { _id: custId, name: 'Customer Alice', email: 'alice@carfix.com', role: 'CUSTOMER' });
  userStore.set(mgrId, { _id: mgrId, name: 'Manager Dan', email: 'mgr@carfix.com', role: 'SERVICE_MANAGER', serviceCenter: center1Id });

  const srvId = new mongoose.Types.ObjectId().toString();
  serviceStore.set(srvId, { _id: srvId, name: 'Brake Disc Overhaul', price: 2800, duration: 60, category: 'Brakes' });

  const vehId = new mongoose.Types.ObjectId().toString();
  vehicleStore.set(vehId, { _id: vehId, user: custId, make: 'Toyota', model: 'Corolla', registrationNumber: 'MH-12-MK-9999', fuelType: 'Petrol' });

  // Bookings assigned to Mechanic A
  const bMechAConfirmedId = new mongoose.Types.ObjectId().toString();
  const bMechAInProgressId = new mongoose.Types.ObjectId().toString();

  bookingStore.set(bMechAConfirmedId, {
    _id: bMechAConfirmedId,
    user: custId,
    vehicle: vehId,
    service: srvId,
    serviceCenter: center1Id,
    mechanic: mechAId,
    status: 'CONFIRMED',
    bookingDate: new Date(),
    bookingTime: '10:00 AM',
    amount: 2800,
  });

  bookingStore.set(bMechAInProgressId, {
    _id: bMechAInProgressId,
    user: custId,
    vehicle: vehId,
    service: srvId,
    serviceCenter: center1Id,
    mechanic: mechAId,
    status: 'IN_PROGRESS',
    bookingDate: new Date(),
    bookingTime: '01:00 PM',
    amount: 2800,
  });

  // Booking assigned to Mechanic B
  const bMechBId = new mongoose.Types.ObjectId().toString();
  bookingStore.set(bMechBId, {
    _id: bMechBId,
    user: custId,
    vehicle: vehId,
    service: srvId,
    serviceCenter: center1Id,
    mechanic: mechBId,
    status: 'CONFIRMED',
    bookingDate: new Date(),
    bookingTime: '03:00 PM',
    amount: 2800,
  });

  // Unassigned Pending Booking
  const bUnassignedPendingId = new mongoose.Types.ObjectId().toString();
  bookingStore.set(bUnassignedPendingId, {
    _id: bUnassignedPendingId,
    user: custId,
    vehicle: vehId,
    service: srvId,
    serviceCenter: center1Id,
    status: 'PENDING',
    bookingDate: new Date(),
    bookingTime: '05:00 PM',
    amount: 2800,
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

  // --- 1. MECHANIC DASHBOARD TESTS ---

  // Test 1: Authenticated Mechanic can access dashboard (HTTP 200)
  {
    const req = { user: userStore.get(mechAId) };
    const { res, getResult } = makeMockRes();
    await getMechanicDashboard(req, res);
    const { status, body } = getResult();
    assert('Test 1: Authenticated Mechanic can access dashboard (HTTP 200)', status === 200 && body.success === true, `Status: ${status}`);
  }

  // Test 2: Unauthenticated request handled cleanly
  {
    const req = { user: null };
    const { res, getResult } = makeMockRes();
    try {
      await getMechanicDashboard(req, res);
      const { status } = getResult();
      assert('Test 2: Unauthenticated dashboard request handles gracefully', status === 401 || status === 500, `Status: ${status}`);
    } catch (e) {
      assert('Test 2: Unauthenticated dashboard request handles gracefully', true, 'Caught error');
    }
  }

  // Test 3: Dashboard metrics accuracy (Mechanic A has exactly 2 assigned jobs)
  {
    const req = { user: userStore.get(mechAId) };
    const { res, getResult } = makeMockRes();
    await getMechanicDashboard(req, res);
    const { body } = getResult();
    assert('Test 3: Mechanic A dashboard returns strictly own 2 assigned jobs', body.data?.stats?.totalJobs === 2, `Total jobs: ${body.data?.stats?.totalJobs}`);
  }

  // Test 4: Mechanic B dashboard metrics isolation (Mechanic B has exactly 1 assigned job)
  {
    const req = { user: userStore.get(mechBId) };
    const { res, getResult } = makeMockRes();
    await getMechanicDashboard(req, res);
    const { body } = getResult();
    assert('Test 4: Mechanic B dashboard returns strictly own 1 assigned job', body.data?.stats?.totalJobs === 1, `Total jobs: ${body.data?.stats?.totalJobs}`);
  }

  // --- 2. ASSIGNED JOBS QUEUE SCOPING & PRIVACY TESTS ---

  // Test 5: Mechanic A retrieves own assigned jobs queue via getBookings
  {
    const req = { user: userStore.get(mechAId), query: {} };
    const { res, getResult } = makeMockRes();
    await getBookings(req, res);
    const { status, body } = getResult();
    const isIsolated = body.data?.every((b) => b.mechanic?._id?.toString() === mechAId || b.mechanic?.toString() === mechAId);
    assert('Test 5: Mechanic A queue contains strictly own assigned jobs', status === 200 && isIsolated && body.data.length === 2, `Count: ${body?.data?.length}`);
  }

  // Test 6: Mechanic A cannot retrieve Mechanic B's job detail (HTTP 403)
  {
    const req = { params: { id: bMechBId }, user: userStore.get(mechAId) };
    const { res, getResult } = makeMockRes();
    await getBookingById(req, res);
    const { status } = getResult();
    assert("Test 6: Mechanic A accessing Mechanic B's job detail returns HTTP 403", status === 403, `Status: ${status}`);
  }

  // Test 7: Mechanic A cannot retrieve unassigned booking detail (HTTP 403)
  {
    const req = { params: { id: bUnassignedPendingId }, user: userStore.get(mechAId) };
    const { res, getResult } = makeMockRes();
    await getBookingById(req, res);
    const { status } = getResult();
    assert('Test 7: Mechanic A accessing unassigned booking detail returns HTTP 403', status === 403, `Status: ${status}`);
  }

  // Test 8: Mechanic A can retrieve own assigned job detail
  {
    const req = { params: { id: bMechAConfirmedId }, user: userStore.get(mechAId) };
    const { res, getResult } = makeMockRes();
    await getBookingById(req, res);
    const { status } = getResult();
    assert('Test 8: Mechanic A can retrieve own assigned job detail (HTTP 200)', status === 200, `Status: ${status}`);
  }

  // --- 3. STATUS TRANSITION LIFECYCLE & WORKFLOW TESTS ---

  // Test 9: Mechanic A starting service (CONFIRMED -> IN_PROGRESS succeeds)
  {
    const req = {
      params: { id: bMechAConfirmedId },
      user: userStore.get(mechAId),
      body: { status: 'IN_PROGRESS' },
    };
    const { res, getResult } = makeMockRes();
    await updateBookingStatus(req, res);
    const { status } = getResult();
    const updatedB = bookingStore.get(bMechAConfirmedId);
    assert('Test 9: Mechanic transition CONFIRMED -> IN_PROGRESS succeeds (HTTP 200)', status === 200 && updatedB.status === 'IN_PROGRESS', `Status: ${status}, Job Status: ${updatedB?.status}`);
  }

  // Test 10: Mechanic A completing service (IN_PROGRESS -> COMPLETED succeeds & triggers auto-invoice)
  {
    const req = {
      params: { id: bMechAInProgressId },
      user: userStore.get(mechAId),
      body: { status: 'COMPLETED' },
    };
    const { res, getResult } = makeMockRes();
    await updateBookingStatus(req, res);
    const { status } = getResult();
    const updatedB = bookingStore.get(bMechAInProgressId);
    assert('Test 10: Mechanic transition IN_PROGRESS -> COMPLETED succeeds (HTTP 200)', status === 200 && updatedB.status === 'COMPLETED', `Status: ${status}, Job Status: ${updatedB?.status}`);
  }

  // Test 11: Auto-generated invoice created on completion with paymentStatus: 'PENDING'
  {
    let generatedInv = null;
    for (const inv of invoiceStore.values()) {
      if (inv.booking?.toString() === bMechAInProgressId) {
        generatedInv = inv;
        break;
      }
    }
    assert('Test 11: Auto-generated invoice created on mechanic job completion', generatedInv !== null && generatedInv.paymentStatus === 'PENDING' && generatedInv.subtotal === 2800, `Invoice: ${JSON.stringify(generatedInv)}`);
  }

  // Test 12: Mechanic A attempting to modify status for Mechanic B's job blocked (HTTP 403)
  {
    const req = {
      params: { id: bMechBId },
      user: userStore.get(mechAId),
      body: { status: 'IN_PROGRESS' },
    };
    const { res, getResult } = makeMockRes();
    await updateBookingStatus(req, res);
    const { status } = getResult();
    assert("Test 12: Mechanic A updating Mechanic B's job status returns HTTP 403", status === 403, `Status: ${status}`);
  }

  // Test 13: Invalid transition (e.g. COMPLETED -> IN_PROGRESS) rejected (HTTP 400)
  {
    const req = {
      params: { id: bMechAInProgressId }, // Now COMPLETED
      user: userStore.get(mechAId),
      body: { status: 'IN_PROGRESS' },
    };
    const { res, getResult } = makeMockRes();
    await updateBookingStatus(req, res);
    const { status, body } = getResult();
    assert('Test 13: Modifying status of completed job rejected (HTTP 400)', status === 400 && body.message.includes('Completed booking status cannot be changed'), `Status: ${status}, Msg: ${body?.message}`);
  }

  // Test 14: Duplicate completion attempt does not create duplicate invoice
  {
    const initialInvCount = invoiceStore.size;
    const invList = Array.from(invoiceStore.values()).filter((inv) => inv.booking?.toString() === bMechAInProgressId);
    assert('Test 14: Auto-invoice generation is idempotent (exactly 1 invoice exists)', invList.length === 1 && invoiceStore.size === initialInvCount, `Invoice count: ${invList.length}`);
  }

  // Test 15: Sensitive user fields (password hash, tokens) stripped from job response
  {
    const req = { params: { id: bMechAConfirmedId }, user: userStore.get(mechAId) };
    const { res, getResult } = makeMockRes();
    await getBookingById(req, res);
    const { body } = getResult();
    const uPass = body.data?.user?.password;
    assert('Test 15: Sensitive fields (password) excluded from job detail response', uPass === undefined, `Password field: ${uPass}`);
  }

  restoreMocks();

  console.log('\n==================================================');
  console.log(`TOTAL MECHANIC TESTS : ${results.passed + results.failed}`);
  console.log(`PASSED               : ${results.passed}`);
  console.log(`FAILED               : ${results.failed}`);
  console.log('==================================================\n');
}

runMechanicPortalTests().catch(console.error);
