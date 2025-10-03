// MongoDB Initialization Script for NestCMS
// This script initializes the database with required collections and indexes

print('Starting NestCMS database initialization...');

// Switch to the nestcms database
db = db.getSiblingDB('nestcms');

// Create collections with validation schemas
print('Creating collections with validation schemas...');

// Users collection
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'role'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'must be a valid email address'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'must be a string with at least 6 characters'
        },
        role: {
          bsonType: 'string',
          enum: ['admin', 'manager', 'employee', 'client'],
          description: 'must be one of the allowed roles'
        }
      }
    }
  }
});

// Projects collection
db.createCollection('projects', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'status', 'createdBy'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          description: 'must be a non-empty string'
        },
        status: {
          bsonType: 'string',
          enum: ['active', 'completed', 'cancelled', 'on-hold'],
          description: 'must be one of the allowed statuses'
        }
      }
    }
  }
});

// Contracts collection
db.createCollection('contracts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['projectId', 'employeeId', 'status'],
      properties: {
        status: {
          bsonType: 'string',
          enum: ['active', 'completed', 'terminated'],
          description: 'must be one of the allowed statuses'
        }
      }
    }
  }
});

// Payments collection
db.createCollection('payments', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['amount', 'currency', 'status'],
      properties: {
        amount: {
          bsonType: 'number',
          minimum: 0,
          description: 'must be a positive number'
        },
        currency: {
          bsonType: 'string',
          enum: ['USD', 'EUR', 'SAR', 'AED'],
          description: 'must be one of the supported currencies'
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
          description: 'must be one of the allowed statuses'
        }
      }
    }
  }
});

// Earnings collection
db.createCollection('earnings', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['employeeId', 'projectId', 'amount', 'period'],
      properties: {
        amount: {
          bsonType: 'number',
          minimum: 0,
          description: 'must be a positive number'
        }
      }
    }
  }
});

// Articles collection
db.createCollection('articles', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'content', 'authorId'],
      properties: {
        title: {
          bsonType: 'string',
          minLength: 1,
          description: 'must be a non-empty string'
        },
        content: {
          bsonType: 'string',
          minLength: 1,
          description: 'must be a non-empty string'
        }
      }
    }
  }
});

print('Collections created successfully!');

// Create optimized indexes for performance
print('Creating performance-optimized indexes...');

// Users indexes
db.users.createIndex({ email: 1 }, { unique: true, name: 'idx_users_email_unique' });
db.users.createIndex({ role: 1 }, { name: 'idx_users_role' });
db.users.createIndex({ createdAt: -1 }, { name: 'idx_users_created_desc' });

// Projects indexes
db.projects.createIndex({ name: 1 }, { name: 'idx_projects_name' });
db.projects.createIndex({ status: 1 }, { name: 'idx_projects_status' });
db.projects.createIndex({ createdBy: 1 }, { name: 'idx_projects_created_by' });
db.projects.createIndex({ createdAt: -1 }, { name: 'idx_projects_created_desc' });
db.projects.createIndex({ status: 1, createdAt: -1 }, { name: 'idx_projects_status_created' });

// Contracts indexes (optimized for aggregation)
db.contracts.createIndex({ projectId: 1 }, { name: 'idx_contracts_project' });
db.contracts.createIndex({ employeeId: 1 }, { name: 'idx_contracts_employee' });
db.contracts.createIndex({ status: 1 }, { name: 'idx_contracts_status' });
db.contracts.createIndex({ projectId: 1, employeeId: 1 }, { name: 'idx_contracts_project_employee' });
db.contracts.createIndex({ projectId: 1, status: 1 }, { name: 'idx_contracts_project_status' });
db.contracts.createIndex({ employeeId: 1, status: 1 }, { name: 'idx_contracts_employee_status' });

