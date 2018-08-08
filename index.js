const waterfall = require('async/waterfall');

const CacheQueue = require('./cache-queue');
// import popularity calculator

class Startrail {
  constructor(libp2p, blockstore, dht) {
    this.libp2p = libp2p;
    this.blockstore = blockstore;
    this.dht = dht;

    this.cacheQueue = new CacheQueue(this);
  }

  process({ cid, peer }, cb) {
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

          // Evaluate level of popularity
          return this.blockstore.has(cid, cb);
        },
        // not in store ? Fetch from the network
        (has, cb) => {
          if (has) return cb(null);

          return this.cacheQueue.addEntry(cid);
        }
      ],
      (err, result) => {
        if (err && err !== 'E_NOT_POPULAR') cb(err);

        cb(null);
      }
    );
  }
}

module.exports = Startrail;
