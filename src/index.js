'use strict';

const async = require('async');
const log = require('./util/logger');
const popular = require('./calculate-popularity');

class Startrail {
  constructor(blockstorage, bitswap, libp2p) {
    this.blockstorage = blockstorage;
    this.bitswap = bitswap;
    this.libp2p = libp2p;
  }

  process({ cid, peer }, cb) {
    log.trace(`Processing block: ${cid}, from: ${peer.id._idB58String}`);

    if (!popular(cid)) return cb();

    async.waterfall(
      [
        async.constant(cid),
        this.blockstorage.has,
        (has, cb) => {
          if (has) {
            log.info('Block found in cache');
            return cb(null, has);
          }

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
}

module.exports = Startrail;
