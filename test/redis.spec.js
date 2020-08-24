import { expect } from '@lykmapipo/test-helpers';
import { clear } from '@lykmapipo/redis-common';
import {
  withDefaults,
  expiredEventsKeyFor,
  expiryKeyFor,
  dataKeyFor,
  createScheduler,
  createListener,
  enableKeyspaceEvents,
  isKeyspaceEventsEnabled,
  acquireScheduleLock,
  quit,
} from '../src/redis';

describe('redis', () => {
  before((done) => clear(done));

  it('should provide default options', () => {
    expect(withDefaults).to.exist.and.be.a('function');

    const options = withDefaults();
    expect(options).to.exist.and.be.an('object');
    expect(options.url).to.exist.and.be.equal('redis://127.0.0.1:6379');
    expect(options.db).to.exist.and.be.equal(0);
    expect(options.prefix).to.exist.and.be.equal('r');
    expect(options.separator).to.exist.and.be.equal(':');
    expect(options.notifyKeyspaceEvents).to.exist.and.be.equal('xE');
    expect(options.eventPrefix).to.exist.and.be.equal('events');
    expect(options.lockPrefix).to.exist.and.be.equal('locks');
    expect(options.lockTtl).to.exist.and.be.equal(1000);
    expect(options.schedulePrefix).to.exist.and.be.equal('schedules');
    expect(options.schedulesPath).to.exist.and.not.be.empty;
  });

  it('should derive key expired events subscription key', () => {
    expect(expiredEventsKeyFor).to.exist.and.be.a('function');

    expect(expiredEventsKeyFor()).to.be.equal('__keyevent@0__:expired');
    expect(expiredEventsKeyFor({ db: undefined })).to.be.equal(
      '__keyevent@0__:expired'
    );
    expect(expiredEventsKeyFor({ db: null })).to.be.equal(
      '__keyevent@0__:expired'
    );
    expect(expiredEventsKeyFor({ db: 1 })).to.be.equal(
      '__keyevent@1__:expired'
    );
  });

  it('should schedule expiry key', () => {
    expect(expiryKeyFor).to.exist.and.be.a('function');

    const name = 'sendEmail';
    const interval = '2 seconds';

    expect(expiryKeyFor({ name, interval })).to.be.equal(
      'r:schedules:keys:sendEmail'
    );
    expect(expiryKeyFor({ name, interval })).to.be.equal(
      expiryKeyFor({ name, interval })
    );
  });

  it('should schedule data key', () => {
    expect(dataKeyFor).to.exist.and.be.a('function');

    const name = 'sendEmail';
    const interval = '2 seconds';

    expect(dataKeyFor({ name, interval })).to.be.equal(
      'r:schedules:data:sendEmail'
    );
    expect(dataKeyFor({ name, interval })).to.be.equal(
      dataKeyFor({ name, interval })
    );
  });

  it('should create scheduler redis client', () => {
    expect(createScheduler).to.exist.and.be.a('function');

    const scheduler = createScheduler();

    expect(scheduler).to.exist;
    expect(scheduler.uuid).to.exist;
    expect(scheduler.prefix).to.exist.and.be.equal('r');
  });

  it('should not re-create scheduler redis client', () => {
    const a = createScheduler();
    const b = createScheduler();

    expect(a.uuid).to.be.equal(b.uuid);
    expect(a.prefix).to.be.equal(b.prefix);
  });

  it('should create listener redis client', () => {
    expect(createListener).to.exist.and.be.a('function');

    const listener = createListener();

    expect(listener).to.exist;
    expect(listener.uuid).to.exist;
    expect(listener.prefix).to.exist.and.be.equal('r');
  });

  it('should not re-create listener redis client', () => {
    const a = createListener();
    const b = createListener();

    expect(a.uuid).to.be.equal(b.uuid);
    expect(a.prefix).to.be.equal(b.prefix);
  });

  it('should check if expiry notifications enabled', (done) => {
    isKeyspaceEventsEnabled((error, results) => {
      expect(error).to.not.exist;
      expect(results).to.exist;
      done(error, results);
    });
  });

  it('should check if expiry notifications enabled with options', (done) => {
    isKeyspaceEventsEnabled({}, (error, results) => {
      expect(error).to.not.exist;
      expect(results).to.exist;
      done(error, results);
    });
  });

  it('should enable expiry notifications', (done) => {
    enableKeyspaceEvents((/* error, ack */) => {
      isKeyspaceEventsEnabled((error, enabled) => {
        expect(error).to.not.exist;
        expect(enabled).to.be.true;
        done(error, enabled);
      });
    });
  });

  it('should enable expiry notifications with options', (done) => {
    enableKeyspaceEvents({}, (/* error, ack */) => {
      isKeyspaceEventsEnabled((error, enabled) => {
        expect(error).to.not.exist;
        expect(enabled).to.be.true;
        done(error, enabled);
      });
    });
  });

  it('should quit all redis clients', () => {
    expect(quit).to.exist.and.be.a('function');

    const scheduler = createScheduler();
    const listener = createListener();

    expect(scheduler).to.exist;
    expect(listener).to.exist;

    const quited = quit();
    expect(quited.scheduler).to.not.exist;
    expect(quited.listener).to.not.exist;
  });

  after((done) => clear(done));
  after(() => quit());
});

describe('lock', () => {
  beforeEach((done) => clear(done));

  it('should be acquired with default ttl', (done) => {
    const name = 'sendReport';
    const optns = { name };
    acquireScheduleLock(optns, (error, unlock) => {
      expect(error).to.not.exist;
      expect(unlock).to.exist.and.be.a('function');
      done(error, unlock);
    });
  });

  it('should be acquired with custom ttl', (done) => {
    const name = 'sendReport';
    const lockTtl = 2000;
    const optns = { name, lockTtl };
    acquireScheduleLock(optns, (error, unlock) => {
      expect(error).to.not.exist;
      expect(unlock).to.exist.and.be.a('function');
      done(error, unlock);
    });
  });

  it('should unlock', (done) => {
    const name = 'sendReport';
    const lockTtl = 2000;
    const optns = { name, lockTtl };
    acquireScheduleLock(optns, (error, unlock) => {
      expect(error).to.not.exist;
      expect(unlock).to.exist.and.be.a('function');
      unlock(done);
    });
  });

  after((done) => clear(done));
  after(() => quit());
});
