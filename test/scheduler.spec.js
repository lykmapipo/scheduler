import { expect } from '@lykmapipo/test-helpers';
import { set, clear } from '@lykmapipo/redis-common';

import {
  expiredSubscriptionKeyFor,
  scheduleExpiryKeyFor,
  quit,
} from '../src/redis';

import {
  clearRegistry,
  isValidSchedule,
  defineSchedule,
  loadSchedules,
  isAlreadyScheduled,
  scheduleNextRun,
  subscribeForScheduleExpiry,
  invokeSchedule,
} from '../src/scheduler';

describe('registry', () => {
  before((done) => clear(done));

  before(() => {
    clearRegistry();
  });

  beforeEach(() => {
    clearRegistry();
  });

  it('should validate schedules', () => {
    expect(isValidSchedule).to.be.a('function');
    expect(isValidSchedule.name).to.be.equal('isValidSchedule');
    expect(isValidSchedule.length).to.be.equal(1);

    const name = 'sendEmail';
    const interval = '2 seconds';
    const perform = (data, done) => done(null);

    expect(isValidSchedule(null)).to.be.false;
    expect(isValidSchedule(undefined)).to.be.false;
    expect(isValidSchedule({})).to.be.false;
    expect(isValidSchedule('')).to.be.false;
    expect(isValidSchedule(' ')).to.be.false;
    expect(isValidSchedule({ name })).to.be.false;
    expect(isValidSchedule({ interval })).to.be.false;
    expect(isValidSchedule({ perform })).to.be.false;
    expect(isValidSchedule({ name, interval })).to.be.false;
    expect(isValidSchedule({ name, perform })).to.be.false;
    expect(isValidSchedule({ interval, perform })).to.be.false;
    expect(isValidSchedule({ name, interval, perform })).to.be.true;
  });

  it('should define schedule', () => {
    expect(defineSchedule).to.be.a('function');
    expect(defineSchedule.name).to.be.equal('defineSchedule');
    expect(defineSchedule.length).to.be.equal(1);

    const name = 'sendEmail';
    const interval = '2 seconds';
    const perform = (data, done) => done(null);

    expect(defineSchedule(null)).to.be.empty;
    expect(defineSchedule(undefined)).to.be.empty;
    expect(defineSchedule({})).to.be.empty;
    expect(defineSchedule('')).to.be.empty;
    expect(defineSchedule(' ')).to.be.empty;
    expect(defineSchedule({ name })).to.be.empty;
    expect(defineSchedule({ interval })).to.be.empty;
    expect(defineSchedule({ perform })).to.be.empty;
    expect(defineSchedule({ name, interval })).to.be.empty;
    expect(defineSchedule({ name, perform })).to.be.empty;
    expect(defineSchedule({ interval, perform })).to.be.empty;
    expect(defineSchedule({ name, interval, perform })).to.not.be.empty;

    const schedules = defineSchedule({ name, interval, perform });
    expect(schedules.sendEmail).to.exist;
    expect(schedules.sendEmail.name).to.be.equal(name);
    expect(schedules.sendEmail.interval).to.be.equal(interval);
    expect(schedules.sendEmail.perform).to.exist.and.be.a('function');
  });

  it('should load path schedules', () => {
    const schedules = loadSchedules({
      schedulesPath: `${__dirname}/fixtures/schedules`,
    });

    // with full definition
    expect(schedules.sendReport).to.exist;
    expect(schedules.sendReport.name).to.be.equal('sendReport');
    expect(schedules.sendReport.interval).to.be.equal('2 seconds');
    expect(schedules.sendReport.perform).to.exist.and.be.a('function');

    // with filename & definition
    expect(schedules.sendInvoice).to.exist;
    expect(schedules.sendInvoice.name).to.be.equal('sendInvoice');
    expect(schedules.sendInvoice.interval).to.be.equal('2 seconds');
    expect(schedules.sendInvoice.perform).to.exist.and.be.a('function');

    // with node style
    expect(schedules.sendAlert).to.exist;
    expect(schedules.sendAlert.name).to.be.equal('sendAlert');
    expect(schedules.sendAlert.interval).to.be.equal('2 seconds');
    expect(schedules.sendAlert.perform).to.exist.and.be.a('function');
  });

  after((done) => clear(done));

  after(() => {
    clearRegistry();
  });
});

describe('invoke', () => {
  before((done) => clear(done));

  before(() => {
    clearRegistry();
  });

  it('should throw if invalid schedule given', (done) => {
    invokeSchedule({}, (error) => {
      expect(error).to.exist;
      expect(error.message).to.be.equal('Invalid schedule definition');
      done();
    });
  });

  it('should handle schedule perform sync error', (done) => {
    const name = 'sendEmail';
    const interval = '2 seconds';
    const perform = () => {
      throw new Error('Failed');
    };

    invokeSchedule({ name, interval, perform }, (error) => {
      expect(error).to.exist;
      expect(error.message).to.be.equal('Failed');
      done();
    });
  });

  it('should handle schedule perform async error', (done) => {
    const name = 'sendEmail';
    const interval = '2 seconds';
    const perform = (data, cb) => {
      return cb(new Error('Failed'));
    };

    invokeSchedule({ name, interval, perform }, (error) => {
      expect(error).to.exist;
      expect(error.message).to.be.equal('Failed');
      done();
    });
  });

  it('should invoke schedule', (done) => {
    const name = 'sendEmail';
    const interval = '2 seconds';
    const perform = (data, cb) => {
      return cb(null, {});
    };

    invokeSchedule({ name, interval, perform }, (error, results) => {
      expect(error).to.not.exist;
      expect(results).to.be.eql({});
      done();
    });
  });

  after((done) => clear(done));

  after(() => {
    clearRegistry();
  });
});

