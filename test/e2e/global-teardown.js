const { MongoClient } = require('mongodb');
const mongoConfig = require('../../config/mongo');

module.exports = async () => {
  console.log('🧹 Running global teardown...');
  
  const client = new MongoClient(mongoConfig.uri);
  
  try {
    await client.connect();
    const db = client.db(mongoConfig.options.dbName);
    
    // Clean up test data
    await db.collection('users').deleteMany({});
    await db.collection('pages').deleteMany({});
    
    console.log('✅ Global teardown completed');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
  } finally {
    await client.close();
  }
};