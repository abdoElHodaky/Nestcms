// MongoDB Replica Set Initialization Script
// This script initializes the MongoDB replica set for NestCMS

print('🚀 Starting MongoDB Replica Set Initialization for NestCMS...');

// Wait for MongoDB to be ready
sleep(2000);

try {
  // Initialize replica set configuration
  const config = {
    _id: 'nestcms-rs',
    version: 1,
    members: [
      {
        _id: 0,
        host: 'mongodb-primary:27017',
        priority: 2,
        tags: { role: 'primary' }
      },
      {
        _id: 1,
        host: 'mongodb-replica1:27017',
        priority: 1,
        tags: { role: 'replica', zone: 'analytics' }
      },
      {
        _id: 2,
        host: 'mongodb-replica2:27017',
        priority: 1,
        tags: { role: 'replica', zone: 'reporting' }
      },
      {
        _id: 3,
        host: 'mongodb-replica3:27017',
        priority: 1,
        tags: { role: 'replica', zone: 'aggregation' }
      }
    ],
    settings: {
      chainingAllowed: true,
      heartbeatIntervalMillis: 2000,
      heartbeatTimeoutSecs: 10,
      electionTimeoutMillis: 10000,
      catchUpTimeoutMillis: -1,
      getLastErrorModes: {
        majority: { role: 2 }
      },
      getLastErrorDefaults: {
        w: 1,
        wtimeout: 0
      },
      replicaSetId: ObjectId()
    }
  };

  print('📋 Replica Set Configuration:');
  printjson(config);

  // Initialize the replica set
  const result = rs.initiate(config);
  print('✅ Replica Set Initialization Result:');
  printjson(result);

  if (result.ok === 1) {
    print('🎉 Replica set initialized successfully!');
    
    // Wait for replica set to stabilize
    print('⏳ Waiting for replica set to stabilize...');
    sleep(10000);
    
    // Check replica set status
    const status = rs.status();
    print('📊 Replica Set Status:');
    printjson(status);
    
    // Create application database and user
    print('🗃️ Creating NestCMS database and collections...');
    
    // Switch to nestcms database
    db = db.getSiblingDB('nestcms');
    
    // Create collections with indexes for optimal performance
    print('📚 Creating collections and indexes...');
    
    // Users collection
    db.createCollection('users');
    db.users.createIndex({ email: 1 }, { unique: true });
    db.users.createIndex({ role: 1 });
    db.users.createIndex({ createdAt: 1 });
    db.users.createIndex({ 'permissions.resource': 1, 'permissions.actions': 1 });
    
    // Projects collection
    db.createCollection('projects');
    db.projects.createIndex({ userId: 1 });
    db.projects.createIndex({ status: 1 });
    db.projects.createIndex({ createdAt: 1 });
    db.projects.createIndex({ 'designs.userId': 1 });
    db.projects.createIndex({ 'steps.status': 1 });
    
    // Contracts collection
    db.createCollection('contracts');
    db.contracts.createIndex({ employeeId: 1 });
    db.contracts.createIndex({ clientId: 1 });
    db.contracts.createIndex({ status: 1 });
    db.contracts.createIndex({ startDate: 1, endDate: 1 });
    db.contracts.createIndex({ 'terms.salary': 1 });
    
    // Earnings collection
    db.createCollection('earnings');
    db.earnings.createIndex({ userId: 1 });
    db.earnings.createIndex({ projectId: 1 });
    db.earnings.createIndex({ contractId: 1 });
    db.earnings.createIndex({ date: 1 });
    db.earnings.createIndex({ currency: 1 });
    db.earnings.createIndex({ amount: 1 });
    db.earnings.createIndex({ userId: 1, date: 1 });
    
    // Articles collection
    db.createCollection('articles');
    db.articles.createIndex({ authorId: 1 });
    db.articles.createIndex({ status: 1 });
    db.articles.createIndex({ createdAt: 1 });
    db.articles.createIndex({ tags: 1 });
    
    // Payments collection
    db.createCollection('payments');
    db.payments.createIndex({ userId: 1 });
    db.payments.createIndex({ status: 1 });
    db.payments.createIndex({ createdAt: 1 });
    db.payments.createIndex({ 'paymentMethod.type': 1 });
    db.payments.createIndex({ amount: 1, currency: 1 });
    
    print('✅ Collections and indexes created successfully!');
    
    // Create read preferences for different query types
    print('🎯 Configuring read preferences...');
    
    // Set up read preference tags for different workloads
    db.runCommand({
      createRole: 'analyticsReader',
      privileges: [
        { resource: { db: 'nestcms', collection: '' }, actions: ['find', 'listCollections'] }
      ],
      roles: [],
      readPreference: { mode: 'secondary', tags: [{ zone: 'analytics' }] }
    });
    
    db.runCommand({
      createRole: 'reportingReader',
      privileges: [
        { resource: { db: 'nestcms', collection: '' }, actions: ['find', 'listCollections'] }
      ],
      roles: [],
      readPreference: { mode: 'secondary', tags: [{ zone: 'reporting' }] }
    });
    
    db.runCommand({
      createRole: 'aggregationReader',
      privileges: [
        { resource: { db: 'nestcms', collection: '' }, actions: ['find', 'listCollections'] }
      ],
      roles: [],
      readPreference: { mode: 'secondary', tags: [{ zone: 'aggregation' }] }
    });
    
    print('✅ Read preferences configured successfully!');
    
    // Insert sample data for testing
    print('📝 Inserting sample data for testing...');
    
    // Sample users
    db.users.insertMany([
      {
        _id: ObjectId(),
        name: 'Admin User',
        email: 'admin@nestcms.com',
        role: 'admin',
        permissions: [
          { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'projects', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'contracts', actions: ['create', 'read', 'update', 'delete'] }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: ObjectId(),
        name: 'Test Employee',
        email: 'employee@nestcms.com',
        role: 'employee',
        permissions: [
          { resource: 'projects', actions: ['read', 'update'] },
          { resource: 'earnings', actions: ['read'] }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    print('✅ Sample data inserted successfully!');
    
    // Final status check
    print('🔍 Final replica set status check...');
    const finalStatus = rs.status();
    
    if (finalStatus.ok === 1) {
      print('🎉 MongoDB Replica Set for NestCMS initialized successfully!');
      print('📊 Replica Set Members:');
      finalStatus.members.forEach((member, index) => {
        print(`  ${index + 1}. ${member.name} - ${member.stateStr} (Health: ${member.health})`);
      });
      
      print('🚀 NestCMS MongoDB cluster is ready for production!');
      print('');
      print('📋 Connection Strings:');
      print('  Primary (Write): mongodb://admin:password123@mongodb-primary:27017/nestcms?authSource=admin&replicaSet=nestcms-rs');
      print('  Replica 1 (Analytics): mongodb://admin:password123@mongodb-replica1:27017/nestcms?authSource=admin&readPreference=secondary');
      print('  Replica 2 (Reporting): mongodb://admin:password123@mongodb-replica2:27017/nestcms?authSource=admin&readPreference=secondary');
      print('  Replica 3 (Aggregation): mongodb://admin:password123@mongodb-replica3:27017/nestcms?authSource=admin&readPreference=secondary');
      print('');
      print('🎯 Read Preference Tags:');
      print('  Analytics Queries: { zone: "analytics" }');
      print('  Reporting Queries: { zone: "reporting" }');
      print('  Aggregation Queries: { zone: "aggregation" }');
      
    } else {
      print('❌ Error in final status check:');
      printjson(finalStatus);
    }
    
  } else {
    print('❌ Failed to initialize replica set:');
    printjson(result);
  }
  
} catch (error) {
  print('❌ Error during replica set initialization:');
  print(error);
}

print('🏁 MongoDB initialization script completed.');

