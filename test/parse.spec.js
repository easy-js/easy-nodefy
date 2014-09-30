/*!
 * test/parse.js
 * 
 * Copyright (c) 2014
 */

// lib
var nodefy = require('../lib/nodefy');
var _helpers = require('./helpers');


/* -----------------------------------------------------------------------------
 * helpers
 * ---------------------------------------------------------------------------*/

var readIn = _helpers.readIn;
var readOut = _helpers.readOut;


/* -----------------------------------------------------------------------------
 * test
 * ---------------------------------------------------------------------------*/

describe('parse', function () {

  it('should convert standard AMD', function () {
    var output = nodefy.parse(readIn('basic'));
    expect(output).toMatch(/require\(['"]\w/);
    expect(output).toEqual(readOut('basic'));
  });

  it('should work properly with magic AMD dependencies', function () {
    var output = nodefy.parse(readIn('magic'));
    expect(output).toMatch(/require\(['"]\w/);
    expect(output).toEqual(readOut('magic'));
  });

  it('should convert simplified CJS modules', function () {
    var output = nodefy.parse(readIn('simplified_cjs'));
    expect(output).toMatch(/require\(['"]\w/);
    expect(output).toEqual(readOut('simplified_cjs'));
  });

  it('should convert namedmodule and ignore magical dependencies', function () {
    var output = nodefy.parse(readIn('named_mixed'));
    expect(output).toMatch(/require\(['"]\w/);
    expect(output).toEqual(readOut('named_mixed'));
  });

  it('should skip conversion if file doesn\'t call `define()`', function () {
    var output = nodefy.parse(readIn('no_define'));
    expect(output).not.toMatch(/require\(['"]\w/);
    expect(output).not.toMatch(/define\(['"]\w/);
    expect(output).toEqual(readOut('no_define'));
  });

  it('should work with remapped magical modules', function () {
    var output = nodefy.parse(readIn('nested/magic_remapped'));
    expect(output).toMatch(/\= exports;/);
    expect(output).toMatch(/\= require;/);
    expect(output).toMatch(/\= module;/);
    expect(output).toEqual(readOut('nested/magic_remapped'));
  });

  it('should do simple conversion if dependency uses an AMD plugin', function () {
    var output = nodefy.parse(readIn('nested/deep/plugin'));
    expect(output).toMatch(/require\(['"]\w+!\w+['"]\)/);
    expect(output).toEqual(readOut('nested/deep/plugin'));
  });

  it('should convert mapped modules.', function () {
    var output = nodefy.parse(readIn('mapped'), {
      map: { 'foo': 'i/am/mapped' }
    });
    expect(output).toMatch(/require\(['"]\w/);
    expect(output).toEqual(readOut('mapped'));
  });

});