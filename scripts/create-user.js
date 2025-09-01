#!/usr/bin/env node

/* eslint-disable no-console */
const mongoose = require('mongoose');
const User = require('../mongo/models/userModel');
const mongoConfig = require('../config/mongo');
const bcrypt = require('bcryptjs');

async function hash(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

async function createOrUpdateUser(email, password) {
  try {
    console.log(`👤 Creating/updating user with email: ${email}`);

    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    console.log('✅ Connected to MongoDB');

    const existing = await User.findOne({ email: email.toLowerCase() });

    if (existing) {
      console.log('👥 User already exists, ensuring role is user...');
      const update = { role: 'user' };
      if (password) {
        console.log('🔒 Updating password...');
        update.passwordHash = await hash(password);
      }
      await User.findByIdAndUpdate(existing._id, update);
      const updated = await User.findById(existing._id);
      console.log('✅ User updated successfully');
      console.log(`User details: ${updated.email} (${updated.role})`);
      if (password) console.log('✅ Password updated successfully');
    } else {
      if (!password) {
        throw new Error('Password is required for new users');
      }
      const passwordHash = await hash(password);
      const user = await User.create({
        email: email.toLowerCase(),
        passwordHash,
        role: 'user',
      });
      console.log('✅ New user created successfully');
      console.log(`User details: ${user.email} (${user.role})`);
    }
  } catch (err) {
    console.error('❌ Error creating/updating user:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node scripts/create-user.js <email> [password]');
  console.log('Examples:');
  console.log('  node scripts/create-user.js user@example.com Password1');
  console.log('  node scripts/create-user.js existing@user.com  # Update role to user (keeps password)');
  process.exit(1);
}

const email = args[0];
const password = args[1];
if (!password) {
  console.log('ℹ️  No password provided - only role will be updated if user exists');
}

createOrUpdateUser(email, password);
