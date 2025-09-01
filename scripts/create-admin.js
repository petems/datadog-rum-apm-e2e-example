#!/usr/bin/env node

/* eslint-disable no-console */
const mongoose = require('mongoose');
const User = require('../mongo/models/userModel');
// Use bcrypt for compatibility with production image where argon2 may be unavailable
const bcrypt = require('bcryptjs');
async function hashWithBcrypt(password) {
  const saltRounds = 12;
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
}
const mongoConfig = require('../config/mongo');

async function createAdminUser(email, password) {
  try {
    console.log(`👤 Creating/updating admin user with email: ${email}`);

    // Connect to MongoDB
    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    console.log('🔍 Checking if user exists...');
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      console.log('👥 User already exists, updating role to admin...');

      // Prepare update object
      const updateData = { role: 'admin' };

      // Update password if provided
      if (password) {
        console.log('🔒 Updating password...');
        const passwordHash = await hashWithBcrypt(password);
        updateData.passwordHash = passwordHash;
      }

      // Update existing user
      await User.findByIdAndUpdate(existingUser._id, updateData);

      const updatedUser = await User.findById(existingUser._id);
      console.log('✅ Admin role set successfully');
      console.log(`User details: ${updatedUser.email} (${updatedUser.role})`);
      if (password) {
        console.log('✅ Password updated successfully');
      }
      console.log('🎉 Existing user updated to admin successfully!');
    } else {
      console.log("🆕 User doesn't exist, creating new user...");

      // Validate password
      if (!password) {
        throw new Error('Password is required for new users');
      }

      // Hash password
      const passwordHash = await hashWithBcrypt(password);

      // Create new admin user
      const newUser = await User.create({
        email: email.toLowerCase(),
        passwordHash,
        role: 'admin',
      });

      console.log('✅ User created successfully!');
      console.log(`User details: ${newUser.email} (${newUser.role})`);
      console.log('🎉 New admin user created successfully!');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log('Usage: node scripts/create-admin.js <email> [password]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/create-admin.js admin@example.com SecurePass123');
  console.log(
    '  node scripts/create-admin.js existing@user.com NewPassword123  # Updates existing user to admin and changes password'
  );
  console.log(
    '  node scripts/create-admin.js existing@user.com  # Updates existing user to admin only (keeps password)'
  );
  process.exit(1);
}

const email = args[0];
const password = args[1];

// For existing users, password is optional
if (!password) {
  console.log('⚠️  No password provided - will only work for existing users');
}

createAdminUser(email, password);
