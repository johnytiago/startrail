'use strict';

const _ = require('lodash');
const sinon = require('sinon');
const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const CID = require('cids');
const multihashing = require('multihashing-async');

const Startrail = require('../../src');
const config = require('../../src/config');
const stubCb = require('../helpers/stub');

describe('process tests', async () => {
  let startrail;
  let cid;

  const repo = {};
  const bitswap = {};
  const libp2p = {};
  const mockPeer = { id: { _idB58String: 'This is a mocked peerId' } };
  libp2p.peerInfo = mockPeer;
  repo.blocks = { has: stubCb(null, false) };

  before(async () => {
    const hash = await multihashing(Buffer.from('Benfica'), 'sha2-256');
    cid = new CID(1, 'dag-pb', hash);
  });

  beforeEach(() => {
    startrail = new Startrail(repo, bitswap, libp2p);
  });

  afterEach(() => {
    startrail.stop();
    sinon.restore();
  });

  context('cid is not popular or not relevant', async () => {
    it('should break when cid is not popular', done => {
      sinon.stub(startrail.pm, 'isPopular').returns(false);

      startrail.process({ cid, peer: mockPeer }, (err, res) => {
        expect(err).to.be.undefined;
        expect(res).to.be.undefined;
        done();
      });
    });

    it('should not update when no config', async () => {
      const get = sinon.fake.resolves({});
      _.set(repo, 'config.get', get);

      await startrail.updateConfig();
      expect(startrail.pm._options).to.deep.equal(config.popularityManager);
    });

    it('should not update when configs are the same', async () => {
      const get = sinon.fake.resolves(config);
      _.set(repo, 'config.get', get);

      await startrail.updateConfig();
      expect(startrail.pm._options).to.deep.equal(config.popularityManager);
    });

    it('should update when configs are different', async () => {
      const get = sinon.fake.resolves({
        popularityManager: {
          windowSize: 4,
          cacheThreshold: 4
        }
      });
      _.set(repo, 'config.get', get);

      await startrail.updateConfig();
      expect(startrail.pm._options).to.deep.equal({
        sampleDuration: 10 * 1000,
        windowSize: 4,
        cacheThreshold: 4
      });
    });
  });

  context('cid is popular', async () => {
    beforeEach(() => {
      sinon.stub(startrail.pm, 'isPopular').returns(true);
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
      repo.blocks.has = stubCb(null, true);

      startrail.process({ cid, peer: mockPeer }, (err, res) => {
        expect(err).to.be.null;
        expect(res).to.be.true;
        done();
      });
    });
  });
});
