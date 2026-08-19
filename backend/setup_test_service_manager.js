import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import connectDB from './src/config/database.js';
import User from './src/models/User.js';
import ServiceCenter from './src/models/ServiceCenter.js';
import Service from './src/models/Service.js';
import Vehicle from './src/models/Vehicle.js';
import Booking from './src/models/Booking.js';
import Invoice from './src/models/Invoice.js';
import { login } from './src/controllers/authController.js';

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

async function setupTestServiceManager() {
  console.log('==================================================');
  console.log('  CARFIX SERVICE MANAGER TEST ACCOUNT SETUP      ');
  console.log('==================================================\n');

  try {
    await connectDB();
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }

  // 1. Ensure at least one active ServiceCenter exists
  let center = await ServiceCenter.findOne({ isActive: true });
  if (!center) {
    console.log('Creating test ServiceCenter...');
    center = await ServiceCenter.create({
      name: 'CarFix Central Workshop',
      description: 'Primary CarFix service center',
      address: '100 Baner High Street',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      phone: '+91 98765 43210',
      email: 'baner@carfix.com',
      openingHours: '8:00 AM – 8:00 PM',
      rating: 4.8,
      totalReviews: 15,
      isActive: true,
    });
  }
  console.log(`[Service Center] Name: ${center.name} (ID: ${center._id})`);

  // 2. Ensure active Service exists
  let service = await Service.findOne({ isActive: true });
  if (!service) {
    console.log('Creating test Service...');
    service = await Service.create({
      name: 'Full Engine Maintenance',
      description: 'Comprehensive engine checkup & oil replacement',
      category: 'General Service',
      price: 3500,
      duration: 60,
      isActive: true,
    });
  }

  // Update center services list if needed
  if (!center.services || center.services.length === 0) {
    center.services = [service._id];
    await center.save();
  }

  // 3. Ensure test Customer and Vehicle exist for bookings
  let customer = await User.findOne({ role: 'CUSTOMER' });
  if (!customer) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Customer123!', salt);
    customer = await User.create({
      name: 'Test Customer',
      email: 'customer.test@carfix.com',
      phone: '+91 98765 00001',
      password: hashedPassword,
      role: 'CUSTOMER',
      isActive: true,
    });
  }

  let vehicle = await Vehicle.findOne({ user: customer._id });
  if (!vehicle) {
    vehicle = await Vehicle.create({
      user: customer._id,
      make: 'Honda',
      model: 'City',
      year: 2022,
      registrationNumber: 'MH-12-CF-8888',
      fuelType: 'Petrol',
      color: 'Silver',
    });
  }

  // 4. Ensure active Mechanic exists
  let mechanic = await User.findOne({ role: 'MECHANIC', isActive: true });
  if (!mechanic) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Mechanic123!', salt);
    mechanic = await User.create({
      name: 'Master Technician John',
      email: 'mechanic.test@carfix.com',
      phone: '+91 98765 00002',
      password: hashedPassword,
      role: 'MECHANIC',
      isActive: true,
    });
  }
  console.log(`[Mechanic] Name: ${mechanic.name} (Email: ${mechanic.email})`);

  // 5. Create/Update dedicated TEST Service Manager Account
  const managerEmail = 'servicemanager.test@carfix.com';
  const managerPassword = 'Manager123!';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(managerPassword, salt);

  let manager = await User.findOne({ email: managerEmail });
  if (manager) {
    console.log(`Updating existing test Service Manager user (${managerEmail})...`);
    manager.password = hashedPassword;
    manager.role = 'SERVICE_MANAGER';
    manager.isActive = true;
    manager.serviceCenter = center._id;
    await manager.save();
  } else {
    console.log(`Creating new test Service Manager user (${managerEmail})...`);
    manager = await User.create({
      name: 'Test Service Manager',
      email: managerEmail,
      phone: '+91 98765 99999',
      password: hashedPassword,
      role: 'SERVICE_MANAGER',
      serviceCenter: center._id,
      isActive: true,
    });
  }
  console.log(`[Service Manager] User: ${manager.name} (${manager.email})`);

  // 6. Ensure test bookings exist in all lifecycle stages for this ServiceCenter
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let bPending = await Booking.findOne({ serviceCenter: center._id, status: 'PENDING' });
  if (!bPending) {
    bPending = await Booking.create({
      user: customer._id,
      vehicle: vehicle._id,
      service: service._id,
      serviceCenter: center._id,
      bookingDate: today,
      bookingTime: '09:00 AM',
      status: 'PENDING',
      amount: service.price,
      notes: 'Test pending booking',
    });
  }

  let bConfirmed = await Booking.findOne({ serviceCenter: center._id, status: 'CONFIRMED' });
  if (!bConfirmed) {
    bConfirmed = await Booking.create({
      user: customer._id,
      vehicle: vehicle._id,
      service: service._id,
      serviceCenter: center._id,
      mechanic: mechanic._id,
      bookingDate: today,
      bookingTime: '11:00 AM',
      status: 'CONFIRMED',
      amount: service.price,
      notes: 'Test confirmed booking',
    });
  }

  let bInProgress = await Booking.findOne({ serviceCenter: center._id, status: 'IN_PROGRESS' });
  if (!bInProgress) {
    bInProgress = await Booking.create({
      user: customer._id,
      vehicle: vehicle._id,
      service: service._id,
      serviceCenter: center._id,
      mechanic: mechanic._id,
      bookingDate: today,
      bookingTime: '02:00 PM',
      status: 'IN_PROGRESS',
      amount: service.price,
      notes: 'Test in-progress booking',
    });
  }

  let bCompleted = await Booking.findOne({ serviceCenter: center._id, status: 'COMPLETED' });
  if (!bCompleted) {
    bCompleted = await Booking.create({
      user: customer._id,
      vehicle: vehicle._id,
      service: service._id,
      serviceCenter: center._id,
      mechanic: mechanic._id,
      bookingDate: today,
      bookingTime: '04:00 PM',
      status: 'COMPLETED',
      amount: service.price,
      notes: 'Test completed booking',
    });
  }

  // Ensure invoice exists for completed booking
  let invoice = await Invoice.findOne({ booking: bCompleted._id });
  if (!invoice) {
    const year = new Date().getFullYear();
    const invoiceNumber = `CARFIX-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
    invoice = await Invoice.create({
      invoiceNumber,
      booking: bCompleted._id,
      user: customer._id,
      vehicle: vehicle._id,
      items: [{ serviceName: service.name, quantity: 1, price: service.price, amount: service.price }],
      subtotal: service.price,
      tax: 0,
      total: service.price,
      paymentStatus: 'PENDING',
      paymentMethod: 'CASH',
      issuedAt: new Date(),
    });
  }

  // 7. Verify authentication using authController login
  console.log('\nTesting Service Manager authentication...');
  const req = { body: { email: managerEmail, password: managerPassword } };
  const { res, getResult } = makeMockRes();
  await login(req, res);
  const { status, body } = getResult();

  if (status === 200 && body.success && body.data?.token) {
    console.log('✓ AUTHENTICATION TEST PASSED! Token generated successfully.');
    console.log(`  Token Role: ${body.data.user.role}`);
  } else {
    console.error('✗ AUTHENTICATION TEST FAILED!', body);
    process.exit(1);
  }

  console.log('\n==================================================');
  console.log(' SERVICE MANAGER MANUAL TESTING CREDENTIALS ');
  console.log('==================================================');
  console.log(` Login Page URL     : http://localhost:5173/login`);
  console.log(` Dashboard URL      : http://localhost:5173/service-manager/dashboard`);
  console.log(` Bookings Queue URL : http://localhost:5173/service-manager/bookings`);
  console.log(` Test Email         : ${managerEmail}`);
  console.log(` Test Password      : ${managerPassword}`);
  console.log(` Service Center     : ${center.name} (${center.city})`);
  console.log(` Assigned Mechanic  : ${mechanic.name}`);
  console.log(` Bookings Visible   :`);
  console.log(`   - PENDING    (#${bPending._id.toString().substring(bPending._id.toString().length - 6).toUpperCase()})`);
  console.log(`   - CONFIRMED  (#${bConfirmed._id.toString().substring(bConfirmed._id.toString().length - 6).toUpperCase()})`);
  console.log(`   - IN_PROGRESS(#${bInProgress._id.toString().substring(bInProgress._id.toString().length - 6).toUpperCase()})`);
  console.log(`   - COMPLETED  (#${bCompleted._id.toString().substring(bCompleted._id.toString().length - 6).toUpperCase()}) -> Invoice: ${invoice.invoiceNumber}`);
  console.log('==================================================\n');

  process.exit(0);
}

setupTestServiceManager().catch(console.error);
