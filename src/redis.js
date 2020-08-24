import { forEach, isFunction, reduce } from 'lodash';
import { compact, mergeObjects, wrapCallback } from '@lykmapipo/common';
import { getString } from '@lykmapipo/env';
import {
  withDefaults as withRedisCommonDefaults,
  keyFor,
  createRedisClient,
  quitRedisClient,
  quit as quitRedisClients,
  config,
  lock,
} from '@lykmapipo/redis-common';

// local refs
let scheduler; // scheduler client
let listener; // expiry event client

/**
 * @function withDefaults
 * @name withDefaults
 * @description Merge provided options with defaults.
 * @param {object} [optns] Provided options
 * @param {string} [optns.url='redis://127.0.0.1:6379'] Valid redis url
 * @param {number} [optns.db=0] Valid redis database number
 * @param {string} [optns.prefix='r'] Valid redis key prefix
 * @param {string} [optns.separator=':'] Valid redis key separator
 * @param {string} [optns.notifyKeyspaceEvents='xE'] Enabled keyspace events
 * @param {string} [optns.eventPrefix='events'] Valid redis events key prefix
 * @param {number} [optns.lockTtl=1000] Valid redis lock ttl in milliseconds
 * @param {string} [optns.schedulePrefix='schedules'] Valid schedules key prefix
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
 * const optns = { prefix: 'r', ... };
 * const options = withDefaults(optns);
 * //=> { prefix: 'r', url: ...}
 *
 */
