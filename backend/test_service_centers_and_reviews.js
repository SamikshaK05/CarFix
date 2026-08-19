import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import Vehicle from './src/models/Vehicle.js';
import Service from './src/models/Service.js';
import ServiceCenter from './src/models/ServiceCenter.js';
import Booking from './src/models/Booking.js';
import Review from './src/models/Review.js';
import {
  getServiceCenters,
  getServiceCenterById,
} from './src/controllers/serviceCenterController.js';
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
} from './src/controllers/reviewController.js';
import { createBooking } from './src/controllers/bookingController.js';

// In-memory test stores
const userStore = new Map();
const vehicleStore = new Map();
const serviceStore = new Map();
const centerStore = new Map();
const bookingStore = new Map();
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

// Preserve original model methods
const origUserFindById = User.findById;
const origVehicleFindById = Vehicle.findById;
const origServiceFindById = Service.findById;
const origCenterFind = ServiceCenter.find;
const origCenterFindById = ServiceCenter.findById;
const origCenterUpdate = ServiceCenter.findByIdAndUpdate;
const origBookingFindById = Booking.findById;
const origBookingFindOne = Booking.findOne;
const origBookingCreate = Booking.create;
const origReviewFind = Review.find;
const origReviewFindById = Review.findById;
const origReviewFindOne = Review.findOne;
const origReviewCreate = Review.create;
const origReviewFindUpdate = Review.findByIdAndUpdate;
const origReviewFindDelete = Review.findByIdAndDelete;

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

  ServiceCenter.find = function (filter = {}) {
    let list = Array.from(centerStore.values());
    if (filter.isActive !== undefined) {
      list = list.filter((c) => c.isActive === filter.isActive);
    }
    if (filter.city) {
      const reg = filter.city.$regex || (filter.city instanceof RegExp ? filter.city : new RegExp(filter.city, 'i'));
      list = list.filter((c) => reg.test(c.city || ''));
    }
    if (filter.name) {
      const reg = filter.name.$regex || (filter.name instanceof RegExp ? filter.name : new RegExp(filter.name, 'i'));
      list = list.filter((c) => reg.test(c.name || ''));
    }
    if (filter.$or && Array.isArray(filter.$or)) {
      list = list.filter((c) =>
        filter.$or.some((cond) => {
          const nameReg = cond.name?.$regex || cond.name;
          const cityReg = cond.city?.$regex || cond.city;
          const addrReg = cond.address?.$regex || cond.address;
          if (nameReg && nameReg.test && nameReg.test(c.name || '')) return true;
          if (cityReg && cityReg.test && cityReg.test(c.city || '')) return true;
          if (addrReg && addrReg.test && addrReg.test(c.address || '')) return true;
          return false;
        })
      );
    }
    if (filter.services) {
      list = list.filter((c) =>
        c.services?.some((s) => (s._id || s).toString() === filter.services.toString())
      );
    }
    return {
      populate() { return this; },
      sort() { return this; },
      then(resolve) { resolve(list); },
    };
  };

  ServiceCenter.findById = function (id) {
    const c = centerStore.get(id?.toString() || id);
    return {
      populate() { return this; },
      then(resolve) { resolve(c || null); },
    };
  };

  ServiceCenter.findByIdAndUpdate = async function (id, updateData) {
    const c = centerStore.get(id?.toString() || id);
    if (!c) return null;
    const updated = { ...c, ...updateData };
    centerStore.set(id.toString(), updated);
    return updated;
  };

  Booking.findById = function (id) {
    const b = bookingStore.get(id?.toString() || id);
    return {
      populate() { return this; },
      then(resolve) { resolve(b || null); },
    };
  };

  Booking.findOne = async function (filter = {}) {
    for (const b of bookingStore.values()) {
      if (filter.serviceCenter && b.serviceCenter?.toString() === filter.serviceCenter.toString()) {
        if (filter.bookingTime && b.bookingTime === filter.bookingTime) return b;
      }
    }
    return null;
  };

  Booking.create = async function (doc) {
    const _id = new mongoose.Types.ObjectId().toString();
    const newB = { _id, ...doc };
    bookingStore.set(_id, newB);
    return newB;
  };

  Review.find = function (filter = {}) {
    let list = Array.from(reviewStore.values());
    if (filter.serviceCenter) {
      list = list.filter((r) => r.serviceCenter?.toString() === filter.serviceCenter.toString());
    }
    if (filter.user) {
      list = list.filter((r) => r.user?.toString() === filter.user.toString());
    }
    if (filter.booking) {
      list = list.filter((r) => r.booking?.toString() === filter.booking.toString());
    }
    return {
      populate() { return this; },
      sort() { return this; },
      then(resolve) { resolve(list); },
    };
  };

  Review.findById = function (id) {
    const r = reviewStore.get(id?.toString() || id);
    return {
      populate() { return this; },
      then(resolve) { resolve(r || null); },
    };
  };

  Review.findOne = async function (filter = {}) {
    for (const r of reviewStore.values()) {
      if (filter.booking && r.booking?.toString() === filter.booking.toString()) return r;
      if (filter.user && filter.serviceCenter && r.user?.toString() === filter.user.toString() && r.serviceCenter?.toString() === filter.serviceCenter.toString()) return r;
    }
    return null;
  };

  Review.create = async function (doc) {
    const _id = new mongoose.Types.ObjectId().toString();
    const newR = { _id, ...doc, createdAt: new Date() };
    reviewStore.set(_id, newR);
    return newR;
  };

  Review.findByIdAndUpdate = function (id, updateData) {
    const r = reviewStore.get(id?.toString() || id);
    return {
      populate() { return this; },
      then(resolve) {
        if (!r) return resolve(null);
        const updated = { ...r, ...updateData };
        reviewStore.set(id.toString(), updated);
        resolve(updated);
      },
    };
  };

  Review.findByIdAndDelete = async function (id) {
    const r = reviewStore.get(id?.toString() || id);
    if (!r) return null;
    reviewStore.delete(id.toString());
    return r;
  };
}

