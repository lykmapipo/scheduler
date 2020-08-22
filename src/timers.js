import { isEmpty } from 'lodash';
import moment from 'moment-timezone';
import { CronTime } from 'cron';
import humanInterval from 'human-interval';
import { tryCatch } from '@lykmapipo/common';

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
 * momentFor(new Date());
 * //=> Moment<...>
 *
 * momentFor(new Date(), 'Africa/Nairobi');
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
 *
 * Note!: Use this when you want `time-based scheduling`.
 *
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
 * nextCronRunTimeFor('* * * * * *', new Date());
 * //=> Date
 *
 * nextCronRunTimeFor('* * * * * *', new Date(), 'Africa/Nairobi');
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

  // ensure positive next run time
  const now = new Date();
  const isBefore = nextRun.diff(momentFor(now, timezone)) <= 0;
  if (isBefore) {
    nextRun = nextCronRunTimeFor(pattern, now, timezone);
  }

  // return computed date
  nextRun = nextRun.toDate();
  return nextRun;
};

/**
 * @function nextHumanRunTimeFor
 * @name nextHumanRunTimeFor
 * @description Compute next run time from a given human interval pattern
 *
 * Note!: Use this when you want `interval-based scheduling`.
 *
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
 * nextHumanRunTimeFor('1 second', new Date());
 * //=> Date
 *
 * nextHumanRunTimeFor('1 second', new Date(), 'Africa/Nairobi');
 * //=> Date
 */
export const nextHumanRunTimeFor = (pattern, lastRunAt, timezone) => {
  // parse cron pattern
  const humanTime = humanInterval(pattern);
  if (!humanTime) {
    throw new Error('Invalid Human Interval Pattern');
  }

  // compute last run time moment
  const lastRun = momentFor(lastRunAt, timezone);

  // compute next run time moment
  let nextRun = momentFor(new Date(lastRun.valueOf() + humanTime), timezone);

  // ensure positive next run time
  const now = new Date();
  const isBefore = nextRun.diff(momentFor(now, timezone)) <= 0;
  if (isBefore) {
    nextRun = nextHumanRunTimeFor(pattern, now, timezone);
  }

  // return computed date
  nextRun = nextRun.toDate();
  return nextRun;
};

/**
 * @function nextRunTimeFor
 * @name nextRunTimeFor
 * @description Compute next run time from a given pattern
 * @param {string} pattern Valid recurrence interval
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
 * nextRunTimeFor('1 second', new Date());
 * //=> Date
 *
 * nextRunTimeFor('1 second', new Date(), 'Africa/Nairobi');
 * //=> Date
 *
 * nextRunTimeFor('* * * * * *', new Date());
 * //=> Date
 *
 * nextRunTimeFor('* * * * * *', new Date(), 'Africa/Nairobi');
 * //=> Date
 */
export const nextRunTimeFor = (pattern, lastRunAt, timezone) => {
  // try from cron pattern
  let nextRun = tryCatch(
    () => nextCronRunTimeFor(pattern, lastRunAt, timezone),
    undefined
  );

  // try from human interval pattern
  if (!nextRun) {
    nextRun = tryCatch(
      () => nextHumanRunTimeFor(pattern, lastRunAt, timezone),
      undefined
    );
  }

  // TODO: ensure nextRun - lastRun != 0
  // return computed date
  return nextRun;
};
