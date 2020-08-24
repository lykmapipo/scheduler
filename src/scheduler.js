import { forEach, isEmpty, isFunction } from 'lodash';
import importAll from 'require-all';
import { mergeObjects } from '@lykmapipo/common';

import { nextRunTimeFor } from './timers';
import {
  expiredSubscriptionKeyFor,
  createListener,
  createScheduler,
  scheduleExpiryKeyFor,
  withDefaults,
} from './redis';

// Internal schedules registry
let schedules = {};

/**
 * @function clearRegistry
 * @name clearRegistry
 * @description Clear schedules registry
 * @returns {object} Latest schedules registry
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @private
 * @example
 *
 * clearRegistry();
 * //=> {}
 */
export const clearRegistry = () => {
  schedules = {};
  return schedules;
};

/**
 * @function isValidSchedule
 * @name isValidSchedule
 * @description Check if provided object is valid schedule definition
 * @param {object} optns Valid schedule definition
 * @param {string} optns.name Valid schedule name
 * @param {string} optns.interval Valid recurrence pattern
 * @param {Function} optns.perform Valid function to invoke per each occurance
 * @param {object} [optns.data={}] Extra data to be passed to schedule handler
 * @returns {boolean} true if object is valid schedule definition else false
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * isValidSchedule({});
 * //=> false
 *
 * const name = 'sendEmail';
 * const interval = '2 seconds';
 * const perform = (data, done) => { return done(null); };
 * isValidSchedule({ name, interval, perform });
 * //=> true
 */
export const isValidSchedule = (optns) => {
  // no definition
  if (!optns) {
    return false;
  }

  // validate defininition
  const isValid =
    !isEmpty(optns.name) &&
    !isEmpty(optns.interval) &&
    isFunction(optns.perform); // TODO: check async, promise, fn(cb)

  // return validity
  return isValid;
};

/**
 * @function defineSchedule
 * @name defineSchedule
 * @description Register schedule in registry
 * @param {object} optns Valid schedule definition
 * @param {string} optns.name Valid schedule name
 * @param {string} optns.interval Valid recurrence pattern
 * @param {Function} optns.perform Valid function to invoke per each occurance
 * @param {object} [optns.data={}] Extra data to be passed to schedule handler
 * @returns {object} Latest schedules registry
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * defineSchedule({});
 * //=> {}
 *
 * const name = 'sendEmail';
 * const interval = '2 seconds';
 * const perform = (data, done) => { return done(null); };
 * defineSchedule({ name, interval, perform });
 * //=> { sendEmail: { ... }, ... }
 */
export const defineSchedule = (optns) => {
  // ensure valid schedule
  const isNotValid = !isValidSchedule(optns);
  if (isNotValid) {
    return schedules;
  }

  // ensure schedule not exists
  const exist = !!schedules[optns.name];
  if (exist) {
    return schedules;
  }

  // register schedule
  // TODO: compute extra metadata(ttl)
  schedules[optns.name] = mergeObjects(optns);

  // return latest schedules
  return schedules;
};

/**
 * @function loadSchedules
 * @name loadSchedules
 * @description Load schedules from path into registry
 * @param {object} optns Valid options
 * @param {string} [optns.schedulesPath] Valid schedules path
 * @returns {object} Latest schedules registry
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * loadSchedules();
 * //=> { 'sendEmail': { ... }, ... }
 *
 * loadSchedules({ schedulesPath: `${process.cwd()}/schedules` });
 * //=> { 'sendEmail': { ... }, ... }
 */
export const loadSchedules = (optns) => {
  // TODO: merge with default schedules path
  try {
    // load path schedules
    const schedulesFromPath = importAll(optns.schedulesPath);
    // register valid schedules
    forEach(schedulesFromPath, (scheduleFromPath, scheduleFilename) => {
      // ensure name from filename
      const scheduleFromPathWithName = mergeObjects(
        { name: scheduleFilename },
        scheduleFromPath
      );
      // register schedule
      defineSchedule(scheduleFromPathWithName);
    });
  } catch (error) {
    /* ignore */
  }

  // return latest schedules
  return schedules;
};

/**
 * @function isAlreadyScheduled
 * @name isAlreadyScheduled
 * @description Check if schedule exists and its ttl has not timeout
 * @param {object} optns Valid schedule definition
 * @param {string} optns.name Valid schedule name
 * @param {Function} done callback to invoke on success or error
 * @returns {boolean|Error} Whether schedule is active or error
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * const name = 'sendEmail';
 * const interval = '2 seconds';
 * const perform = (data, done) => { return done(null); };
 * isAlreadyScheduled({ name }, (error, isScheduled) => { ... });
 */
