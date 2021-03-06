'use strict';

const _ = require('lodash');
const async = require('async');

const log = require('./util/logger');
const PopularityManager = require('./popularity-manager');
const config = require('./config');

class Startrail {
  constructor(repo, bitswap, libp2p, options) {
    this._options = _.merge(config, options);
    this.repo = repo;
    this.blockstorage = repo.blocks;
    this.bitswap = bitswap;
    this.libp2p = libp2p;
    this.id = libp2p.peerInfo.id._idB58String;
    this.pm = new PopularityManager(this._options.popularityManager, this.id);
    this.pm.start();
  }

  process({ cid, peer }, cb) {
    const cidStr = cid.toString('base58btc');

    log.info('processing_block %j', {
      id: this.id,
      cid: cidStr,
      from: peer.id._idB58String
    });

    if (!this.pm.isPopular(cid)) return cb();

    async.waterfall(
      [
        async.constant(cid),
        this.blockstorage.has,
        (has, cb) => {
          if (has) {
            log.debug('block_found_in_cache %j', { cid: cidStr });
            return cb(null, has);
          }

          if (this.bitswap.wm.wantlist.contains(cid)) return cb(); // block already on wantlist

          this.bitswap.get(cid, (err, block) => {
            if (err) {
              log.err('error_getting_block_from_bitswap %j', err);
              return cb(err);
            }

            log.debug('fetched_from_bitswap %j', { cid: cidStr });
            this.libp2p.contentRouting.provide(cid, err => {
              err
                ? log.err('error_providing_block %j', err)
                : log.debug('providing_block %j', { cid: cidStr });
              return cb(null, true);
            });
          });
        }
      ],
      (err, result) => {
        if (err) {
          log.err('error_processing_block %j', {
            cid: cidStr,
            from: peer.id._idB58String,
            err
          });
          return cb(err);
        }

        return cb(null, result);
      }
    );
  }

  updateConfig(cb) {
    this.repo.config.get('Startrail', (err, newConfigs) => {
      if (err) cb(err);

      if (!_.isEqual(this._options, newConfigs)) {
        this._options = _.merge(this._options, newConfigs);
        this.pm.updateConfig(this._options.popularityManager);
      }

      cb();
    });
  }

  stop() {
    this.pm.stop();
  }
}

module.exports = Startrail;
