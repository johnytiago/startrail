'use strict';

const sinon = require('sinon');
const { describe, it, before, afterEach } = require('mocha');
const { expect } = require('chai');
const mockModule = require('proxyquire').noCallThru();

const Startrail = require('../../src');
const stubCb = require('../helpers/stub');

describe('process tests', async () => {
  let startrail;
  const mockPeer = { id: { _idB58String: '' } };

  afterEach(() => {
    sinon.restore();
  });

  it('should break when cid is not popular', done => {
    const _Startrail = mockModule('../../src', {
      './calculate-popularity': () => false
    });

    startrail = new _Startrail();

    startrail.process({ cid: 'benfica', peer: mockPeer }, (err, res) => {
      expect(err).to.be.undefined;
      expect(res).to.be.undefined;
      done();
    });
  });

  it('should break when Bitswap fails to fetch', done => {
    const blockstorage = { has: stubCb(null, false) };
    const bitswap = { get: stubCb('GET_FAIL') };
    startrail = new Startrail(blockstorage, bitswap);

    startrail.process({ cid: 'benfica', peer: mockPeer }, (err, res) => {
      expect(err).to.be.equal('GET_FAIL');
      done();
    });
  });

  it('should return block when BlockStore has block', done => {
    const blockstorage = { has: stubCb(null, true) };

    startrail = new Startrail(blockstorage);

    startrail.process({ cid: 'benfica', peer: mockPeer }, (err, res) => {
      expect(err).to.be.null;
      expect(res).to.be.true;
      done();
    });
  });

  it('should return block when fetching from network - Provide fails', done => {
    const blockstorage = { has: stubCb(null, false) };
    const bitswap = { get: stubCb(null, 'GET_BLOCK_SUCCESS') };
    const libp2p = { contentRouting: { provide: stubCb('PROVIDE_ERROR') } };

    startrail = new Startrail(blockstorage, bitswap, libp2p);

    startrail.process({ cid: 'benfica', peer: mockPeer }, (err, res) => {
      expect(err).to.be.null;
      expect(res).to.be.true;
      done();
    });
  });

  it('should return block when fetching from network - Provide success', done => {
    const blockstorage = { has: stubCb(null, false) };
    const bitswap = { get: stubCb(null, 'GET_BLOCK_SUCCESS') };
    const libp2p = { contentRouting: { provide: stubCb() } };

    startrail = new Startrail(blockstorage, bitswap, libp2p);

    startrail.process({ cid: 'benfica', peer: mockPeer }, (err, res) => {
      expect(err).to.be.null;
      expect(res).to.be.true;
      done();
    });
  });
});
