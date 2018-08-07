const CacheQueue = require('./cache-queue')
// import popularity calculator

class Startrail {
  constructor(libp2p, blockstore, dht) {
    this.libp2p = libp2p
    this.blockstore = blockstore
    this.dht = dht

    this cacheQueue = new CacheQueue(this)
  }
}

module.exports = Startrail
