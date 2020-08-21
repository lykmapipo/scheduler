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
export const every = (/* interval, name, handler, optns */) => {};

export const start = () => {};
export const clear = () => {};
export const stop = () => {};
