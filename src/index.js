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
            // TODO Serve block
            log.info('Block found in cache');
            return cb(null, 'CHANGE_ME');
          }

          bitswap.get(cid, (err, block) => {
            if (err) {
              log.debug('Error getting block from bitswap:', err);
              return cb(err);
            }

            log.info('Got from bitswap');
            // TODO: delay provide for aftewards
            // dht set ourselves as providers of the block
            libp2p.contentRouting.provide(cid, err => {
              if (err) {
                log.debug('Error providing block:', err);
                // Don't break, got block, serve it
              }

              log.info('Providing block');
              // TODO: Serve block
              return cb(null, block);
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
