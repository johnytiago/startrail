'use strict';

const debug = require('debug');

const log = debug('startrail');
log.error = log.err = debug('startrail:error');
log.info = debug('startrail:info');
log.debug = debug('startrail:debug');
log.trace = debug('startrail:trace');

module.exports = log;
