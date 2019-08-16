'use strict';

const _ = require('lodash');
const async = require('async');

const log = require('./util/logger');
const PopularityManager = require('./popularity-manager');
const config = require('./config');

class Startrail {
  constructor(blockstorage, bitswap, libp2p, options) {
    this._options = _.merge(config, options);
    this.blockstorage = blockstorage;
    this.bitswap = bitswap;
    this.libp2p = libp2p;
    this.pm = new PopularityManager(this._options.popularityManager);
    this.pm.start();
  }

  process({ cid, peer }, cb) {
    log.trace(`Processing block: ${cid}, from: ${peer.id._idB58String}`);

    if (!this.pm.isPopular(cid)) return cb();

    async.waterfall(
      [
        async.constant(cid),
        this.blockstorage.has,
        (has, cb) => {
          if (has) {
            log.info('Block found in cache');
            return cb(null, has);
          }

          if (this.bitswap.wm.wantlist.contains(cid)) return cb(); // block already on wantlist

          this.bitswap.get(cid, (err, block) => {
            if (err) {
              log.debug('Error getting block from bitswap:', err);
              return cb(err);
            }

            log.info('Got from bitswap');
            this.libp2p.contentRouting.provide(cid, err => {
              if (err) {
                log.debug('Error providing block:', err);
              }

              log.info('Providing block');
              return cb(null, true);
            });
          });
        }
      ],
      (err, result) => {
        if (err) {
          log.debug('ERROR:', err);
          return cb(err);
        }

        return cb(null, result);
      }
    );
  }

  stop() {
    debugger;
    this.pm.stop();
  }
}

module.exports = Startrail;
