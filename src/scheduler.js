import { forEach, isEmpty, isFunction } from 'lodash';
import importAll from 'require-all';
import { mergeObjects } from '@lykmapipo/common';

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
 * @function loadPathSchedules
 * @name loadPathSchedules
 * @description Load schedules into registry
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
 * loadPathSchedules();
 * //=> { 'sendEmail': { ... }, ... }
 *
 * loadPathSchedules({ schedulesPath: `${process.cwd()}/schedules` });
 * //=> { 'sendEmail': { ... }, ... }
 */
export const loadPathSchedules = (optns) => {
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
