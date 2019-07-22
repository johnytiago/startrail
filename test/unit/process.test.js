'use strict';

const _ = require('lodash');
const sinon = require('sinon');
const PeerId = require('peer-id');
const { describe, it, before, afterEach } = require('mocha');
const { expect } = require('chai');
const mockModule = require('proxyquire').noCallThru();

const Process = require('../../src').process;
const stubCb = require('../helpers/stub');

describe('Process tests', async () => {
  let peer;
  let process;
  const ipfsStub = {};

  before(async () => {
    peer = await PeerId.create({ bits: 512 });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should break when cid is not popular', done => {
    const Process = mockModule('../../src', {
      './calculate-popularity': () => false
    }).process;

    Process()({ cid: 'benfica', peer }, (err, res) => {
      expect(err).to.be.undefined;
      expect(res).to.be.undefined;
      done();
    });
  });

  it('should break when Bitswap fails to fetch', done => {
    _.set(ipfsStub, '_repo.blocks.has', stubCb(null, false));
    _.set(ipfsStub, '_bitswap.get', stubCb('GET_FAIL'));
    process = Process(ipfsStub);

    process({ cid: 'benfica', peer }, (err, res) => {
      expect(err).to.be.equal('GET_FAIL');
      done();
    });
  });

  it('should return block when BlockStore has block', done => {
    _.set(ipfsStub, '_repo.blocks.has', stubCb(null, true));
    process = Process(ipfsStub);

    process({ cid: 'benfica', peer }, (err, res) => {
      expect(err).to.be.null;
      expect(res).to.be.equal('CHANGE_ME');
      done();
    });
  });

  it('should return block when fetching from network - Provide fails', done => {
    _.set(ipfsStub, '_repo.blocks.has', stubCb(null, false));
    _.set(ipfsStub, '_bitswap.get', stubCb(null, 'GET_SUCCESS'));
    _.set(
      ipfsStub,
      '_bitswap._libp2p.contentRouting.provide',
      stubCb('PROVIDE_FAIL')
    );

    process = Process(ipfsStub);

    process({ cid: 'benfica', peer }, (err, res) => {
      expect(err).to.be.null;
      expect(res).to.be.equal('GET_SUCCESS');
      done();
    });
  });

  it('should return block when fetching from network - Provide success', done => {
    _.set(ipfsStub, '_repo.blocks.has', stubCb(null, false));
    _.set(ipfsStub, '_bitswap.get', stubCb(null, 'GET_SUCCESS'));
    _.set(ipfsStub, '_bitswap._libp2p.contentRouting.provide', stubCb());

    process = Process(ipfsStub);

    process({ cid: 'benfica', peer }, (err, res) => {
      expect(err).to.be.null;
      expect(res).to.be.equal('GET_SUCCESS');
      done();
    });
  });
});
