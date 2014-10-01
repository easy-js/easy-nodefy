/*!
 * test/convert.js
 * 
 * Copyright (c) 2014
 */

// core
var fs = require('fs');
var path = require('path');

// lib
var nodefy = require('../lib/nodefy');
var helper = require('./helpers');


/* -----------------------------------------------------------------------------
 * helpers
 * ---------------------------------------------------------------------------*/

var readFile = helper.readFile;
var readOut = helper.readOut;
var purgeFolder = helper.purge;
var mkdir = helper.mkdir;


/* -----------------------------------------------------------------------------
 * reusable paths
 * ---------------------------------------------------------------------------*/

var INPUT_DIR = path.join(__dirname, 'files');
var TEMP_DIR = path.join(__dirname, '_tmp');
var BATCH_DIR = path.join(TEMP_DIR, 'batch');


/* -----------------------------------------------------------------------------
 * test
 * ---------------------------------------------------------------------------*/

describe('convert', function () {

  beforeEach(function(){
    mkdir(TEMP_DIR);
  });

  afterEach(function(){
    purgeFolder(TEMP_DIR);
  });

  /* ---------------------------------------------------------------------------
   * convertFile
   * -------------------------------------------------------------------------*/

  describe('convertFile', function () {

    it('should read file from fs and output to a new file', function (done) {
      var inPath = path.join(INPUT_DIR, 'basic-in.js');
      var outPath = path.join(TEMP_DIR, 'basic-out.js');
      expect(fs.existsSync(outPath)).toBe( false );
      nodefy.convertFile(inPath, {
        outputPath: outPath
      }, function(err){
        expect(err).toBe(null);
        expect(readFile(outPath)).toEqual(readOut('basic'));
        done();
      });
    });

    it('should return string instead of writting to file if outputPath is missing', function (done) {
      var inPath = path.join(INPUT_DIR, 'basic-in.js');
      nodefy.convertFile(inPath, function(err, result){
        expect(err).toBe(null);
        expect(result).toBe(readOut('basic'));
        done();
      });
    });

    it('should return string instead of writting to file if outputPath is null', function (done) {
      var inPath = path.join(INPUT_DIR, 'basic-in.js');
      nodefy.convertFile(inPath, {}, function(err, result){
        expect(err).toBe(null);
        expect(result).toBe(readOut('basic'));
        done();
      });
    });

    it('should throw error if it can\'t find file', function (done) {
      var inPath = path.join(INPUT_DIR, 'missing_file.js');
      var outPath = path.join(TEMP_DIR, 'missing_file.js');
      nodefy.convertFile(inPath, outPath, function(err, result){
        expect(err).not.toBe(null);
        expect(result).toBeUndefined();
        expect(function(){ readFile(outPath); }).toThrow();
        done();
      });
    });

    it('should work with deep nested folders', function (done) {
      var inPath = path.join(INPUT_DIR, 'nested/deep/plugin-in.js');
      var outPath = path.join(TEMP_DIR, 'nested/deep/plugin-out.js');
      nodefy.convertFile(inPath, {
        outputPath: outPath
      }, function(err, result){
        expect(err).toBe(null);
        expect(readFile(outPath)).toEqual(readOut('nested/deep/plugin'));
        done();
      });
    });

    it('should pass options for map/paths', function (done) {
      var inPath = path.join(INPUT_DIR, 'paths-in.js');
      var outPath = path.join(TEMP_DIR, 'paths-out.js');
      nodefy.convertFile(inPath, {
        outputPath: outPath,
        paths: { 'foo': 'i/am/from/paths' },
        baseDir: process.cwd()
      }, function(err, result){
        expect(err).toBe(null);
        expect(readFile(outPath)).toEqual(readOut('paths'));
        done();
      });
    });

  });
  
  /* ---------------------------------------------------------------------------
   * convertBatch
   * -------------------------------------------------------------------------*/


  describe('convertBatch', function () {

    beforeEach(function(){
      mkdir(BATCH_DIR);
    });

    afterEach(function(){
      purgeFolder(BATCH_DIR);
    });

    it('should convert all files matched by glob', function (done) {

      var glob = path.join(INPUT_DIR, '**/**-in.js');

      nodefy.convertBatch(glob, {
        outputPath: BATCH_DIR
      }, function(err){
        expect(err).toBe(null);

        expect(readFile(BATCH_DIR + '/basic-in.js')).toEqual(readOut('basic'));
        // expect(readFile(BATCH_DIR + '/simplified_cjs-in.js')).toEqual(readOut('simplified_cjs'));
        // expect(readFile(BATCH_DIR + '/named_mixed-in.js')).toEqual(readOut('named_mixed'));
        expect(readFile(BATCH_DIR + '/nested/magic_remapped-in.js')).toEqual(readOut('nested/magic_remapped'));
        expect(readFile(BATCH_DIR + '/nested/deep/plugin-in.js')).toEqual(readOut('nested/deep/plugin'));
        expect(readFile(BATCH_DIR + '/strict-in.js')).toEqual(readOut('strict'));

        done();
      });
    });

    it('should return aggregated string from all files if missing outputPath', function (done) {

      var glob = path.join(INPUT_DIR, '{basic,magic}-in.js');

      nodefy.convertBatch(glob, function(err, result){
        expect(err).toBe(null);

        var expected = readOut('basic') + readOut('magic');
        result = result.map(function(r){ return r.result; }).join('');
        expect(result).toBe(expected);

        done();
      });
    });

  });

});