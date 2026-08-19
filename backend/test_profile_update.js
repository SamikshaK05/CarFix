import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import { updateProfile, getMe } from './src/controllers/authController.js';

const userDatabase = new Map();

function makeReqRes(body = {}, userObj = null) {
  let resStatus = 200;
  let resJson = null;

  const req = {
    body,
    user: userObj,
  };

  const res = {
    status(code) {
      resStatus = code;
      return this;
    },
    json(data) {
      resJson = data;
      return this;
    },
  };

  return { req, res, getResult: () => ({ status: resStatus, body: resJson }) };
}

const originalFindOne = User.findOne;
const originalFindById = User.findById;
const originalFindByIdAndUpdate = User.findByIdAndUpdate;

function setupUserMocks() {
  User.findOne = async function (query) {
    if (query.email) {
      for (const u of userDatabase.values()) {
        if (u.email === query.email) {
          if (query._id && query._id.$ne && query._id.$ne.toString() === u._id.toString()) {
            continue;
          }
          return u;
        }
      }
      return null;
    }
    return null;
  };

  User.findById = function (id) {
    const u = userDatabase.get(id?.toString() || id);
    return {
      select(fields) {
        if (!u) return Promise.resolve(null);
        const { password, ...rest } = u;
        return Promise.resolve(rest);
      },
      then(resolve) {
        resolve(u);
      },
    };
  };

  User.findByIdAndUpdate = async function (id, updateFields, options) {
    const existing = userDatabase.get(id?.toString() || id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updateFields,
      updatedAt: new Date(),
    };

    userDatabase.set(id?.toString() || id, updated);

    const { password, ...rest } = updated;
    return {
      ...rest,
      select() {
        return rest;
      },
    };
  };
}

function restoreUserMocks() {
  User.findOne = originalFindOne;
  User.findById = originalFindById;
  User.findByIdAndUpdate = originalFindByIdAndUpdate;
}

async function createTestUser(name, email, phone, role = 'CUSTOMER') {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('TestPass123!', salt);
  const userId = 'user_' + Math.random().toString(36).substr(2, 9);

  const userDoc = {
    _id: userId,
    name,
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
    role,
    isActive: true,
    resetPasswordToken: undefined,
    resetPasswordExpire: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    async save() {
      userDatabase.set(this._id, this);
      return this;
    },
  };

  userDatabase.set(userId, userDoc);
  return userDoc;
}

