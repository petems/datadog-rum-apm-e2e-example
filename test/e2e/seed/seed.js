const { MongoClient } = require('mongodb');
const { userFactory, postFactory } = require('../factories');
const mongoConfig = require('../../../config/mongo');

class DatabaseSeeder {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    this.client = new MongoClient(mongoConfig.uri);
    await this.client.connect();
    this.db = this.client.db(mongoConfig.options.dbName);
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
    }
  }

  async clearAll() {
    await this.db.collection('users').deleteMany({});
    await this.db.collection('pages').deleteMany({});
  }

  async seedUsers() {
    // Create admin user
    const adminUser = userFactory.build({
      email: 'admin@example.com',
      password: 'AdminPassword123',
      role: 'admin',
    });

    // Create regular users
    const regularUsers = userFactory.buildList(3, {
      role: 'user',
    });

    const allUsers = [adminUser, ...regularUsers];
    
    // Remove the _plainPassword field before inserting
    const usersToInsert = allUsers.map(user => {
      const { _plainPassword, ...userDoc } = user;
      return userDoc;
    });

    const result = await this.db.collection('users').insertMany(usersToInsert);
    
    // Return users with their MongoDB IDs and plain passwords for test use
    return allUsers.map((user, index) => ({
      ...user,
      _id: result.insertedIds[index],
    }));
  }

  async seedPosts(users) {
    const adminUser = users.find(user => user.role === 'admin');
    const regularUsers = users.filter(user => user.role === 'user');

    // Create posts by admin
    const adminPosts = postFactory.buildList(5, {}, { author: adminUser._id });
    
    // Create posts by regular users
    const userPosts = [];
    regularUsers.forEach(user => {
      const postCount = Math.floor(Math.random() * 3) + 1; // 1-3 posts per user
      const posts = postFactory.buildList(postCount, {}, { author: user._id });
      userPosts.push(...posts);
    });

    const allPosts = [...adminPosts, ...userPosts];
    
    // Assign sequential IDs to avoid duplicates
    allPosts.forEach((post, index) => {
      post.id = index + 1;
    });

    const result = await this.db.collection('pages').insertMany(allPosts);
    
    return allPosts.map((post, index) => ({
      ...post,
      _id: result.insertedIds[index],
    }));
  }

  async seed() {
    await this.connect();
    
    try {
      await this.clearAll();
      console.log('🗑️  Cleared existing data');

      const users = await this.seedUsers();
      console.log(`👥 Created ${users.length} users (1 admin, ${users.length - 1} regular)`);

      const posts = await this.seedPosts(users);
      console.log(`📝 Created ${posts.length} posts`);

      return { users, posts };
    } finally {
      await this.disconnect();
    }
  }

  // Static method for easy use in tests
  static async seed() {
    const seeder = new DatabaseSeeder();
    return await seeder.seed();
  }

  // Method to get specific user credentials for tests
  static getTestCredentials() {
    return {
      admin: {
        email: 'admin@example.com',
        password: 'AdminPassword123',
      },
    };
  }
}

module.exports = DatabaseSeeder;