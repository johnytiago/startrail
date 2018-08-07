'use strict'

module.exports = class cacheQueue {
  constructor (self) {
    this._entries = []
  }

  addEntry (cid, peer) {
    this._entries = this._entries.push({ peer, cid })
    this._get(peer, cid)
  }

  removeEntry (cid) {
    const index = this._entries.findIndex( entry  => cid.equals(entry.cid) )

    if (index === -1)
      return

    this._entries.splice(index, 1)
  }

  _get(peer, cid) {
    self.bitswap.get(cid, (err, block) => {
      if (err)
        // try again ?
      // dht set ourselves as providers of the block
      self.dht.provide(cid, (err) => {
        if (err)
          // could not set provide, try again?
        // successful
    }) 
  }
}
