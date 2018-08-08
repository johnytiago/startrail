'use strict';

module.exports = class cacheQueue {
  constructor(self) {
    this._entries = [];
  }

  addEntry(cid, cb) {
    this._entries.push(cid);
    this._get(cid, cb);
  }

  removeEntry(cid) {
    const index = this._entries.findIndex(entry => cid.equals(entry.cid));

    if (index === -1) return;

    this._entries.splice(index, 1);
  }

  _get(cid, cb) {
    self.bitswap.get(cid, (err, block) => {
      // try again ?
      if (err) return cb(err);

      // dht set ourselves as providers of the block
      self.dht.provide(cid, err => {
        // could not set provide, try again?
        if (err) return cb(err);

        // successful
        removeEntry(cid);
        return cb(null);
      });
    });
  }
};
