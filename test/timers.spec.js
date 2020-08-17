import { expect } from '@lykmapipo/test-helpers';

import {
  momentFor,
  nextCronRunTimeFor,
  nextHumanRunTimeFor,
} from '../src/timers';

describe('timers', () => {
  it('should wrap date to moment', () => {
    expect(momentFor(new Date())).to.exist;
    expect(momentFor(new Date(), 'Africa/Nairobi')).to.exist;
  });

  it('should compute next run time from cron interval', () => {
    expect(nextCronRunTimeFor).to.be.a('function');
    expect(nextCronRunTimeFor.name).to.be.equal('nextCronRunTimeFor');
    expect(nextCronRunTimeFor.length).to.be.equal(3);

    const lastRunAt = new Date();

    let nextRunAt = nextCronRunTimeFor('* * * * * *', lastRunAt);
    expect(nextRunAt.getSeconds()).to.equal(lastRunAt.getSeconds() + 1);

    nextRunAt = nextCronRunTimeFor('* * * * *', lastRunAt);
    expect(nextRunAt.getMinutes()).to.equal(lastRunAt.getMinutes() + 1);
  });

  it('should compute next run time from human interval', () => {
    expect(nextHumanRunTimeFor).to.be.a('function');
    expect(nextHumanRunTimeFor.name).to.be.equal('nextHumanRunTimeFor');
    expect(nextHumanRunTimeFor.length).to.be.equal(3);

    const lastRunAt = new Date();

    let nextRunAt = nextHumanRunTimeFor('1 second', lastRunAt);
    expect(nextRunAt.getTime() - lastRunAt.getTime()).to.equal(1000);

    nextRunAt = nextHumanRunTimeFor('5 seconds', lastRunAt);
    expect(nextRunAt.getTime() - lastRunAt.getTime()).to.equal(5000);

    nextRunAt = nextHumanRunTimeFor('1 minute', lastRunAt);
    expect(nextRunAt.getTime() - lastRunAt.getTime()).to.equal(60000);

    nextRunAt = nextHumanRunTimeFor('5 minutes', lastRunAt);
    expect(nextRunAt.getTime() - lastRunAt.getTime()).to.equal(300000);
  });
});
