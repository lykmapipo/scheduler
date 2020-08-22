import { forEach } from 'lodash';
import { compact, mergeObjects } from '@lykmapipo/common';
import { getString } from '@lykmapipo/env';
import {
  withDefaults as withRedisCommonDefaults,
  keyFor,
  createRedisClient,
  quitRedisClient,
  quit as quitRedisClients,
  config,
} from '@lykmapipo/redis-common';

// local refs
let scheduler; // scheduler client
let listener; // expiry event client

/**
 * @function withDefaults
 * @name withDefaults
 * @description Merge provided options with defaults.
 * @param {object} [optns] provided options
 * @param {string} [optns.url='redis://127.0.0.1:6379'] Valid redis url
 * @param {string} [optns.prefix='r'] Valid redis key prefix
 * @param {string} [optns.separator=':'] Valid redis key separator
 * @param {string} [optns.eventPrefix='events'] Valid redis events key prefix
 * @param {number} [optns.lockTtl=1000] Valid redis ttl in milliseconds
 * @param {string} [optns.schedulePrefix='schedules'] Valid redis schedules key prefix
 * @param {string} [optns.schedulesPath='`${process.cwd()}/schedules`'] Valid schedules path
 * @returns {object} merged options
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * const optns = { url: process.env.REDIS_URL, prefix: 'r', ... };
 * const options = withDefaults(optns);
 *
 * // => { url: ...}
 *
 */
export const withDefaults = (optns) => {
  // defaults
  const defaults = withRedisCommonDefaults({
    schedulePrefix: getString('REDIS_SCHEDULE_PREFIX', 'schedules'),
    schedulesPath: getString(
      'REDIS_SCHEDULE_PATH',
      `${process.cwd()}/schedules`
    ),
  });

  // merge and compact with defaults
  const options = compact(mergeObjects(defaults, optns));

  // return
  return options;
};

/**
 * @function expiredSubscriptionKeyFor
 * @name expiredSubscriptionKeyFor
 * @description Obtain key to subscribe on key expired events
 * @param {object} [optns] provided options
 * @param {string} [optns.db=0] Valid redis database number
 * @returns {string} key expires event subscription key
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * expiredSubscriptionKeyFor();
 * //=> __keyevent@0__:expired
 *
 * expiredSubscriptionKeyFor({ db:2 });
 * //=> __keyevent@2__:expired
 *
 */
export const expiredSubscriptionKeyFor = (optns) => {
  // obtain redis db
  const { db } = withDefaults(optns);
  // derive expired events subscription key
  const key = `__keyevent@${db}__:expired`;
  // return expired events subscription key
  return key;
};

/**
 * @function scheduleExpiryKeyFor
 * @name scheduleExpiryKeyFor
 * @description Generate schedule expiry key
 * @param {object} [optns] provided options
 * @param {string} [optns.name] Valid schedule name
 * @returns {string} schedule expiry key
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * scheduleExpiryKeyFor('sendEmail');
 * // => 'r:schedules:sendEmail';
 *
 * scheduleExpiryKeyFor('send', 'email');
 * // => 'r:schedules:send:email'
 *
 */
export const scheduleExpiryKeyFor = (optns) => {
  // obtain options
  const { schedulePrefix, name } = withDefaults(optns);

  // collect key parts
  const parts = compact([schedulePrefix, name]);

  // derive schedule expiry key
  const scheduleExpiryKey = keyFor(...parts);

  // return schedule expiry key
  return scheduleExpiryKey;
};

/**
 * @function scheduleDataKeyFor
 * @name scheduleDataKeyFor
 * @description Generate lock key
 * @param {object} [optns] provided options
 * @param {string} [optns.name] Valid schedule name
 * @returns {string} schedule expiry key
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * scheduleDataKeyFor('sendEmail');
 * // => 'r:schedules:data:sendEmail';
 *
 * scheduleDataKeyFor('send', 'email');
 * // => 'r:schedules:data:send:email'
 *
 */
export const scheduleDataKeyFor = (optns) => {
  // obtain options
  const { schedulePrefix, name } = withDefaults(optns);

  // collect key parts
  const parts = compact([schedulePrefix, 'data', name]);

  // derive schedule data key
  const scheduleDataKey = keyFor(...parts);

  // return schedule key
  return scheduleDataKey;
};

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

  // quit other redis client
  const redisClients = quitRedisClients();

  // quit all clients
  const clients = [scheduler, listener];
  forEach(clients, (redisClient) => quitRedisClient(redisClient));

  // reset clients
  scheduler = null;
  listener = null;

  // return redis clients state
  return { ...redisClients, scheduler, listener };
};