describe('schedule', () => {
  before(() => {
    clearRegistry();
  });

  beforeEach((done) => clear(done));

  it('should check if schedule already exists', (done) => {
    expect(isAlreadyScheduled).to.be.a('function');
    expect(isAlreadyScheduled.name).to.be.equal('isAlreadyScheduled');
    expect(isAlreadyScheduled.length).to.be.equal(2);

    const name = 'sendEmail';
    const interval = '2 seconds';
    const perform = (data, cb) => {
      return cb(new Error('Failed'));
    };

    isAlreadyScheduled({ name, interval, perform }, (error, isScheduled) => {
      expect(error).to.not.exist;
      expect(isScheduled).to.be.false;
      done(error, isScheduled);
    });
  });

  it('should check if schedule exist and expiry not set', (done) => {
    const name = 'sendEmail';
    const interval = '2 seconds';
    const perform = (data, cb) => {
      return cb(new Error('Failed'));
    };
    const expiryKey = scheduleExpiryKeyFor({ name }).replace('r:', '');
    set(expiryKey, expiryKey, (/* error, results */) => {
      isAlreadyScheduled({ name, interval, perform }, (error, isScheduled) => {
        expect(error).to.not.exist;
        expect(isScheduled).to.be.false;
        done(error, isScheduled);
      });
    });
  });

  it('should check if schedule exist and has not expired', (done) => {
    const name = 'sendEmail';
    const interval = '2 seconds';
    const perform = (data, cb) => {
      return cb(new Error('Failed'));
    };
    const delay = 500;
    const expiryKey = scheduleExpiryKeyFor({ name }).replace('r:', '');
    set(expiryKey, expiryKey, 'PX', delay, 'NX', (/* error, results */) => {
      isAlreadyScheduled({ name, interval, perform }, (error, isScheduled) => {
        expect(error).to.not.exist;
        expect(isScheduled).to.be.true;
        done(error, isScheduled);
      });
    });
  });

  it('should check if schedule exist and has expired', (done) => {
    const name = 'sendEmail';
    const interval = '2 seconds';
    const perform = (data, cb) => {
      return cb(new Error('Failed'));
    };
    const delay = 500;
    const expiryKey = scheduleExpiryKeyFor({ name }).replace('r:', '');
    set(expiryKey, expiryKey, 'PX', delay, 'NX', (/* error, results */) => {
      setTimeout(() => {
        isAlreadyScheduled(
          { name, interval, perform },
          (error, isScheduled) => {
            expect(error).to.not.exist;
            expect(isScheduled).to.be.false;
            done(error, isScheduled);
          }
        );
      }, 1000);
    });
  });

  it('should schedule next run from human interval', (done) => {
    const name = 'sendEmail';
    const interval = '1 second';
    const lastRunAt = new Date();
    const perform = (data, cb) => {
      return cb(new Error('Failed'));
    };
    scheduleNextRun(
      { name, interval, lastRunAt, perform },
      (error, { nextRunAt }) => {
        expect(error).to.not.exist;
        expect(nextRunAt).to.exist;
        expect(nextRunAt.getTime() - lastRunAt.getTime()).to.equal(1000);
        isAlreadyScheduled({ name, interval, perform }, (err, isScheduled) => {
          expect(err).to.not.exist;
          expect(isScheduled).to.be.true;
          done(err, isScheduled);
        });
      }
    );
  });

  it('should schedule next run from cron interval', (done) => {
    const name = 'sendEmail';
    const interval = '* * * * * *';
    const lastRunAt = new Date();
    const perform = (data, cb) => {
      return cb(new Error('Failed'));
    };
    scheduleNextRun(
      { name, interval, lastRunAt, perform },
      (error, { nextRunAt }) => {
        expect(error).to.not.exist;
        expect(nextRunAt).to.exist;
        expect(nextRunAt.getSeconds()).to.equal(lastRunAt.getSeconds() + 1);
        isAlreadyScheduled({ name, interval, perform }, (err, isScheduled) => {
          expect(err).to.not.exist;
          expect(isScheduled).to.be.true;
          done(err, isScheduled);
        });
      }
    );
  });

  after((done) => clear(done));

  after(() => {
    clearRegistry();
  });
});

describe('subscribe', () => {
  before(() => {
    clearRegistry();
  });

  beforeEach((done) => clear(done));

  it('should occur successfully', (done) => {
    expect(subscribeForScheduleExpiry).to.be.a('function');
    expect(subscribeForScheduleExpiry.name).to.be.equal(
      'subscribeForScheduleExpiry'
    );
    expect(subscribeForScheduleExpiry.length).to.be.equal(2);

    const handleExpiredKey = (/* channel, expiredKey */) => {};
    const optns = { handleExpiredKey };
    subscribeForScheduleExpiry(optns, (error, results) => {
      expect(error).to.not.exist;
      expect(results).to.exist;
      expect(results).to.be.equal(expiredSubscriptionKeyFor(optns));
      done(error, results);
    });
  });

  after((done) => clear(done));

  after(() => {
    clearRegistry();
  });

  after(() => quit());
});
