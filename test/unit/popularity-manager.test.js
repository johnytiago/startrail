'use strict';

const _ = require('lodash');
const sinon = require('sinon');
const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const mockModule = require('proxyquire').noCallThru();
const CID = require('cids');
const multihashing = require('multihashing-async');

const PopularityManager = require('../../src/popularity-manager');
const stubCb = require('../helpers/stub');

describe('popularity-manager tests', async () => {
  let pm;
  let cid;

  const config = {
    sampleDuration: 10,
    windowSize: 3,
    cacheThreshold: 2,
    id: 'This is a mocked peerId' // used to test logs
  };

  before(async () => {
    const hash = await multihashing(Buffer.from('Benfica'), 'sha2-256');
    cid = new CID(1, 'dag-pb', hash);
  });

  beforeEach(() => {
    pm = new PopularityManager(config);
  });

  afterEach(() => {
    pm.stop();
    sinon.restore();
  });

  it('should execute _update for every sample window', function(done) {
    this.timeout(4000);
    const spy = sinon.spy(pm, '_update');
    pm.start();
    setTimeout(() => {
      expect(spy.callCount).to.be.equal(3);
      done();
    }, config.windowSize * config.sampleDuration + config.sampleDuration);
  });

  it('should delete old samples', function(done) {
    this.timeout(4000);
    pm.start();
    setTimeout(() => {
      expect(pm.samples.length).to.be.equal(3);
      done();
    }, 2 * config.windowSize * config.sampleDuration);
  });

  it('should be popular on second call - cacheThreshold: 2 ', function(done) {
    this.timeout(4000);
    pm.start();

    expect(pm.isPopular(cid)).to.be.false;
    expect(pm.isPopular(cid)).to.be.true;
    done();
  });

  it('should be not be popular after window closes- cacheThreshold: 2 ', function(done) {
    this.timeout(4000);
    pm.start();

    expect(pm.isPopular(cid)).to.be.false;
    expect(pm.isPopular(cid)).to.be.true;

    setTimeout(() => {
      expect(pm.isPopular(cid)).to.be.false;
      done();
    }, 2 * config.windowSize * config.sampleDuration);
  });
});
