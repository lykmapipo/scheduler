import { isEmpty, isFunction } from 'lodash';

// local refs
// let schedules; // schedules registry

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
 * const perform = () => { ... };
 * isValidSchedule({ name, interval, perform });
 * //=> true
 */
export const isValidSchedule = (optns) => {
  // no definition
  if (!optns) return false;

  // validate defininition
  const isValid =
    !isEmpty(optns.name) &&
    !isEmpty(optns.interval) &&
    isFunction(optns.perform);

  // return validity
  return isValid;
};

export const defineSchedule = () => {};

export const loadSchedules = () => {};
