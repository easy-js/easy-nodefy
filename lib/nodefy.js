/*!
 * nodefy.js
 * 
 * Copyright (c) 2014
 */

// lib
var parser = require('./parser');
var file = require('./file');
var batch = require('./batch');


/* -----------------------------------------------------------------------------
 * nodefy
 * ---------------------------------------------------------------------------*/

module.exports = {

  // parse method
  parse: parser.parse,

  // core api
  convertFile: file.convert,
  convertBatch: batch.convert

};