import { forEach } from 'lodash';
import {
  withDefaults,
  createRedisClient,
  quitRedisClient,
  config,
} from '@lykmapipo/redis-common';

// local refs
let scheduler; // scheduler client
let listener; // expiry event client

/**
 * @function createScheduler
 * @name createScheduler
 * @description Create redis client for registering schedules
 * @param {object} optns valid options
 * @param {string} [optns.url='redis://127.0.0.1:6379'] valid redis url
 * @param {boolean} [optns.recreate=false] whether to create new client
 * @param {string} [optns.prefix='r'] client key prefix
 * @returns {object} redis client
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * const scheduler = createScheduler();
 *
 * const scheduler = createScheduler({ recreate: true });
 *
 */
export const createScheduler = (optns) => {
  // obtain options
  const { recreate, ...options } = withDefaults(optns);

  // ref scheduler
  let redisClient = scheduler;

  // obtain or create redis scheduler
  if (recreate || !redisClient) {
    redisClient = createRedisClient(options);
    scheduler = scheduler || redisClient;
  }

  // return redis schedule client
  return redisClient;
};

/**
 * @function createListener
 * @name createListener
 * @description Create redis client for listening schedules
 * @param {object} optns valid options
 * @param {string} [optns.url='redis://127.0.0.1:6379'] valid redis url
 * @param {boolean} [optns.recreate=false] whether to create new client
 * @param {string} [optns.prefix='r'] client key prefix
 * @returns {object} redis client
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * const listener = createListener();
 *
 * const listener = createListener({ recreate: true });
 *
 */
export const createListener = (optns) => {
  // obtain options
  const { recreate, ...options } = withDefaults(optns);

  // ref listener
  let redisClient = listener;

  // obtain or create redis listener
  if (recreate || !redisClient) {
    redisClient = createRedisClient(options);
    listener = listener || redisClient;
  }

  // return redis listener client
  return redisClient;
};

/**
 * @function enableExpiryNotifications
 * @name enableExpiryNotifications
 * @description Enable redis expiry keys notifications
 * @param {Function} [done] callback to invoke on success or failure
 * @returns {string} Expiry notification ack
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * enableExpiryNotifications();
 * enableExpiryNotifications((error, results) => { ... });
 *
 */
export const enableExpiryNotifications = (done) => {
  // TODO: use env REDIS_NOTIFY_KEYSPACE_EVENTS=xE
  return config('SET', 'notify-keyspace-events', 'xE', done);
};

/**
 * @function isExpiryNotificationsEnabled
 * @name isExpiryNotificationsEnabled
 * @description Check if redis expiry keys notifications enabled
 * @param {Function} [done] callback to invoke on success or failure
 * @returns {boolean} true if enabled else false
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * isExpiryNotificationsEnabled((error, results) => { ... });
 *
 */
export const isExpiryNotificationsEnabled = (done) => {
  return config('GET', 'notify-keyspace-events', (error, results) => {
    const enabled = !!(
      results &&
      results[1] &&
      results[1].indexOf('E') > -1 &&
      results[1].indexOf('x') > -1
    );
    return done(error, enabled);
  });
};

/**
 * @function quit
 * @name quit
 * @description Quit and restore redis clients states
 * @returns {object} redis clients
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * quit();
 *
 */
export const quit = () => {
  // TODO: client.end if callback passed
  // TODO: quit other redis client

  // quit all clients
  const clients = [scheduler, listener];
  forEach(clients, (redisClient) => quitRedisClient(redisClient));

  // reset clients
  scheduler = null;
  listener = null;

  // return redis client states
  return { scheduler, listener };
};
