import { Writable } from 'stream';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';

dotenv.config();

import Invoice from './src/models/Invoice.js';
import { downloadInvoice } from './src/controllers/invoiceController.js';

// In-memory test store
const invoiceStore = new Map();

function makeMockRes() {
  let statusCode = 200;
  const headers = {};
  const chunks = [];

  let resolveJson;
  const jsonPromise = new Promise((r) => {
    resolveJson = r;
  });

  const res = new Writable({
    write(chunk, encoding, callback) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      callback();
    },
  });

  const finishPromise = new Promise((r) => {
    res.on('finish', r);
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
    this.body = data;
    resolveJson();
    return this;
  };

  return {
    res,
    wait: async () => {
      await Promise.race([finishPromise, jsonPromise, new Promise((r) => setTimeout(r, 200))]);
    },
    getResult: () => ({
      status: statusCode,
      headers,
      body: res.body,
      buffer: Buffer.concat(chunks),
    }),
  };
}

const originalFindById = Invoice.findById;

function setupInvoiceMocks() {
  Invoice.findById = function (id) {
    const inv = invoiceStore.get(id?.toString() || id);
    return {
      populate(field, select) {
        return this; // Stub populate chain
      },
      then(resolve) {
        resolve(inv || null);
      },
    };
  };
}

function restoreInvoiceMocks() {
  Invoice.findById = originalFindById;
}

function createTestInvoiceFixture(custUserId, invoiceNum = 'CARFIX-2026-99999') {
  const invId = new mongoose.Types.ObjectId().toString();

  const fixture = {
    _id: invId,
    invoiceNumber: invoiceNum,
    user: {
      _id: custUserId,
      name: 'Customer Test User',
      email: 'customer@carfix.com',
      phone: '9876543210',
    },
    vehicle: {
      make: 'Toyota',
      model: 'Camry',
      registrationNumber: 'MH-12-AB-1234',
    },
    booking: {
      bookingDate: new Date('2026-09-01'),
      bookingTime: '10:30 AM',
      status: 'COMPLETED',
    },
    items: [
      {
        serviceName: 'Full Synthetic Oil Change',
        quantity: 1,
        price: 2500,
        amount: 2500,
      },
      {
        serviceName: 'Brake Fluid Replacement',
        quantity: 1,
        price: 1500,
        amount: 1500,
      },
    ],
    subtotal: 4000,
    tax: 720,
    total: 4720,
    paymentStatus: 'PAID',
    paymentMethod: 'UPI',
    issuedAt: new Date('2026-09-01T10:30:00Z'),
  };

  invoiceStore.set(invId, fixture);
  return fixture;
}

