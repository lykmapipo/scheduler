import { expect } from '@lykmapipo/test-helpers';
import { clear } from '@lykmapipo/redis-common';
import {
  createScheduler,
  createListener,
  enableExpiryNotifications,
  isExpiryNotificationsEnabled,
  quit,
} from '../src/redis';

describe('scheduler', () => {
  before((done) => clear(done));

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
    isExpiryNotificationsEnabled((error, results) => {
      expect(error).to.not.exist;
      expect(results).to.exist;
      done(error, results);
    });
  });

  it('should enable expiry notifications', (done) => {
    enableExpiryNotifications((/* error, ack */) => {
      isExpiryNotificationsEnabled((error, enabled) => {
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
});
