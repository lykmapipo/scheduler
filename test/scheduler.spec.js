import { expect } from '@lykmapipo/test-helpers';

import { isValidSchedule } from '../src/scheduler';

describe('scheduler', () => {
  it('should validate schedules', () => {
    expect(isValidSchedule).to.be.a('function');
    expect(isValidSchedule.name).to.be.equal('isValidSchedule');
    expect(isValidSchedule.length).to.be.equal(1);

    const name = 'sendEmail';
    const interval = '2 seconds';
    const perform = (data, performne) => performne(null);

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
});
