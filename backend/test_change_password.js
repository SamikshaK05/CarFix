import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import { changePassword, login } from './src/controllers/authController.js';

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

const originalFindById = User.findById;

function setupUserMocks() {
  User.findById = async function (id) {
    return userDatabase.get(id) || null;
  };
}

function restoreUserMocks() {
  User.findById = originalFindById;
}

async function createTestUser(email, plainPassword) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  const userId = 'user_' + Math.random().toString(36).substr(2, 9);

  const userDoc = {
    _id: userId,
    name: 'Authenticated User',
    email: email.toLowerCase(),
    phone: '9876543210',
    password: hashedPassword,
    role: 'CUSTOMER',
    isActive: true,
    async save() {
      userDatabase.set(this._id, this);
      return this;
    },
  };

  userDatabase.set(userId, userDoc);
  return userDoc;
}

async function runChangePasswordTests() {
  console.log('==================================================');
  console.log('    CARFIX CHANGE PASSWORD AUTOMATED TEST SUITE   ');
  console.log('==================================================\n');

  setupUserMocks();

  const registeredEmail = 'auth.user@carfix.com';
  const oldPassword = 'OldPassword123!';
  const newPassword = 'NewPassword456!';

  const testUser = await createTestUser(registeredEmail, oldPassword);

  // Test 1: Incorrect current password
  {
    const { req, res, getResult } = makeReqRes({ currentPassword: 'WrongPassword123!', newPassword }, { _id: testUser._id });
    await changePassword(req, res);
    const { status, body } = getResult();
    console.log(status === 400 && body.message === 'Current password is incorrect' ? '[PASS] Test 1: Incorrect current password rejected' : '[FAIL] Test 1');
  }

  // Test 2: Weak new password
  {
    const { req, res, getResult } = makeReqRes({ currentPassword: oldPassword, newPassword: 'weak' }, { _id: testUser._id });
    await changePassword(req, res);
    const { status, body } = getResult();
    console.log(status === 400 && body.success === false ? '[PASS] Test 2: Weak new password rejected' : '[FAIL] Test 2');
  }

  // Test 3: New password same as current password
  {
    const { req, res, getResult } = makeReqRes({ currentPassword: oldPassword, newPassword: oldPassword }, { _id: testUser._id });
    await changePassword(req, res);
    const { status, body } = getResult();
    console.log(status === 400 && body.message === 'New password must be different from current password' ? '[PASS] Test 3: Same password rejected' : '[FAIL] Test 3');
  }

  // Test 4: Valid password change
  {
    const { req, res, getResult } = makeReqRes({ currentPassword: oldPassword, newPassword }, { _id: testUser._id });
    await changePassword(req, res);
    const { status, body } = getResult();
    console.log(status === 200 && body.success === true && body.message === 'Password updated successfully' ? '[PASS] Test 4: Valid password change successful' : '[FAIL] Test 4');
  }

  // Test 5: Verify login works with new password
  {
    const { req, res, getResult } = makeReqRes({ email: registeredEmail, password: newPassword });
    // Restore findOne for login
    User.findOne = async () => userDatabase.get(testUser._id);
    await login(req, res);
    const { status, body } = getResult();
    console.log(status === 200 && body.success === true && body.data?.token ? '[PASS] Test 5: Login works with new password' : '[FAIL] Test 5');
  }

  restoreUserMocks();
  console.log('\n==================================================\n');
}

runChangePasswordTests().catch(console.error);
