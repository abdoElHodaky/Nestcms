import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, createConnection } from 'mongoose';
import { 
  DatabaseConnectionConfig, 
  QueryOptions, 
  DatabaseStats, 
  ConnectionHealth, 
  QueryType, 
  QueryExecutionPlan 
} from './interfaces/database.interface';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private connections: Map<string, Connection> = new Map();
  private connectionConfigs: DatabaseConnectionConfig[] = [];
  private stats: DatabaseStats['queryStats'] = {
    primaryQueries: 0,
    replicaQueries: 0,
    failoverCount: 0,
    averageQueryTime: 0,
  };
  private queryTimes: number[] = [];

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeConnections();
  }

  async onModuleDestroy() {
    await this.closeAllConnections();
  }

  /**
   * Initialize all database connections (primary and replicas)
   */
  private async initializeConnections(): Promise<void> {
    try {
      // Primary connection
      const primaryUri = this.configService.get<string>('MONGO_URI');
      if (primaryUri) {
        this.connectionConfigs.push({
          uri: primaryUri,
          name: 'primary',
          type: 'primary',
          priority: 1,
          maxPoolSize: this.configService.get<number>('MONGO_PRIMARY_POOL_SIZE', 10),
          readPreference: 'primary',
        });
      }

      // Read replica connections
      const replicaUris = this.getReplicaUris();
      replicaUris.forEach((uri, index) => {
        this.connectionConfigs.push({
          uri,
          name: `replica-${index + 1}`,
          type: 'replica',
          priority: index + 2,
          maxPoolSize: this.configService.get<number>('MONGO_REPLICA_POOL_SIZE', 5),
          readPreference: 'secondary',
        });
      });

      // Create connections
      for (const config of this.connectionConfigs) {
        await this.createConnection(config);
      }

      this.logger.log(`Initialized ${this.connections.size} database connections`);
    } catch (error) {
      this.logger.error('Failed to initialize database connections:', error);
      throw error;
    }
  }

  /**
   * Get replica URIs from environment variables
   */
  private getReplicaUris(): string[] {
    const uris: string[] = [];
    
    // Method 1: Individual replica URIs
    for (let i = 1; i <= 10; i++) {
      const uri = this.configService.get<string>(`MONGO_READ_REPLICA_${i}`);
      if (uri) {
        uris.push(uri);
      }
    }

    // Method 2: Comma-separated list
    if (uris.length === 0) {
      const replicaList = this.configService.get<string>('MONGO_READ_REPLICAS');
      if (replicaList) {
        uris.push(...replicaList.split(',').map(uri => uri.trim()));
      }
    }

    return uris.filter(uri => uri.length > 0);
  }

  /**
   * Create a database connection
   */
  private async createConnection(config: DatabaseConnectionConfig): Promise<void> {
    try {
      const connection = await createConnection(config.uri, {
        maxPoolSize: config.maxPoolSize,
        readPreference: config.readPreference as any,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 30000,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
      });

      this.connections.set(config.name, connection);
      this.logger.log(`Connected to ${config.type} database: ${config.name}`);
    } catch (error) {
      this.logger.error(`Failed to connect to ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Get the best connection for a query type
   */
  getConnection(queryType: QueryType, options: QueryOptions = {}): Connection {
    const plan = this.createExecutionPlan(queryType, options);
    const connection = this.connections.get(plan.connectionName);
    
    if (!connection) {
      this.logger.warn(`Connection ${plan.connectionName} not available, falling back to primary`);
      this.stats.failoverCount++;
      return this.connections.get('primary')!;
    }

    // Update stats
    if (plan.connectionType === 'primary') {
      this.stats.primaryQueries++;
    } else {
      this.stats.replicaQueries++;
    }

    return connection;
  }

  /**
   * Create query execution plan
   */
  createExecutionPlan(queryType: QueryType, options: QueryOptions = {}): QueryExecutionPlan {
    // Force primary for writes
    if (queryType === QueryType.WRITE) {
      return {
        connectionName: 'primary',
        connectionType: 'primary',
        readPreference: 'primary',
      };
    }

    // Use replica preference from options
    if (options.useReplica === false) {
      return {
        connectionName: 'primary',
        connectionType: 'primary',
        readPreference: options.readPreference || 'primary',
      };
    }

    // Find best available replica
    const availableReplicas = this.connectionConfigs
      .filter(config => config.type === 'replica')
      .filter(config => this.connections.has(config.name))
      .sort((a, b) => a.priority - b.priority);

    if (availableReplicas.length > 0) {
      const replica = availableReplicas[0];
      return {
        connectionName: replica.name,
        connectionType: 'replica',
        readPreference: options.readPreference || replica.readPreference || 'secondary',
      };
    }

    // Fallback to primary
    return {
      connectionName: 'primary',
      connectionType: 'primary',
      readPreference: 'primaryPreferred',
    };
  }

  /**
   * Execute a query with timing
   */
  async executeWithTiming<T>(
    queryType: QueryType,
    queryFn: (connection: Connection) => Promise<T>,
    options: QueryOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const connection = this.getConnection(queryType, options);
      const result = await queryFn(connection);
      
      const executionTime = Date.now() - startTime;
      this.updateQueryTiming(executionTime);
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateQueryTiming(executionTime);
      throw error;
    }
  }

  /**
   * Update query timing statistics
   */
  private updateQueryTiming(executionTime: number): void {
    this.queryTimes.push(executionTime);
    
    // Keep only last 1000 query times for rolling average
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000);
    }
    
    this.stats.averageQueryTime = 
      this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length;
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<DatabaseStats> {
    const connectionStats = await Promise.all(
      Array.from(this.connections.entries()).map(async ([name, connection]) => {
        const config = this.connectionConfigs.find(c => c.name === name);
        if (!config) return null;

        try {
          const db = connection.db;
          const stats = await db.admin().serverStatus();
          
          return {
            name,
            type: config.type,
            active: stats.connections?.current || 0,
            available: stats.connections?.available || 0,
            total: stats.connections?.totalCreated || 0,
            lag: config.type === 'replica' ? await this.getReplicationLag(connection) : undefined,
          };
        } catch (error) {
          this.logger.error(`Error getting stats for ${name}:`, error);
          return null;
        }
      })
    );

    const validStats = connectionStats.filter(stat => stat !== null);
    const primaryStats = validStats.find(stat => stat.type === 'primary');
    const replicaStats = validStats.filter(stat => stat.type === 'replica');

    return {
      connections: {
        primary: primaryStats ? {
          active: primaryStats.active,
          available: primaryStats.available,
          total: primaryStats.total,
        } : { active: 0, available: 0, total: 0 },
        replicas: replicaStats.map(stat => ({
          name: stat.name,
          active: stat.active,
          available: stat.available,
          total: stat.total,
          lag: stat.lag,
        })),
      },
      queryStats: { ...this.stats },
    };
  }

  /**
   * Get replication lag for a replica connection
   */
  private async getReplicationLag(connection: Connection): Promise<number | undefined> {
    try {
      const db = connection.db;
      const replStatus = await db.admin().command({ replSetGetStatus: 1 });
      
      if (replStatus.members) {
        const primary = replStatus.members.find((member: any) => member.stateStr === 'PRIMARY');
        const secondary = replStatus.members.find((member: any) => member.stateStr === 'SECONDARY');
        
        if (primary && secondary) {
          return Math.abs(primary.optimeDate.getTime() - secondary.optimeDate.getTime());
        }
      }
    } catch (error) {
      // Ignore errors for non-replica set configurations
    }
    
    return undefined;
  }

  /**
   * Check health of all connections
   */
  async checkHealth(): Promise<ConnectionHealth[]> {
    const healthChecks = await Promise.all(
      Array.from(this.connections.entries()).map(async ([name, connection]) => {
        const config = this.connectionConfigs.find(c => c.name === name);
        if (!config) return null;

        try {
          // Simple ping to check connection
          await connection.db.admin().ping();
          
          return {
            name,
            type: config.type,
            connected: true,
            lag: config.type === 'replica' ? await this.getReplicationLag(connection) : undefined,
            lastCheck: new Date(),
          };
        } catch (error) {
          return {
            name,
            type: config.type,
            connected: false,
            lastCheck: new Date(),
            error: error.message,
          };
        }
      })
    );

    return healthChecks.filter(health => health !== null);
  }

  /**
   * Close all connections
   */
  private async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.connections.values()).map(connection => 
      connection.close()
    );
    
    await Promise.all(closePromises);
    this.connections.clear();
    this.logger.log('All database connections closed');
  }

  /**
   * Get primary connection
   */
  getPrimaryConnection(): Connection {
    const primary = this.connections.get('primary');
    if (!primary) {
      throw new Error('Primary database connection not available');
    }
    return primary;
  }

  /**
   * Get available replica connections
   */
  getReplicaConnections(): Connection[] {
    return this.connectionConfigs
      .filter(config => config.type === 'replica')
      .map(config => this.connections.get(config.name))
      .filter(connection => connection !== undefined);
  }
}
