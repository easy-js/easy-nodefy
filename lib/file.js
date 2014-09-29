/*!
 * file.js
 * 
 * Copyright (c) 2014
 */

// core
var fs = require('fs');
var path = require('path');

// 3rd party
var _ = require('underscore');
var async = require('async');
var mkdirp = require('mkdirp');

// lib
var parser = require('./parser');


/* -----------------------------------------------------------------------------
 * defaults
 * ---------------------------------------------------------------------------*/

var file = {

  /**
   * Read file and convert contents to commonjs format. Return contents
   * or optionally write contents to file.
   *
   * @example
   * file.convert('/path/to/file', {
   *   outputPath: '/path/to/output'
   * }, onComplete);
   *
   * @public
   *
   * @param {string} inputPath - Path to file to convert.
   * @param {object} options - Options (outputPath, map).
   * @param {function} callback - Function to execute after conversion
   *   is complete.
   */
  convert: function(inputPath, options, callback){
    // optional options
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    file.getContents(inputPath, options, function (err, contents) {      
      // parsed contents
      var outputPath = options.outputPath;

      // No need to continue. We are done due to an
      // error or due to no output path.
      return err || !outputPath
        ? callback(err, contents)
        : file.writeContents(outputPath, contents, callback);
    });
  },


  /* ---------------------------------------------------------------------------
   * utils
   * -------------------------------------------------------------------------*/

  /**
   * Get contents of file by reading and parsing the file.
   *
   * @private
   *
   * @param {string} inputPath - Path to file to read/parse.
   * @param {function} callback - Function to execute after parsed.
   */
  getContents: function (inputPath, options, callback) {
    var readFile = async.apply(fs.readFile, inputPath);
    var parseContents = async.apply(file.parseContents, options) ;

    async.waterfall([readFile, parseContents], callback);
  },

  /**
   * Parse the contents to convert amd definition to
   * commonjs definition.
   *
   * @private
   *
   * @param {object} options - Parse options.
   * @param {object} contents - File contents.
   * @param {function} callback - Function to execute after parsed.
   */
  parseContents: function (options, contents, callback) {
    var err = null;

    try {
      contents = parser.parse(contents.toString(), options);
    } catch(e) {
      err = e;
    }

    callback(err, contents);
  },

  /**
   * Write parsed contents to outputPath.
   *
   * @private
   *
   * @param {string} outputPath - 
   * @param {string} contents - Contents of string.
   * @param {function} callback - Function to execute after writing file.
   */
  writeContents: function (outputPath, contents, callback) {
    var createDirectory = _.partial(file.createDirectory, outputPath);
    var writeFile = _.partial(fs.writeFile, outputPath, contents);

    async.series([createDirectory, writeFile], callback);
  },

  /**
   * Wrapper around mkdirp that first checks for
   * directory existence.
   *
   * @private
   *
   * @param {string} filePath -
   * @param {function} callback - Function to execute after creating
   *   or verifying existence of a directory.
   */
  createDirectory: function (filePath, callback) {
    var dir = path.dirname(filePath);

    return !fs.existsSync(dir)
      ? mkdirp(dir, callback)
      : callback(null)
  }

};


/* -----------------------------------------------------------------------------
 * export
 * ---------------------------------------------------------------------------*/

 module.exports = file;