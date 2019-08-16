'use strict';

const _ = require('lodash');

// Tumbling window popularity calculator
class PopularityManager {
  constructor(options) {
    this._options = options;
    this._timeout = null;
    this.samples = [];
    this.sample = {};
    this.started = false;
    this._update = this._update.bind(this);
  }

  isPopular(cid) {
    const cidStr = cid.toString('base58btc');
    this.sample[cidStr] = this.sample[cidStr] ? this.sample[cidStr] + 1 : 1;

    const popularity = this.samples
      .concat([this.sample])
      .slice(-this._options.windowSize)
      .reduce((pop, sample) => {
        return (pop += sample[cidStr]);
      }, 0); // Number of times the object was processed in the window

    return popularity >= this._options.cacheThreshold;
  }

  // tumble the window
  _update() {
    this._stopTimeout();

    this.samples.push(this.sample);
    this.sample = [];

    if (this.samples.length > this._options.windowSize) {
      this.samples.shift();
    }

    this._nextTimeout();
  }

  start() {
    /* istanbul ignore next */
    if (!this.started) {
      this._nextTimeout();
      this.started = true;
    }
  }

  stop() {
    this._stopTimeout();
    this.started = false;
  }

  _stopTimeout() {
    /* istanbul ignore next */
    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
  }

  _nextTimeout() {
    /* istanbul ignore next */
    if (!this._timeout) {
      this._timeout = setTimeout(this._update, this._options.sampleDuration);
    }
  }
}

module.exports = PopularityManager;
