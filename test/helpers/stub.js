'use strict';

const sinon = require('sinon');

function stubCallBack(err, res) {
  return sinon.stub().callsFake((cid, cb) => cb(err, res));
}

module.exports = stubCallBack;
