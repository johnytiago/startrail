'use strict';

const _ = require('lodash');
const sinon = require('sinon');
const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const mockModule = require('proxyquire').noCallThru();
const CID = require('cids');
const multihashing = require('multihashing-async');

const Startrail = require('../../src');
const stubCb = require('../helpers/stub');

describe('process tests', async () => {
  let startrail;
  let cid;
  let blockstorage = { has: stubCb(null, false) };
  let bitswap = {};
  let libp2p = {};
  const mockPeer = { id: { _idB58String: '' } };

  before(async () => {
    const hash = await multihashing(Buffer.from('Benfica'), 'sha2-256');
    cid = new CID(1, 'dag-pb', hash);
  });

  beforeEach(() => {
    startrail = new Startrail(blockstorage, bitswap, libp2p);
    sinon.stub(startrail.pm, 'isPopular').returns(true);
  });

  afterEach(() => {
    startrail.stop();
    sinon.restore();
  });

  it('should break when cid is not popular', done => {
    startrail.pm.isPopular.restore();
    sinon.stub(startrail.pm, 'isPopular').returns(false);

    startrail.process({ cid, peer: mockPeer }, (err, res) => {
      expect(err).to.be.undefined;
      expect(res).to.be.undefined;
      done();
    });
  });

  it('should break if already on Bitswap', done => {
    _.set(bitswap, 'wm.wantlist.contains', () => true);

    startrail.process({ cid, peer: mockPeer }, (err, res) => {
      expect(err).to.be.null;
      done();
    });
  });

  it('should break when Bitswap fails to fetch', done => {
    _.set(bitswap, 'wm.wantlist.contains', () => false);
    bitswap.get = stubCb('GET_FAIL');

    startrail.process({ cid, peer: mockPeer }, (err, res) => {
      expect(err).to.be.equal('GET_FAIL');
      done();
    });
  });

  it('should return block when fetching from network - Provide fails', done => {
    bitswap.get = stubCb(null, 'GET_BLOCK_SUCCESS');
    _.set(bitswap, 'wm.wantlist.contains', () => false);
    libp2p.contentRouting = { provide: stubCb('PROVIDE_ERROR') };

    startrail.process({ cid, peer: mockPeer }, (err, res) => {
      expect(err).to.be.null;
      expect(res).to.be.true;
      done();
    });
  });

  it('should return block when fetching from network - Provide success', done => {
    bitswap.get = stubCb(null, 'GET_BLOCK_SUCCESS');
    _.set(bitswap, 'wm.wantlist.contains', () => false);
    libp2p.contentRouting = { provide: stubCb() };

    startrail.process({ cid, peer: mockPeer }, (err, res) => {
      expect(err).to.be.null;
      expect(res).to.be.true;
      done();
    });
  });

  // Dependency. Needs to be the last because changes has method.
  it('should return block when BlockStore has block', done => {
    blockstorage.has = stubCb(null, true);

    startrail.process({ cid, peer: mockPeer }, (err, res) => {
      expect(err).to.be.null;
      expect(res).to.be.true;
      done();
    });
  });
});