export const withDefaults = (optns) => {
  // prepare defaults from .env and well known
  const defaults = withRedisCommonDefaults({
    notifyKeyspaceEvents: getString('REDIS_NOTIFY_KEYSPACE_EVENTS', 'xE'),
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
 * @function expiredEventsKeyFor
 * @name expiredEventsKeyFor
 * @description Derive redis subscription key for key expired events
 * @param {object} [optns] Provided options
 * @param {number} [optns.db=0] Valid redis database number
 * @returns {string} Key expired events subscription key
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * expiredEventsKeyFor();
 * //=> __keyevent@0__:expired
 *
 * expiredEventsKeyFor({ db: 2 });
 * //=> __keyevent@2__:expired
 *
 */
export const expiredEventsKeyFor = (optns) => {
  // obtain redis db
  const { db } = withDefaults(optns);
  // derive key expired events subscription key
  const key = `__keyevent@${db}__:expired`;
  // return key expired events subscription key
  return key;
};

/**
 * @function expiryKeyFor
 * @name expiryKeyFor
 * @description Generate schedule expiry key
 * @param {object} optns Provided options
 * @param {string} optns.name Valid schedule name
 * @returns {string} schedule expiry key
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * expiryKeyFor({ name: 'sendEmail' });;
 * //=> 'r:schedules:keys:sendEmail';
 *
 */
export const expiryKeyFor = (optns) => {
  // obtain options
  const { schedulePrefix, name } = withDefaults(optns);

  // collect key parts
  const parts = compact([schedulePrefix, 'keys', name]);

  // derive schedule expiry key
  const scheduleExpiryKey = keyFor(...parts);

  // return schedule expiry key
  return scheduleExpiryKey;
};

/**
 * @function dataKeyFor
 * @name dataKeyFor
 * @description Generate schedule data key
 * @param {object} optns Provided options
 * @param {string} optns.name Valid schedule name
 * @returns {string} schedule data key
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * expiryKeyFor({ name: 'sendEmail' });;
 * //=> 'r:schedules:data:sendEmail';
 *
 */
export const dataKeyFor = (optns) => {
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
 * @description Create redis client for scheduling
 * @param {object} optns Valid redis options
 * @param {string} [optns.url='redis://127.0.0.1:6379'] Valid redis url
 * @param {number} [optns.db=0] Valid redis database number
 * @param {boolean} [optns.recreate=false] Whether to create new client
 * @returns {object} redis client for scheduling
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * const scheduler = createScheduler();
 * //=> RedisClient { ... }
 *
 * const scheduler = createScheduler({ recreate: true });
 * //=> RedisClient { ... }
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
 * @param {object} optns Valid redis options
 * @param {string} [optns.url='redis://127.0.0.1:6379'] Valid redis url
 * @param {number} [optns.db=0] Valid redis database number
 * @param {boolean} [optns.recreate=false] Whether to create new client
 * @returns {object} redis client for schedule listening
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * const listener = createListener();
 * //=> RedisClient { ... }
 *
 * const listener = createListener({ recreate: true });
 * //=> RedisClient { ... }
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
 * @function enableKeyspaceEvents
 * @name enableKeyspaceEvents
 * @description Enable redis keyspace notifications
 * @param {object} [optns] Provided options
 * @param {string} [optns.url='redis://127.0.0.1:6379'] Valid redis url
 * @param {number} [optns.db=0] Valid redis database number
 * @param {string} [optns.notifyKeyspaceEvents='xE'] Enabled keyspace events
 * @param {Function} [done] callback to invoke on success or failure
 * @returns {string} notify keyspace notifications ack
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * const notifyKeyspaceEvents = 'xE';
 * const optns = { notifyKeyspaceEvents };
 * enableKeyspaceEvents(optns, (error, results) => { ... });
 * //=> 'OK'
 *
 */
export const enableKeyspaceEvents = (optns, done) => {
  // ensure options
  const { notifyKeyspaceEvents } = isFunction(optns)
    ? withDefaults()
    : withDefaults(optns);
  const cb = isFunction(optns) ? wrapCallback(optns) : wrapCallback(done);

  // TODO: use setConfig(optns, key, value, done);
  // set keyspace notification config
  return config('SET', 'notify-keyspace-events', notifyKeyspaceEvents, cb);
};

/**
 * @function isKeyspaceEventsEnabled
 * @name isKeyspaceEventsEnabled
 * @description Check if redis keyspace notifications enabled
 * @param {object} [optns] Provided options
 * @param {string} [optns.url='redis://127.0.0.1:6379'] Valid redis url
 * @param {number} [optns.db=0] Valid redis database number
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
 * const optns = {};
 * isKeyspaceEventsEnabled(optns, (error, results) => { ... });
 * //=> true
 *
 */
export const isKeyspaceEventsEnabled = (optns, done) => {
  // ensure options
  const { notifyKeyspaceEvents } = isFunction(optns)
    ? withDefaults()
    : withDefaults(optns);
  const cb = isFunction(optns) ? wrapCallback(optns) : wrapCallback(done);

  // get keyspace notification config
  return config('GET', 'notify-keyspace-events', (error, results) => {
    const enabled = !!(
      results &&
      results[1] &&
      reduce(
        notifyKeyspaceEvents.split(''),
        (has, part) => results[1].indexOf(part) > -1 && has,
        true
      )
    );
    return cb(error, enabled);
  });
};

/**
 * @function acquireScheduleLock
 * @name acquireScheduleLock
 * @description Acquire lock to register schedule
 * @param {object} optns Provided options
 * @param {string} optns.name Valid schedule name
 * @param {number} [optns.lockTtl=1000] Valid schedule lock ttl in milliseconds
 * @param {Function} done callback to invoke on success or error
 * @returns {Error|Function} error or unlock callback
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * const name = 'sendEmail';
 * const lockTtl = 1000
 * const optns = { name, lockTtl };
 * acquireScheduleLock(optns, (error, unlock) => { ... });
 */
export const acquireScheduleLock = (optns, done) => {
  // ensure options
  const { name, lockTtl, schedulePrefix, separator } = withDefaults(optns);

  // derive schedule key
  const key = [schedulePrefix, 'next', name].join(separator);

  // acquire lock
  return lock(key, lockTtl, done);
};

/**
 * @function acquireWorkLock
 * @name acquireWorkLock
 * @description Acquire lock to invoke schedule
 * @param {object} optns Provided options
 * @param {string} optns.name Valid schedule name
 * @param {number} [optns.lockTtl=1000] Valid schedule lock ttl in milliseconds
 * @param {Function} done callback to invoke on success or error
 * @returns {Error|Function} error or unlock callback
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * const name = 'sendEmail';
 * const lockTtl = 1000
 * const optns = { name, lockTtl };
 * acquireWorkLock(optns, (error, unlock) => { ... });
 */
export const acquireWorkLock = (optns, done) => {
  // ensure options
  const { name, lockTtl, schedulePrefix, separator } = withDefaults(optns);

  // derive schedule work key
  const key = [schedulePrefix, 'work', name].join(separator);

  // acquire schedule work lock
  return lock(key, lockTtl, done);
};

/**
 * @function quit
 * @name quit
 * @description Quit and restore redis clients states
 * @returns {object} redis clients state
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
  // TODO: support optns
  // TODO: client.end if callback passed
  // TODO: disableKeyspaceEvents??

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
