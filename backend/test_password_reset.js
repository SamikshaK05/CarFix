import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

import User from './src/models/User.js';
import { forgotPassword, resetPassword, login } from './src/controllers/authController.js';

// In-Memory User Store to simulate MongoDB User collection for testing
const userDatabase = new Map();

// Helper to wrap express req/res
function makeReqRes(body = {}, params = {}, headers = {}) {
  let resStatus = 200;
  let resJson = null;

  const req = {
    body,
    params,
    headers,
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

// Mock User model methods for unit testing controller behavior
const originalFindOne = User.findOne;
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

    if (query.resetPasswordToken) {
      for (const u of userDatabase.values()) {
        if (u.resetPasswordToken === query.resetPasswordToken) {
          if (query.resetPasswordExpire && query.resetPasswordExpire.$gt) {
            if (u.resetPasswordExpire && u.resetPasswordExpire.getTime() > query.resetPasswordExpire.$gt) {
              return u;
            }
            return null;
          }
          return u;
        }
      }
      return null;
    }

    return null;
  };
}

function restoreUserMocks() {
  User.findOne = originalFindOne;
  User.findByIdAndUpdate = originalFindByIdAndUpdate;
}

// Helper user creator for test store
async function createTestUser(email, plainPassword) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  const userId = 'user_' + Math.random().toString(36).substr(2, 9);

  const userDoc = {
    _id: userId,
    name: 'Test Customer',
    email: email.toLowerCase(),
    phone: '9876543210',
    password: hashedPassword,
    role: 'CUSTOMER',
    isActive: true,
    resetPasswordToken: undefined,
    resetPasswordExpire: undefined,
    async save() {
      userDatabase.set(this._id, this);
      return this;
    },
  };

  userDatabase.set(userId, userDoc);
  return userDoc;
}