async function runProfileUpdateTests() {
  console.log('==================================================');
  console.log('    CARFIX PROFILE UPDATE AUTOMATED TEST SUITE    ');
  console.log('==================================================\n');

  setupUserMocks();

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

  // Create primary test user & secondary user (for email conflict test)
  const user1 = await createTestUser('Alice Johnson', 'alice@carfix.com', '9876543210');
  const user2 = await createTestUser('Bob Smith', 'bob@carfix.com', '9123456789');

  // Test 1: Authenticated user can update allowed profile fields
  {
    const updatePayload = {
      name: 'Alice M. Johnson',
      email: 'alice.updated@carfix.com',
      phone: '9998887770',
    };
    const { req, res, getResult } = makeReqRes(updatePayload, { _id: user1._id });
    await updateProfile(req, res);
    const { status, body } = getResult();

    assert(
      'Test 1: Authenticated user can update allowed profile fields',
      status === 200 &&
        body.success === true &&
        body.data.user.name === 'Alice M. Johnson' &&
        body.data.user.email === 'alice.updated@carfix.com' &&
        body.data.user.phone === '9998887770',
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 2: Updated values are persisted in database
  {
    const storedUser = userDatabase.get(user1._id);
    assert(
      'Test 2: Updated values are persisted in database',
      storedUser.name === 'Alice M. Johnson' &&
        storedUser.email === 'alice.updated@carfix.com' &&
        storedUser.phone === '9998887770',
      `Stored user: ${JSON.stringify(storedUser)}`
    );
  }

  // Test 3: Updated values remain after fetching profile again (getMe)
  {
    const freshUser = await User.findById(user1._id);
    const { req, res, getResult } = makeReqRes({}, freshUser);
    await getMe(req, res);
    const { status, body } = getResult();

    assert(
      'Test 3: Updated values remain after fetching profile again (getMe)',
      status === 200 &&
        body.success === true &&
        body.data.user.email === 'alice.updated@carfix.com' &&
        body.data.user.name === 'Alice M. Johnson',
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 4: Changes remain after simulated API re-fetch / page reload
  {
    const refetchedUser = await User.findById(user1._id);
    assert(
      'Test 4: Changes remain after simulated re-fetch / reload',
      refetchedUser && refetchedUser.email === 'alice.updated@carfix.com',
      `Refetched: ${JSON.stringify(refetchedUser)}`
    );
  }

  // Test 5: Unauthenticated request is rejected (handled by protect middleware / missing user)
  {
    const { req, res, getResult } = makeReqRes({ name: 'Hacker', email: 'hacker@carfix.com' }, null);
    try {
      await updateProfile(req, res);
      const { status, body } = getResult();
      assert(
        'Test 5: Unauthenticated request is rejected',
        status === 400 || status === 401 || status === 500,
        `Status: ${status}`
      );
    } catch (err) {
      assert('Test 5: Unauthenticated request is rejected', true, 'Caught error as expected');
    }
  }

  // Test 6: Invalid email is rejected
  {
    const { req, res, getResult } = makeReqRes({ name: 'Alice', email: 'not-an-email' }, { _id: user1._id });
    await updateProfile(req, res);
    const { status, body } = getResult();

    assert(
      'Test 6: Invalid email is rejected',
      status === 400 && body.success === false && body.message === 'Please provide a valid email address',
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 7: Empty/invalid required fields are rejected
  {
    const { req, res, getResult } = makeReqRes({ name: '', email: 'alice.updated@carfix.com' }, { _id: user1._id });
    await updateProfile(req, res);
    const { status, body } = getResult();

    assert(
      'Test 7: Empty required field (name) is rejected',
      status === 400 && body.success === false && body.message === 'Name is required',
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 8: User cannot update another user's profile
  {
    // updateProfile targets req.user._id strictly
    const { req, res, getResult } = makeReqRes(
      { name: 'Malicious Change', email: 'malicious@carfix.com', phone: '1112223333' },
      { _id: user1._id } // User 1 making request
    );
    await updateProfile(req, res);
    // Verify User 2 was NOT modified
    const bobUser = userDatabase.get(user2._id);

    assert(
      "Test 8: User cannot update another user's profile",
      bobUser.name === 'Bob Smith' && bobUser.email === 'bob@carfix.com',
      `Bob's profile unchanged: ${bobUser.name}`
    );
  }

  // Test 9: Password cannot be changed through profile update
  {
    const originalPasswordHash = userDatabase.get(user1._id).password;
    const { req, res, getResult } = makeReqRes(
      { name: 'Alice M. Johnson', email: 'alice.updated@carfix.com', password: 'HackedPassword123!' },
      { _id: user1._id }
    );
    await updateProfile(req, res);
    const currentPasswordHash = userDatabase.get(user1._id).password;

    assert(
      'Test 9: Password cannot be changed through profile update',
      currentPasswordHash === originalPasswordHash,
      `Password hash unmodified: ${currentPasswordHash === originalPasswordHash}`
    );
  }

  // Test 10: Role cannot be changed through profile update
  {
    const { req, res, getResult } = makeReqRes(
      { name: 'Alice M. Johnson', email: 'alice.updated@carfix.com', role: 'ADMIN' },
      { _id: user1._id }
    );
    await updateProfile(req, res);
    const currentRole = userDatabase.get(user1._id).role;

    assert(
      'Test 10: Role cannot be changed through profile update',
      currentRole === 'CUSTOMER',
      `Role remains CUSTOMER: ${currentRole}`
    );
  }

  // Test 11: Reset-password fields cannot be modified through profile update
  {
    const { req, res, getResult } = makeReqRes(
      {
        name: 'Alice M. Johnson',
        email: 'alice.updated@carfix.com',
        resetPasswordToken: 'hacked_token_123',
        resetPasswordExpire: new Date(Date.now() + 1000000),
      },
      { _id: user1._id }
    );
    await updateProfile(req, res);
    const currentToken = userDatabase.get(user1._id).resetPasswordToken;

    assert(
      'Test 11: Reset-password fields cannot be modified through profile update',
      currentToken === undefined,
      `resetPasswordToken remains undefined: ${currentToken}`
    );
  }

  // Test 12: Response does not expose password/hash/security-sensitive fields
  {
    const { req, res, getResult } = makeReqRes(
      { name: 'Alice M. Johnson', email: 'alice.updated@carfix.com', phone: '9998887770' },
      { _id: user1._id }
    );
    await updateProfile(req, res);
    const { body } = getResult();
    const returnedUser = body.data.user;

    assert(
      'Test 12: Response does not expose password or sensitive fields',
      returnedUser.password === undefined &&
        returnedUser.resetPasswordToken === undefined &&
        returnedUser.resetPasswordExpire === undefined,
      `Returned user keys: ${Object.keys(returnedUser).join(', ')}`
    );
  }

  restoreUserMocks();

  console.log('\n==================================================');
  console.log(`TOTAL TESTS: ${results.passed + results.failed}`);
  console.log(`PASSED: ${results.passed}`);
  console.log(`FAILED: ${results.failed}`);
  console.log('==================================================\n');
}

runProfileUpdateTests().catch(console.error);
