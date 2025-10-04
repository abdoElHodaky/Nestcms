export interface DatabaseConnectionConfig {
  uri: string;
  name: string;
  type: 'primary' | 'replica';
  priority: number;
  maxPoolSize?: number;
  readPreference?: string;
}

export interface QueryOptions {
  useReplica?: boolean;
  readPreference?: 'primary' | 'secondary' | 'secondaryPreferred' | 'primaryPreferred';
  maxTimeMS?: number;
  allowPartialResults?: boolean;
  hint?: any;
}

export interface DatabaseStats {
  connections: {
    primary: {
      active: number;
      available: number;
      total: number;
    };
    replicas: Array<{
      name: string;
      active: number;
      available: number;
      total: number;
      lag?: number;
    }>;
  };
  queryStats: {
    primaryQueries: number;
    replicaQueries: number;
    failoverCount: number;
    averageQueryTime: number;
  };
}

export interface ConnectionHealth {
  name: string;
  type: 'primary' | 'replica';
  connected: boolean;
  lag?: number;
  lastCheck: Date;
  error?: string;
}

export enum QueryType {
  READ = 'read',
  WRITE = 'write',
  AGGREGATION = 'aggregation',
  COUNT = 'count',
  DISTINCT = 'distinct'
}

export interface QueryExecutionPlan {
  connectionName: string;
  connectionType: 'primary' | 'replica';
  readPreference: string;
  estimatedExecutionTime?: number;
  cacheKey?: string;
  useCache?: boolean;
}