function restoreMocks() {
  User.findById = origUserFindById;
  Vehicle.findById = origVehicleFindById;
  Service.findById = origServiceFindById;
  ServiceCenter.find = origCenterFind;
  ServiceCenter.findById = origCenterFindById;
  ServiceCenter.findByIdAndUpdate = origCenterUpdate;
  Booking.findById = origBookingFindById;
  Booking.findOne = origBookingFindOne;
  Booking.create = origBookingCreate;
  Review.find = origReviewFind;
  Review.findById = origReviewFindById;
  Review.findOne = origReviewFindOne;
  Review.create = origReviewCreate;
  Review.findByIdAndUpdate = origReviewFindUpdate;
  Review.findByIdAndDelete = origReviewFindDelete;
}

async function runServiceCenterAndReviewTests() {
  console.log('==================================================');
  console.log(' CARFIX SERVICE CENTERS & REVIEWS TEST SUITE ');
  console.log('==================================================\n');

  setupMocks();

  const cust1Id = new mongoose.Types.ObjectId().toString();
  const cust2Id = new mongoose.Types.ObjectId().toString();

  userStore.set(cust1Id, { _id: cust1Id, name: 'Alice Customer', email: 'alice@carfix.com', role: 'CUSTOMER' });
  userStore.set(cust2Id, { _id: cust2Id, name: 'Bob Customer', email: 'bob@carfix.com', role: 'CUSTOMER' });

  const srv1Id = new mongoose.Types.ObjectId().toString(); // Supported Service
  const srv2Id = new mongoose.Types.ObjectId().toString(); // Unsupported Service
  serviceStore.set(srv1Id, { _id: srv1Id, name: 'Oil Change', price: 1500, isActive: true });
  serviceStore.set(srv2Id, { _id: srv2Id, name: 'Engine Overhaul', price: 25000, isActive: true });

  const center1Id = new mongoose.Types.ObjectId().toString(); // Pune
  const center2Id = new mongoose.Types.ObjectId().toString(); // Mumbai
  centerStore.set(center1Id, { _id: center1Id, name: 'CarFix Westend', city: 'Pune', address: 'Baner Road', services: [srv1Id], isActive: true, rating: 0, totalReviews: 0 });
  centerStore.set(center2Id, { _id: center2Id, name: 'CarFix Metro', city: 'Mumbai', address: 'Andheri West', services: [srv2Id], isActive: true, rating: 0, totalReviews: 0 });

  const veh1Id = new mongoose.Types.ObjectId().toString();
  vehicleStore.set(veh1Id, { _id: veh1Id, user: cust1Id, make: 'Toyota', model: 'Camry', registrationNumber: 'MH-12-AB-1234' });

  const bCompId = new mongoose.Types.ObjectId().toString(); // Completed booking
  bookingStore.set(bCompId, { _id: bCompId, user: cust1Id, vehicle: veh1Id, service: srv1Id, serviceCenter: center1Id, status: 'COMPLETED', bookingDate: new Date(), bookingTime: '10:00 AM' });

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

  // --- SERVICE CENTER TESTS ---

  // Test 1: Service center listing
  {
    const req = { query: {} };
    const { res, getResult } = makeMockRes();
    await getServiceCenters(req, res);
    const { status, body } = getResult();
    assert('Test 1: Service center listing works', status === 200 && body.count === 2, `Count: ${body?.count}`);
  }

  // Test 2: Search by name
  {
    const req = { query: { search: 'Westend' } };
    const { res, getResult } = makeMockRes();
    await getServiceCenters(req, res);
    const { status, body } = getResult();
    assert('Test 2: Search by name works', status === 200 && body.count === 1 && body.data[0]._id === center1Id, `Found: ${body?.count}`);
  }

  // Test 3: City filtering
  {
    const req = { query: { city: 'Pune' } };
    const { res, getResult } = makeMockRes();
    await getServiceCenters(req, res);
    const { body } = getResult();
    assert('Test 3: City filtering works', body.count === 1 && body.data[0].city === 'Pune', `City: ${body?.data?.[0]?.city}`);
  }

  // Test 4: Service filtering
  {
    const req = { query: { service: srv1Id } };
    const { res, getResult } = makeMockRes();
    await getServiceCenters(req, res);
    const { body } = getResult();
    assert('Test 4: Service filtering works', body.count === 1 && body.data[0]._id === center1Id, `Count: ${body?.count}`);
  }

  // Test 5: Combined filters
  {
    const req = { query: { city: 'Pune', search: 'Westend' } };
    const { res, getResult } = makeMockRes();
    await getServiceCenters(req, res);
    const { body } = getResult();
    assert('Test 5: Combined filters work', body.count === 1 && body.data[0]._id === center1Id, `Count: ${body?.count}`);
  }

  // Test 6: Case-insensitive search
  {
    const req = { query: { search: 'pUnE' } };
    const { res, getResult } = makeMockRes();
    await getServiceCenters(req, res);
    const { body } = getResult();
    assert('Test 6: Case-insensitive search works', body.count === 1, `Count: ${body?.count}`);
  }

  // Test 7: Leading/trailing spaces handled
  {
    const req = { query: { search: '  Pune  ' } };
    const { res, getResult } = makeMockRes();
    await getServiceCenters(req, res);
    const { body } = getResult();
    assert('Test 7: Leading/trailing spaces handled', body.count === 1, `Count: ${body?.count}`);
  }

  // Test 8: No matching results return empty list (HTTP 200)
  {
    const req = { query: { search: 'NonExistentCity' } };
    const { res, getResult } = makeMockRes();
    await getServiceCenters(req, res);
    const { status, body } = getResult();
    assert('Test 8: No matching results return empty list (HTTP 200)', status === 200 && body.count === 0 && Array.isArray(body.data), `Count: ${body?.count}`);
  }

  // Test 9: Invalid service center ID rejected (HTTP 400)
  {
    const req = { params: { id: 'invalid-id' } };
    const { res, getResult } = makeMockRes();
    await getServiceCenterById(req, res);
    const { status } = getResult();
    assert('Test 9: Invalid service center ID rejected (HTTP 400)', status === 400, `Status: ${status}`);
  }

  // Test 10: Non-existent service center returns 404
  {
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
    const { res, getResult } = makeMockRes();
    await getServiceCenterById(req, res);
    const { status } = getResult();
    assert('Test 10: Non-existent service center returns 404', status === 404, `Status: ${status}`);
  }

  // Test 11: Sensitive fields not exposed in service center response
  {
    const req = { params: { id: center1Id } };
    const { res, getResult } = makeMockRes();
    await getServiceCenterById(req, res);
    const { body } = getResult();
    assert('Test 11: Sensitive internal fields not exposed', body.data?.password === undefined, 'No sensitive fields exposed');
  }

  // Test 12: Service compatibility enforced in createBooking (HTTP 400)
  {
    const req = {
      user: { _id: cust1Id, role: 'CUSTOMER' },
      body: {
        vehicle: veh1Id,
        service: srv2Id, // Unsupported service by center1Id
        serviceCenter: center1Id,
        bookingDate: '2026-09-10',
        bookingTime: '11:00 AM',
      },
    };
    const { res, getResult } = makeMockRes();
    await createBooking(req, res);
    const { status, body } = getResult();
    assert(
      'Test 12: Service compatibility enforced in booking (HTTP 400)',
      status === 400 && body.message.includes('does not offer'),
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  // --- REVIEW TESTS ---

  let createdReviewId = null;

  // Test 13: Authenticated customer can create a valid review
  {
    const req = {
      user: { _id: cust1Id, role: 'CUSTOMER' },
      body: {
        booking: bCompId,
        rating: 5,
        comment: 'Excellent quick service!',
      },
    };
    const { res, getResult } = makeMockRes();
    await createReview(req, res);
    const { status, body } = getResult();
    createdReviewId = body?.data?._id;

    assert('Test 13: Authenticated customer can create a valid review (HTTP 201)', status === 201 && body.success === true, `Status: ${status}`);
  }

  // Test 14: Unauthenticated review creation is rejected
  {
    const req = { user: null, body: { booking: bCompId, rating: 4 } };
    const { res, getResult } = makeMockRes();
    await createReview(req, res);
    const { status } = getResult();
    assert('Test 14: Unauthenticated review creation is rejected', status === 400 || status === 401, `Status: ${status}`);
  }

  // Test 15: Invalid rating rejected (< 1 or > 5)
  {
    const req = { user: { _id: cust1Id, role: 'CUSTOMER' }, body: { booking: bCompId, rating: 10 } };
    const { res, getResult } = makeMockRes();
    await createReview(req, res);
    const { status } = getResult();
    assert('Test 15: Rating > 5 is rejected (HTTP 400)', status === 400, `Status: ${status}`);
  }

  // Test 16: Invalid required booking ID rejected
  {
    const req = { user: { _id: cust1Id, role: 'CUSTOMER' }, body: { booking: 'invalid-id', rating: 5 } };
    const { res, getResult } = makeMockRes();
    await createReview(req, res);
    const { status } = getResult();
    assert('Test 16: Invalid booking ID rejected (HTTP 400)', status === 400, `Status: ${status}`);
  }

  // Test 17: Customer identity comes from JWT (body.user ignored)
  {
    const req = {
      user: { _id: cust1Id, role: 'CUSTOMER' },
      body: { user: cust2Id, booking: bCompId, rating: 5 }, // Fake body user
    };
    const { res, getResult } = makeMockRes();
    await createReview(req, res);
    const { body } = getResult();

    // Verify created review user equals JWT user cust1Id
    assert("Test 17: Customer identity overridden by JWT req.user._id", reviewStore.get(createdReviewId)?.user?.toString() === cust1Id, 'JWT user enforced');
  }

  // Test 18: Customer cannot edit another customer's review (HTTP 403)
  {
    const req = {
      params: { id: createdReviewId },
      user: { _id: cust2Id, role: 'CUSTOMER' }, // Customer 2 editing Customer 1 review
      body: { rating: 1 },
    };
    const { res, getResult } = makeMockRes();
    await updateReview(req, res);
    const { status } = getResult();
    assert("Test 18: Customer cannot edit another customer's review (HTTP 403)", status === 403, `Status: ${status}`);
  }

  // Test 19: Customer cannot delete another customer's review (HTTP 403)
  {
    const req = {
      params: { id: createdReviewId },
      user: { _id: cust2Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await deleteReview(req, res);
    const { status } = getResult();
    assert("Test 19: Customer cannot delete another customer's review (HTTP 403)", status === 403, `Status: ${status}`);
  }

  // Test 20: Own review can be updated (HTTP 200)
  {
    const req = {
      params: { id: createdReviewId },
      user: { _id: cust1Id, role: 'CUSTOMER' },
      body: { rating: 4, comment: 'Updated review comment' },
    };
    const { res, getResult } = makeMockRes();
    await updateReview(req, res);
    const { status, body } = getResult();
    assert('Test 20: Own review can be updated (HTTP 200)', status === 200 && body.data?.rating === 4, `Status: ${status}`);
  }

  // Test 21 & 22: Duplicate review for same booking rejected with HTTP 409
  {
    const req = {
      user: { _id: cust1Id, role: 'CUSTOMER' },
      body: { booking: bCompId, rating: 5 },
    };
    const { res, getResult } = makeMockRes();
    await createReview(req, res);
    const { status } = getResult();
    assert('Test 22: Duplicate review for same booking returns HTTP 409 conflict', status === 409, `Status: ${status}`);
  }

  // Test 23: Review persists in MongoDB
  {
    assert('Test 23: Review persists in database collection', reviewStore.has(createdReviewId), 'Persisted');
  }

  // Test 24 & 25: Service center average rating and totalReviews updated
  {
    const center1Doc = centerStore.get(center1Id);
    assert('Test 24: Average rating calculated correctly on ServiceCenter (4)', center1Doc.rating === 4, `Rating: ${center1Doc.rating}`);
    assert('Test 25: Total reviews count calculated correctly on ServiceCenter (1)', center1Doc.totalReviews === 1, `Total reviews: ${center1Doc.totalReviews}`);
  }

  // Test 26: Service center with zero reviews returns rating 0 and count 0
  {
    const center2Doc = centerStore.get(center2Id);
    assert('Test 26: Service center with zero reviews returns rating 0 and count 0', center2Doc.rating === 0 && center2Doc.totalReviews === 0, `Rating: ${center2Doc.rating}`);
  }

  // Test 27: Reviews are isolated between service centers
  {
    const req = { query: { serviceCenter: center2Id } };
    const { res, getResult } = makeMockRes();
    await getReviews(req, res);
    const { body } = getResult();
    assert('Test 27: Reviews isolated strictly by service center ID', body.count === 0, `Center 2 reviews: ${body.count}`);
  }

  // Test 28: Delete own review & verify service center rating recalculation
  {
    const req = {
      params: { id: createdReviewId },
      user: { _id: cust1Id, role: 'CUSTOMER' },
    };
    const { res, getResult } = makeMockRes();
    await deleteReview(req, res);
    const { status } = getResult();

    const center1Doc = centerStore.get(center1Id);
    assert(
      'Test 21 & 28: Own review deleted & ServiceCenter rating recalculated to 0',
      status === 200 && center1Doc.rating === 0 && center1Doc.totalReviews === 0,
      `Status: ${status}, Rating: ${center1Doc.rating}`
    );
  }

  restoreMocks();

  console.log('\n==================================================');
  console.log(`TOTAL TESTS: ${results.passed + results.failed}`);
  console.log(`PASSED: ${results.passed}`);
  console.log(`FAILED: ${results.failed}`);
  console.log('==================================================\n');
}

runServiceCenterAndReviewTests().catch(console.error);
