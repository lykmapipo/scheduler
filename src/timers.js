import { isEmpty } from 'lodash';
import moment from 'moment-timezone';
import { CronTime } from 'cron';
import humanInterval from 'human-interval';

/**
 * @function momentFor
 * @name momentFor
 * @description Wrap a given date into moment instance
 * @param {Date} date Valid date instance
 * @param {string} [timezone=undefined] Valid timezone
 * @returns {object} moment instance
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * momentFor('* * * * * *');
 * //=> Moment<...>
 */
export const momentFor = (date, timezone) => {
  const tzMoment = moment(date);
  if (!isEmpty(timezone)) {
    tzMoment.tz(timezone);
  }
  return tzMoment;
};

/**
 * @function nextCronRunTimeFor
 * @name nextCronRunTimeFor
 * @description Compute next run time from a given cron pattern
 * @param {string} pattern Valid cron pattern
 * @param {Date} [lastRunAt= new Date()] Last run time
 * @param {string} [timezone=undefined] Valid timezone
 * @returns {Date|Error} Date of next run time or error
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * nextCronRunTimeFor('* * * * * *');
 * //=> Date
 */
export const nextCronRunTimeFor = (pattern, lastRunAt, timezone) => {
  // parse cron pattern
  const cronTime = new CronTime(pattern);

  // compute last run time moment
  const lastRun = momentFor(lastRunAt, timezone);

  // compute next run time moment
  // eslint-disable-next-line no-underscore-dangle
  let nextRun = cronTime._getNextDateFrom(lastRun);

  // return computed date
  nextRun = nextRun.toDate();
  return nextRun;
};

/**
 * @function nextHumanRunTimeFor
 * @name nextHumanRunTimeFor
 * @description Compute next run time from a given human interval pattern
 * @param {string} pattern Valid human interval pattern
 * @param {Date} [lastRunAt= new Date()] Last run time
 * @param {string} [timezone=undefined] Valid timezone
 * @returns {Date|Error} Date of next run time or error
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * nextHumanRunTimeFor('1 second');
 * //=> Date
 */
export const nextHumanRunTimeFor = (pattern, lastRunAt, timezone) => {
  // compute last run time moment
  const lastRun = momentFor(lastRunAt, timezone);

  // compute next run time moment
  let nextRun = momentFor(
    new Date(lastRun.valueOf() + humanInterval(pattern)),
    timezone
  );

  // return computed date
  nextRun = nextRun.toDate();
  return nextRun;
};
