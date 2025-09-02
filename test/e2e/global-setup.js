const DatabaseSeeder = require('./seed/seed');

module.exports = async () => {
  console.log('🌱 Running global setup and database seeding...');
  
  try {
    const { users, posts } = await DatabaseSeeder.seed();
    console.log(`✅ Global setup completed: ${users.length} users, ${posts.length} posts`);
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
};
