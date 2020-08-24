/**
 * @function every
 * @name every
 * @description Schedule a function to execute at specified interval
 * @param {string} interval Valid schedule in `human-readable` or `cron` format
 * @param {string} name Valid unique schedule name
 * @param {Function} handler Valid function to invoke per recurrence rules
 * @param {object} [optns] Extra data and metadata passed when invoking handler
 * @author lally elias <lallyelias87@gmail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 *
 * every('2 seconds', 'sendEmail', (done) => { ... });
 *
 * every('*\/2 * * * * *', 'sendEmail', (done) => { ... });
 *
 */
export const every = (/* interval, name, handler, optns */) => {
  // TODO: define schedule
  // TODO: register schedule
};

export const start = () => {
  // TODO: ensure options
  // TODO: load path schedules
  // TODO: create redis clients
  // TODO: enable expiry notifications
  // TODO: subscribe for key expiry
  // TODO: schedule next run for all schedules
  // TODO: clearup/restore schedules
};

export const clear = () => {
  // TODO: obtain scheduler keys wildcard
  // TODO: clear schedules expiry keys(r:schedules:keys*)
  // TODO: clear schedules data(r:schedules:data*)
  // TODO: clear schedules locks(r:locks:schedules:data*)
  // TODO: reset schedule registry
};

export const stop = () => {
  // TODO: quit schdeduler clients(scheduler+listener)
  // TODO: quit other clients
};
