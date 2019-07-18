'use strict';

const debug = require('debug');

const log = debug('libp2p:startrail');
log.error = log.err = debug('libp2p:startrail:error');
log.info = debug('libp2p:startrail:info');
log.debug = debug('libp2p:startrail:debug');
log.trace = debug('libp2p:startrail:trace');

module.exports = log;