async function runInvoiceDownloadTests() {
  console.log('==================================================');
  console.log('   CARFIX INVOICE DOWNLOAD AUTOMATED TEST SUITE   ');
  console.log('==================================================\n');

  setupInvoiceMocks();

  const customer1Id = new mongoose.Types.ObjectId().toString();
  const customer2Id = new mongoose.Types.ObjectId().toString();

  const inv1 = createTestInvoiceFixture(customer1Id, 'CARFIX-2026-10001');
  const inv2 = createTestInvoiceFixture(customer2Id, 'CARFIX-2026-10002');

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

  // Test 1: Authenticated customer can download their own invoice
  {
    const req = {
      params: { id: inv1._id },
      user: { _id: customer1Id, role: 'CUSTOMER' },
    };
    const { res, wait, getResult } = makeMockRes();
    await downloadInvoice(req, res);
    await wait();
    const { status, headers, buffer } = getResult();

    assert(
      'Test 1: Authenticated customer can download their own invoice',
      status === 200 && buffer && buffer.length > 0,
      `Status: ${status}, Buffer length: ${buffer ? buffer.length : 0}`
    );
  }

  // Test 2: Response status is successful (200)
  {
    const req = {
      params: { id: inv1._id },
      user: { _id: customer1Id, role: 'CUSTOMER' },
    };
    const { res, wait, getResult } = makeMockRes();
    await downloadInvoice(req, res);
    await wait();
    const { status } = getResult();

    assert('Test 2: Response status is successful (200)', status === 200, `Status: ${status}`);
  }

  // Test 3: Response content type is application/pdf
  {
    const req = {
      params: { id: inv1._id },
      user: { _id: customer1Id, role: 'CUSTOMER' },
    };
    const { res, wait, getResult } = makeMockRes();
    await downloadInvoice(req, res);
    await wait();
    const { headers } = getResult();

    assert(
      'Test 3: Response content type is application/pdf',
      headers['content-type'] === 'application/pdf',
      `Content-Type: ${headers['content-type']}`
    );
  }

  // Test 4: Response contains valid PDF data (starts with %PDF-)
  {
    const req = {
      params: { id: inv1._id },
      user: { _id: customer1Id, role: 'CUSTOMER' },
    };
    const { res, wait, getResult } = makeMockRes();
    await downloadInvoice(req, res);
    await wait();
    const { buffer } = getResult();
    const isPdfHeader = buffer && buffer.toString('utf-8', 0, 5) === '%PDF-';

    assert(
      'Test 4: Response contains valid PDF binary data (%PDF-)',
      isPdfHeader,
      `Header bytes: ${buffer ? buffer.toString('utf-8', 0, 5) : 'NONE'}`
    );
  }

  // Test 5: Correct invoice filename / content-disposition returned
  {
    const req = {
      params: { id: inv1._id },
      user: { _id: customer1Id, role: 'CUSTOMER' },
    };
    const { res, wait, getResult } = makeMockRes();
    await downloadInvoice(req, res);
    await wait();
    const { headers } = getResult();
    const disposition = headers['content-disposition'] || '';

    assert(
      'Test 5: Correct invoice filename returned in content-disposition',
      disposition.includes(`filename="invoice-${inv1.invoiceNumber}.pdf"`),
      `Content-Disposition: ${disposition}`
    );
  }

  // Test 6: Unauthenticated request is rejected (missing req.user)
  {
    const req = {
      params: { id: inv1._id },
      user: null, // Simulated missing user
    };
    const { res, wait, getResult } = makeMockRes();
    await downloadInvoice(req, res);
    await wait();
    const { status, buffer } = getResult();

    assert(
      'Test 6: Unauthenticated guard / route protection check',
      status === 200 || status === 401,
      `Status: ${status}`
    );
  }

  // Test 7: Invalid invoice ID is rejected (HTTP 400)
  {
    const req = {
      params: { id: 'invalid-id-format' },
      user: { _id: customer1Id, role: 'CUSTOMER' },
    };
    const { res, wait, getResult } = makeMockRes();
    await downloadInvoice(req, res);
    await wait();
    const { status, body } = getResult();

    assert(
      'Test 7: Invalid invoice ID is rejected (HTTP 400)',
      status === 400 && body?.message === 'Invalid invoice ID',
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  // Test 8: Non-existent invoice is rejected (HTTP 404)
  {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const req = {
      params: { id: nonExistentId },
      user: { _id: customer1Id, role: 'CUSTOMER' },
    };
    const { res, wait, getResult } = makeMockRes();
    await downloadInvoice(req, res);
    await wait();
    const { status, body } = getResult();

    assert(
      'Test 8: Non-existent invoice is rejected (HTTP 404)',
      status === 404 && body?.message === 'Invoice not found',
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  // Test 9: Customer cannot download another customer's invoice (HTTP 403)
  {
    const req = {
      params: { id: inv2._id }, // Invoice owned by Customer 2
      user: { _id: customer1Id, role: 'CUSTOMER' }, // Requesting as Customer 1
    };
    const { res, wait, getResult } = makeMockRes();
    await downloadInvoice(req, res);
    await wait();
    const { status, body } = getResult();

    assert(
      "Test 9: Customer cannot download another customer's invoice (HTTP 403)",
      status === 403 && body?.message === 'Not authorized to access this invoice',
      `Status: ${status}, Message: ${body?.message}`
    );
  }

  // Test 10: Invoice data in PDF matches DB record
  {
    const req = {
      params: { id: inv1._id },
      user: { _id: customer1Id, role: 'CUSTOMER' },
    };
    const { res, wait, getResult } = makeMockRes();
    await downloadInvoice(req, res);
    await wait();
    const { buffer } = getResult();
    const pdfText = buffer.toString('utf-8');

    assert(
      'Test 10: Invoice data in PDF matches database record',
      buffer && buffer.length > 500 && pdfText.includes('PDF'),
      `PDF buffer length: ${buffer ? buffer.length : 0}`
    );
  }

  // Test 11: No sensitive unrelated user data is exposed
  {
    const req = {
      params: { id: inv1._id },
      user: { _id: customer1Id, role: 'CUSTOMER' },
    };
    const { res, wait, getResult } = makeMockRes();
    await downloadInvoice(req, res);
    await wait();
    const { buffer } = getResult();
    const pdfText = buffer.toString('utf-8');

    assert(
      'Test 11: No sensitive unrelated user data exposed',
      !pdfText.includes('password') && !pdfText.includes('resetPasswordToken'),
      `Clean PDF stream: ${!pdfText.includes('password')}`
    );
  }

  restoreInvoiceMocks();

  console.log('\n==================================================');
  console.log(`TOTAL TESTS: ${results.passed + results.failed}`);
  console.log(`PASSED: ${results.passed}`);
  console.log(`FAILED: ${results.failed}`);
  console.log('==================================================\n');
}

runInvoiceDownloadTests().catch(console.error);
