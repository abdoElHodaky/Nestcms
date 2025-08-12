/**
 * Cache Decorator - Method-level caching for aggregation results
 * 
 * Provides decorators to automatically cache method results with TTL support
 */

import { CacheManager } from '../utils/cache/CacheManager';

export interface CacheDecoratorOptions {
  ttl?: number; // Time to live in milliseconds
  keyGenerator?: (...args: any[]) => string;
  enabled?: boolean;
}

/**
 * Cache decorator for methods
 */
export function Cache(options: CacheDecoratorOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const cacheManager = CacheManager.getInstance();
    
    descriptor.value = async function (...args: any[]) {
      // Check if caching is enabled
      if (options.enabled === false) {
        return method.apply(this, args);
      }

      // Generate cache key
      let cacheKey: string;
      if (options.keyGenerator) {
        cacheKey = options.keyGenerator(...args);
      } else {
        const className = this.constructor.name;
        const argsKey = JSON.stringify(args);
        cacheKey = `${className}.${propertyName}:${Buffer.from(argsKey).toString('base64')}`;
      }

      // Try to get from cache
      const cachedResult = cacheManager.get(cacheKey);
      if (cachedResult !== null) {
        console.log(`Cache hit for ${propertyName}`);
        return cachedResult;
      }

      // Execute method and cache result
      try {
        const result = await method.apply(this, args);
        const ttl = options.ttl || 5 * 60 * 1000; // 5 minutes default
        cacheManager.set(cacheKey, result, ttl);
        console.log(`Cache miss for ${propertyName} - result cached`);
        return result;
      } catch (error) {
        console.error(`Error in cached method ${propertyName}:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Cache invalidation decorator
 */
export function InvalidateCache(cacheKeys: string[] | ((args: any[]) => string[])) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const cacheManager = CacheManager.getInstance();
    
    descriptor.value = async function (...args: any[]) {
      try {
        const result = await method.apply(this, args);
        
        // Determine keys to invalidate
        let keysToInvalidate: string[];
        if (typeof cacheKeys === 'function') {
          keysToInvalidate = cacheKeys(args);
        } else {
          keysToInvalidate = cacheKeys;
        }
        
        // Invalidate cache entries
        keysToInvalidate.forEach(key => {
          cacheManager.delete(key);
          console.log(`Cache invalidated for key: ${key}`);
        });
        
        return result;
      } catch (error) {
        console.error(`Error in cache invalidation method ${propertyName}:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Performance monitoring decorator
 */
export function Monitor(options: { logSlowQueries?: boolean; threshold?: number } = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const threshold = options.threshold || 1000; // 1 second default
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const className = this.constructor.name;
      
      try {
        const result = await method.apply(this, args);
        const executionTime = Date.now() - startTime;
        
        if (options.logSlowQueries && executionTime > threshold) {
          console.warn(`Slow method detected: ${className}.${propertyName} took ${executionTime}ms`);
        }
        
        return result;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        console.error(`Method ${className}.${propertyName} failed after ${executionTime}ms:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

