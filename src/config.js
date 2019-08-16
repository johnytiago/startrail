'use strict';

module.exports = {
  popularityManager: {
    sampleDuration: 10 * 1000, // 10sec
    windowSize: 3, // 3 samples
    cacheThreshold: 2 // number of cache hits
  }
};
