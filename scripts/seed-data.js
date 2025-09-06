#!/usr/bin/env node

const mongoose = require('../mongo');
const pageModel = require('../mongo/models/pageModel');
const userModel = require('../mongo/models/userModel');
const { hashPassword } = require('../utils/password');
const logger = require('../logger');

// Sample users to create
const sampleUsers = [
  {
    email: 'bob@example.com',
    password: 'DatablogBobPassword123',
    role: 'user',
  },
  {
    email: 'admin@example.com',
    password: 'DatablogAdminPassword123',
    role: 'admin',
  },
  {
    email: 'sue@example.com',
    password: 'DatablogSuePassword123',
    role: 'user',
  },
];

async function seedData() {
  try {
    logger.info('🌱 Seeding sample data...');

    // Wait for existing connection or connect
    if (mongoose.connection.readyState === 0) {
      // Not connected, wait for connection
      await new Promise(resolve => {
        mongoose.connection.on('connected', resolve);
      });
    }

    // Clear existing data
    await pageModel.deleteMany({});
    await userModel.deleteMany({});
    logger.info('🗑️  Cleared existing data');

    // Create users
    const createdUsers = {};
    for (const userData of sampleUsers) {
      const passwordHash = await hashPassword(userData.password);
      const user = new userModel({
        email: userData.email,
        passwordHash,
        role: userData.role,
      });
      await user.save();
      createdUsers[userData.email] = user;
      logger.info(`✅ Created user: ${userData.email} (${userData.role})`);
    }

    // Create sample pages with authors
    const samplePages = [
      {
        id: 1,
        title: 'My First Blog Post',
        body: 'Hi everyone! This is Sue writing my first blog post. Welcome to Datablog, a comprehensive example of Datadog RUM and APM integration. This application demonstrates how to connect frontend user interactions with backend traces for complete observability.',
        hasAttachment: false,
        createdDate: new Date('2024-01-15'),
        updatedDate: new Date('2024-01-15'),
        author: createdUsers['sue@example.com']._id,
      },
      {
        id: 2,
        title: 'Getting Started with Monitoring',
        body: "Hey there! Bob here. Let me share what I've learned about setting up comprehensive monitoring for your applications. This post covers the basics of Real User Monitoring (RUM) and Application Performance Monitoring (APM) with practical examples that I've been working on.",
        hasAttachment: true,
        createdDate: new Date('2024-01-16'),
        updatedDate: new Date('2024-01-16'),
        author: createdUsers['bob@example.com']._id,
      },
    ];

    // Insert sample pages
    await pageModel.insertMany(samplePages);
    logger.info(`✅ Inserted ${samplePages.length} sample pages`);

    // Verify data
    const userCount = await userModel.countDocuments();
    const pageCount = await pageModel.countDocuments();
    logger.info(`📊 Total users in database: ${userCount}`);
    logger.info(`📊 Total pages in database: ${pageCount}`);

    logger.info('🎉 Sample data seeding completed!');
    logger.info('👤 Users created:');
    logger.info('   - bob@example.com (user) - DatablogBobPassword123');
    logger.info('   - admin@example.com (admin) - DatablogAdminPassword123');
    logger.info('   - sue@example.com (user) - DatablogSuePassword123');
    logger.info(
      '📝 Posts: Sue has 1 post, Bob has 1 post, Admin has 0 posts (but can see all)'
    );
  } catch (error) {
    logger.error('❌ Error seeding data:', error.message);
  } finally {
    // Disconnect when running as standalone script
    if (require.main === module) {
      await mongoose.disconnect();
    }
  }
}

// Run the script
if (require.main === module) {
  seedData();
}

module.exports = { seedData };
