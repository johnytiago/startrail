'use strict';

const { waterfall } = require('async');
const log = require('util/logger');

function process({ cid, peer }, cb) {
  log.trace(`Processing block: ${cid}, from: ${peer.id._idB58String}`);
  waterfall(
    [
      // update popularity
      // keep track of peers that asked for it
      cb => {
        return cb(null, true); // mock calculation
      },
      // popular ? Check blockstore for cid
      (popular, cb) => {
        if (!popular) return cb('E_NOT_POPULAR'); // break waterfall, not popular

        return self._repo.blocks.has(cid, cb);
      },
      // not in store ? Fetch from the network
      (has, cb) => {
        if (has) {
          // TODO Serve block
          log.info('Block found in cache');
          return cb();
        }

        self._bitswap.get(cid, (err, block) => {
          // try again ?
          if (err) {
            log.debug('Error getting block from bitswap:', err);
            return cb(err);
          }

          log.info('Got from bitswap');
          // dht set ourselves as providers of the block
          self._bitswap._libp2p.contentRouting.provide(cid, err => {
            // could not set provide, try again?
            if (err) {
              log.debug('Error providing block:', err);
              return cb(err);
            }
            // successful
            log.info('Provide went through');
            return cb();
          });
        });
      }
    ],
    (err, result) => {
      if (err && err !== 'E_NOT_POPULAR') {
        log.debug('ERROR:', err);
        return cb(err);
      }

      return cb();
    }
  );
}

module.exports = process;