async function runAllTests() {
  console.log('==================================================');
  console.log('     CARFIX PASSWORD RESET AUTOMATED TEST SUITE   ');
  console.log('==================================================\n');

  setupUserMocks();

  const results = {
    passed: [],
    failed: [],
  };

  function assert(testName, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      results.passed.push({ name: testName, details });
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      results.failed.push({ name: testName, details });
    }
  }

  // Seed test user
  const registeredEmail = 'registered.user@carfix.com';
  const unregisteredEmail = 'unregistered.user@carfix.com';
  const initialPassword = 'InitialPass123!';

  const userDoc = await createTestUser(registeredEmail, initialPassword);

  // Test 1: POST /api/auth/forgot-password with registered email
  {
    const { req, res, getResult } = makeReqRes({ email: registeredEmail });
    await forgotPassword(req, res);
    const { status, body } = getResult();
    assert(
      'Test 1: POST /api/auth/forgot-password with registered email',
      status === 200 && body.success === true,
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Obtain the generated rawToken & hashedToken for registered user
  const updatedUserDoc = userDatabase.get(userDoc._id);
  const storedHashedToken = updatedUserDoc.resetPasswordToken;

  assert(
    'Test 6: Generate or obtain valid reset token using local testing setup',
    !!storedHashedToken && updatedUserDoc.resetPasswordExpire > new Date(),
    `HashedToken stored: ${!!storedHashedToken}, Expiry: ${updatedUserDoc.resetPasswordExpire}`
  );

  // Test 2: POST /api/auth/forgot-password with unregistered email
  let unregisteredResponseMsg = '';
  {
    const { req, res, getResult } = makeReqRes({ email: unregisteredEmail });
    await forgotPassword(req, res);
    const { status, body } = getResult();
    unregisteredResponseMsg = body?.message;
    assert(
      'Test 2: POST /api/auth/forgot-password with unregistered email',
      status === 200 && body.success === true,
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 3: Invalid email format
  {
    const { req, res, getResult } = makeReqRes({ email: 'invalid-email-format' });
    await forgotPassword(req, res);
    const { status, body } = getResult();
    assert(
      'Test 3: Invalid email format',
      status === 400 || (status === 200 && body.success === true),
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 4: Missing email
  {
    const { req, res, getResult } = makeReqRes({ email: '' });
    await forgotPassword(req, res);
    const { status, body } = getResult();
    assert(
      'Test 4: Missing email',
      status === 400 && body.success === false,
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 5: Verify registered and unregistered emails return the same generic response
  {
    const { req: r1, res: res1, getResult: getRes1 } = makeReqRes({ email: registeredEmail });
    await forgotPassword(r1, res1);
    const regMsg = getRes1().body?.message;

    assert(
      'Test 5: Verify registered and unregistered emails return same generic response',
      regMsg === unregisteredResponseMsg && regMsg === 'If an account with that email exists, a password reset link has been sent.',
      `RegMsg: "${regMsg}" vs UnregMsg: "${unregisteredResponseMsg}"`
    );
  }

  // Set up valid token for reset password tests
  const testRawToken = crypto.randomBytes(32).toString('hex');
  const testHashedToken = crypto.createHash('sha256').update(testRawToken).digest('hex');
  updatedUserDoc.resetPasswordToken = testHashedToken;
  updatedUserDoc.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
  await updatedUserDoc.save();

  // Test 8: Password shorter than 8 characters
  {
    const { req, res, getResult } = makeReqRes({ token: testRawToken, password: 'Pass1' });
    await resetPassword(req, res);
    const { status, body } = getResult();
    assert(
      'Test 8: Password shorter than 8 characters',
      status === 400 && body.success === false,
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 9: Password without uppercase letter
  {
    const { req, res, getResult } = makeReqRes({ token: testRawToken, password: 'newpass123!' });
    await resetPassword(req, res);
    const { status, body } = getResult();
    assert(
      'Test 9: Password without uppercase letter',
      status === 400 && body.success === false,
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 10: Password without lowercase letter
  {
    const { req, res, getResult } = makeReqRes({ token: testRawToken, password: 'NEWPASS123!' });
    await resetPassword(req, res);
    const { status, body } = getResult();
    assert(
      'Test 10: Password without lowercase letter',
      status === 400 && body.success === false,
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 11: Password without number
  {
    const { req, res, getResult } = makeReqRes({ token: testRawToken, password: 'NewPassword!' });
    await resetPassword(req, res);
    const { status, body } = getResult();
    assert(
      'Test 11: Password without number',
      status === 400 && body.success === false,
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 12: Invalid token
  {
    const { req, res, getResult } = makeReqRes({ token: 'completely-invalid-token', password: 'ValidNewPass123!' });
    await resetPassword(req, res);
    const { status, body } = getResult();
    assert(
      'Test 12: Invalid token',
      status === 400 && body.success === false && body.message === 'Invalid or expired reset token',
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 13: Expired token
  {
    const expiredRawToken = crypto.randomBytes(32).toString('hex');
    const expiredHashedToken = crypto.createHash('sha256').update(expiredRawToken).digest('hex');
    updatedUserDoc.resetPasswordToken = expiredHashedToken;
    updatedUserDoc.resetPasswordExpire = new Date(Date.now() - 1000); // Expired 1 sec ago
    await updatedUserDoc.save();

    const { req, res, getResult } = makeReqRes({ token: expiredRawToken, password: 'ValidNewPass123!' });
    await resetPassword(req, res);
    const { status, body } = getResult();
    assert(
      'Test 13: Expired token',
      status === 400 && body.success === false && body.message === 'Invalid or expired reset token',
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Re-arm valid token for Test 7 (Valid reset)
  const validRawToken = crypto.randomBytes(32).toString('hex');
  const validHashedToken = crypto.createHash('sha256').update(validRawToken).digest('hex');
  updatedUserDoc.resetPasswordToken = validHashedToken;
  updatedUserDoc.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
  await updatedUserDoc.save();

  const newValidPassword = 'BrandNewPass123!';

  // Test 7: POST /api/auth/reset-password with a valid token
  {
    const { req, res, getResult } = makeReqRes({ token: validRawToken, password: newValidPassword });
    await resetPassword(req, res);
    const { status, body } = getResult();
    assert(
      'Test 7: POST /api/auth/reset-password with a valid token',
      status === 200 && body.success === true && body.message === 'Password reset successful',
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 14: Reuse a token after successful password reset
  {
    const { req, res, getResult } = makeReqRes({ token: validRawToken, password: 'AnotherNewPass123!' });
    await resetPassword(req, res);
    const { status, body } = getResult();
    assert(
      'Test 14: Reuse a token after successful password reset',
      status === 400 && body.success === false && body.message === 'Invalid or expired reset token',
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 15: Verify the reset token is cleared after successful reset
  {
    const userAfterReset = userDatabase.get(userDoc._id);
    assert(
      'Test 15: Verify the reset token is cleared after successful reset',
      userAfterReset.resetPasswordToken === undefined && userAfterReset.resetPasswordExpire === undefined,
      `Token: ${userAfterReset.resetPasswordToken}, Expire: ${userAfterReset.resetPasswordExpire}`
    );
  }

  // Test 16: Verify the new password works for login
  {
    const { req, res, getResult } = makeReqRes({ email: registeredEmail, password: newValidPassword });
    await login(req, res);
    const { status, body } = getResult();
    assert(
      'Test 16: Verify the new password works for login',
      status === 200 && body.success === true && body.data?.token,
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  // Test 17: Verify the old password no longer works
  {
    const { req, res, getResult } = makeReqRes({ email: registeredEmail, password: initialPassword });
    await login(req, res);
    const { status, body } = getResult();
    assert(
      'Test 17: Verify the old password no longer works',
      status === 401 && body.success === false && body.message === 'Invalid email or password',
      `Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }

  restoreUserMocks();

  console.log('\n==================================================');
  console.log(`TOTAL TESTS: ${results.passed.length + results.failed.length}`);
  console.log(`PASSED: ${results.passed.length}`);
  console.log(`FAILED: ${results.failed.length}`);
  console.log('==================================================');
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
});