// Payments indexes (optimized for PayTabs integration)
db.payments.createIndex({ status: 1 }, { name: 'idx_payments_status' });
db.payments.createIndex({ createdAt: -1 }, { name: 'idx_payments_created_desc' });
db.payments.createIndex({ payTabsTransactionId: 1 }, { sparse: true, name: 'idx_payments_paytabs_txn' });
db.payments.createIndex({ status: 1, createdAt: -1 }, { name: 'idx_payments_status_created' });
db.payments.createIndex({ userId: 1, status: 1 }, { name: 'idx_payments_user_status' });

// Earnings indexes (optimized for aggregation)
db.earnings.createIndex({ employeeId: 1 }, { name: 'idx_earnings_employee' });
db.earnings.createIndex({ projectId: 1 }, { name: 'idx_earnings_project' });
db.earnings.createIndex({ period: 1 }, { name: 'idx_earnings_period' });
db.earnings.createIndex({ employeeId: 1, period: 1 }, { name: 'idx_earnings_employee_period' });
db.earnings.createIndex({ projectId: 1, period: 1 }, { name: 'idx_earnings_project_period' });
db.earnings.createIndex({ employeeId: 1, projectId: 1, period: 1 }, { name: 'idx_earnings_composite' });

// Articles indexes
db.articles.createIndex({ title: 1 }, { name: 'idx_articles_title' });
db.articles.createIndex({ authorId: 1 }, { name: 'idx_articles_author' });
db.articles.createIndex({ createdAt: -1 }, { name: 'idx_articles_created_desc' });
db.articles.createIndex({ title: 'text', content: 'text' }, { name: 'idx_articles_text_search' });

print('Indexes created successfully!');

// Create TTL indexes for session management and temporary data
print('Creating TTL indexes for session management...');

// Sessions collection (if using database sessions)
db.createCollection('sessions');
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'idx_sessions_ttl' });

// Audit logs with TTL (keep for 90 days)
db.createCollection('audit_logs');
db.audit_logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000, name: 'idx_audit_logs_ttl' });

// Payment webhooks log (keep for 30 days)
db.createCollection('webhook_logs');
db.webhook_logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000, name: 'idx_webhook_logs_ttl' });

print('TTL indexes created successfully!');

// Create initial admin user
print('Creating initial admin user...');

const adminUser = {
  email: 'admin@nestcms.com',
  password: '$2b$10$rQZ8kHWKtGY5OnlAiB.OHOWJbkzb5cMa8qXjKzqGqYvKzqGqYvKzq', // password: admin123
  role: 'admin',
  firstName: 'System',
  lastName: 'Administrator',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

try {
  db.users.insertOne(adminUser);
  print('Initial admin user created successfully!');
  print('Email: admin@nestcms.com');
  print('Password: admin123');
} catch (error) {
  if (error.code === 11000) {
    print('Admin user already exists, skipping creation.');
  } else {
    print('Error creating admin user:', error.message);
  }
}

// Create sample data for development
print('Creating sample development data...');

// Sample project
const sampleProject = {
  name: 'Sample CMS Project',
  description: 'A sample project for testing the NestCMS system',
  status: 'active',
  createdBy: adminUser._id || new ObjectId(),
  budget: 50000,
  currency: 'USD',
  startDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

try {
  const projectResult = db.projects.insertOne(sampleProject);
  print('Sample project created successfully!');
  
  // Sample contract
  const sampleContract = {
    projectId: projectResult.insertedId,
    employeeId: adminUser._id || new ObjectId(),
    status: 'active',
    hourlyRate: 50,
    currency: 'USD',
    startDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  db.contracts.insertOne(sampleContract);
  print('Sample contract created successfully!');
  
} catch (error) {
  print('Error creating sample data:', error.message);
}

print('NestCMS database initialization completed successfully!');
print('');
print('=== Database Summary ===');
print('Collections created: users, projects, contracts, payments, earnings, articles, sessions, audit_logs, webhook_logs');
print('Indexes created: 25+ performance-optimized indexes');
print('Initial admin user: admin@nestcms.com / admin123');
print('Sample data: 1 project, 1 contract');
print('========================');

