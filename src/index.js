'use strict';

const async = require('async');
const log = require('./util/logger');
const popular = require('./calculate-popularity');

function process(blockstorage, bitswap, libp2p) {
  return ({ cid, peer }, cb) => {
    log.trace(`Processing block: ${cid}, from: ${peer.id._idB58String}`);

    if (!popular(cid)) return cb();

    async.waterfall(
      [
        async.constant(cid),
        blockstorage.has,
        (has, cb) => {
          if (has) {
            log.info('Block found in cache');
            return cb(null, has);
          }

          bitswap.get(cid, (err, block) => {
            if (err) {
              log.debug('Error getting block from bitswap:', err);
              return cb(err);
            }

            log.info('Got from bitswap');
            libp2p.contentRouting.provide(cid, err => {
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
  };
}

module.exports = { process };
