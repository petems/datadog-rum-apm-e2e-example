#!/usr/bin/env node

const mongoose = require('mongoose');
const pageModel = require('../mongo/models/pageModel');
const logger = require('../logger');

const samplePages = [
  {
    id: 1,
    title: 'Welcome to Datablog',
    body: 'This is your first blog post! Welcome to Datablog, a comprehensive example of Datadog RUM and APM integration. This application demonstrates how to connect frontend user interactions with backend traces for complete observability.',
    hasAttachment: false,
    createdDate: new Date('2024-01-15'),
    updatedDate: new Date('2024-01-15'),
  },
  {
    id: 2,
    title: 'Getting Started with Monitoring',
    body: 'Learn how to set up comprehensive monitoring for your applications. This post covers the basics of Real User Monitoring (RUM) and Application Performance Monitoring (APM) with practical examples.',
    hasAttachment: true,
    createdDate: new Date('2024-01-16'),
    updatedDate: new Date('2024-01-16'),
  },
  {
    id: 3,
    title: 'Advanced Tracing Techniques',
    body: 'Explore advanced tracing techniques including custom spans, distributed tracing, and error correlation. This post dives deep into how to get the most out of your monitoring setup.',
    hasAttachment: false,
    createdDate: new Date('2024-01-17'),
    updatedDate: new Date('2024-01-17'),
  },
];

async function seedData() {
  try {
    logger.info('🌱 Seeding sample data...');

    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/datablog');

    // Clear existing data
    await pageModel.deleteMany({});
    logger.info('🗑️  Cleared existing data');

    // Insert sample data
    await pageModel.insertMany(samplePages);
    logger.info(`✅ Inserted ${samplePages.length} sample pages`);

    // Verify data
    const count = await pageModel.countDocuments();
    logger.info(`📊 Total pages in database: ${count}`);

    logger.info('🎉 Sample data seeding completed!');
  } catch (error) {
    logger.error('❌ Error seeding data:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
if (require.main === module) {
  seedData();
}

module.exports = { seedData };