export const isAlreadyScheduled = (optns, done) => {
  // ensure redis schedule client
  const redisClient = createScheduler(optns);

  // derive schedule expiry key
  const scheduleExpiryKey = scheduleExpiryKeyFor(optns);

  // check if key exists and has expiry set
  return redisClient.pttl(scheduleExpiryKey, (error, ttl) => {
    // back-off on error
    if (error) {
      return done(error);
    }
    // check expiry state
    const isExpired = !!(ttl && ttl > 0);
    return done(null, isExpired);
  });
};

/**
 * @function scheduleNextRun
 * @name scheduleNextRun
 * @description Compute and set schedule next expiry time
 * @param {object} optns Valid schedule definition
 * @param {string} optns.name Valid schedule name
 * @param {string} optns.interval Valid recurrence interval
 * @param {Date} [optns.lastRunAt=new Date()] Valid last run time
 * @param {string} [optns.timezone] Valid timezone
 * @param {Function} done callback to invoke on success or error
 * @returns {Error|*} error or schedule results
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * const name = 'sendEmail';
 * const interval = '2 seconds';
 * const lastRunAt = new Date();
 * const perform = (data, done) => { return done(null, null); };
 * scheduleNextRun({ name, interval, lastRunAt }, (error, results) => { ... });
 */
export const scheduleNextRun = (optns, done) => {
  // ensure options
  const now = new Date();
  const { interval, lastRunAt = now, timezone } = withDefaults(optns);

  // ensure redis schedule client
  const redisClient = createScheduler(optns);

  // derive schedule expiry key
  const scheduleExpiryKey = scheduleExpiryKeyFor(optns);

  // compute next run time
  const nextRunAt = nextRunTimeFor(interval, lastRunAt, timezone);
  const scheduleDelay = nextRunAt.getTime() - now.getTime();

  // schedule next expiry
  return redisClient.set(
    scheduleExpiryKey,
    scheduleExpiryKey,
    'PX',
    scheduleDelay,
    'NX',
    (error /* , results */) => {
      if (error) {
        return done(error);
      }
      const results = { nextRunAt };
      return done(null, results);
    }
  );
};

/**
 * @function subscribeForScheduleExpiry
 * @name subscribeForScheduleExpiry
 * @description Subscribe for key expired events and invoke given hanlder
 * @param {object} optns Valid options
 * @param {string} [optns.db=0] Valid redis database number
 * @param {Function} optns.handleExpiredKey Valid key expired hanlder
 * @param {Function} done callback to invoke on success or error
 * @returns {Error|*} error or schedule results
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * const handleExpiredKey = (channel, expiredKey) => { ... };
 * subscribeForScheduleExpiry({ handleExpiredKey }, (err, result) => { ... });
 */
export const subscribeForScheduleExpiry = (optns, done) => {
  // ensure options
  const { handleExpiredKey } = withDefaults(optns);

  // ensure redis listener client
  const redisClient = createListener(optns);

  // derive expiry events subscription key
  const expiredSubscriptionKey = expiredSubscriptionKeyFor(optns);

  // listen for key expired events
  redisClient.on('message', (channel, expiredKey) => {
    // TODO: test if the expired key is for scheduler
    // TODO:events.emit('schedule error', new Error('Unknown expiry key'))

    // safe invoke key expired event handler
    try {
      handleExpiredKey(channel, expiredKey);
    } catch (error) {
      /* ignore */
      // TODO:events.emit('schedule error', error);
    }
  });

  // TODO: enableExpiryNotifications(optns, done);
  // TODO: const cb = wrapCallback(done);
  // subscribe for key expired events
  return redisClient.subscribe(expiredSubscriptionKey, done);
};

/**
 * @function invokeSchedule
 * @name invokeSchedule
 * @description Invoke schedule to perform the work
 * @param {object} schedule Valid schedule definition
 * @param {Function} done callback to invoke on success or error
 * @returns {Error|*} error or schedule results
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * const name = 'sendEmail';
 * const interval = '2 seconds';
 * const perform = (data, done) => { return done(null, null); };
 * invokeSchedule({ name, interval, perform }, (error, results) => { ... });
 */
export const invokeSchedule = (schedule, done) => {
  // ensure valid schedule
  const isNotValid = !isValidSchedule(schedule);
  if (isNotValid) {
    return done(new Error('Invalid schedule definition'));
  }

  // TODO: handle promises/async perform and their return values
  // TODO: save invoke results
  // TODO: pass runtime metadata with data
  // try invoke schedule.perform
  try {
    const { data = {}, perform } = schedule;
    return perform(data, done);
  } catch (error) {
    return done(error);
  }
};
