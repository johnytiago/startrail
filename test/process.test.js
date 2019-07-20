'use strict';

const sinon = require('sinon');
const { describe, it, before, after, afterEach } = require('mocha');
const { expect } = require('chai');

describe('Process test', function() {
    const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  describe('Error cases', function() {
    it('should fail', async function() {
      expect(false).to.be.false;
    });
  });

  describe('Success cases', function() {
    it('should pass', async function() {
      expect(true).to.be.true;
    });
  });
});
