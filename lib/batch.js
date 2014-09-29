/*!
 * batch.js
 * 
 * Copyright (c) 2014
 */

// core
var path = require('path');

// 3rd party
var _ = require('underscore');
var glob = require('glob');
var async = require('async');

// lib
var file = require('./file');


/* -----------------------------------------------------------------------------
 * batch
 * ---------------------------------------------------------------------------*/

var batch = {

  /**
   * Read folder content and output files into output folder.
   *
   * @example
   * batch.convert('/files/glob', {
   *   outputPath: '/path/to/output'
   * }, onComplete);
   *
   * @public
   *
   * @param {string} inputGlob - Glob representing files to convert.
   * @param {object} options - Options (outputPath, map).
   * @param {function} callback - Function to execute after conversion
   *   is complete.
   */
  convert: function (inputGlob, options, callback) {
    // optional options
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    glob(inputGlob, function (err, files) {
      return err
        ? callback(err)
        : batch.convertFiles(files, options, callback);
    });
  },


  /* ---------------------------------------------------------------------------
   * utils
   * -------------------------------------------------------------------------*/

  /**
   * Convert an array of files.
   *
   * @private
   *
   * @param {array} files - Array of files to convert.
   * @param {object} options - Options (outputPath, map).
   * @param {function} callback - Function to execute after conversion
   *   is complete.
   */
  convertFiles: function (files, options, callback) {
    var rootFolder = batch.getRoot(files);

    async.map(files, function (sourcePath, fn) {
      return options.outputPath
        ? batch.writeContents(rootFolder, sourcePath, options, fn)
        : batch.returnContents(sourcePath, options, fn);
    }, callback);
  },

  /**
   * Method to execute within file map that adds an object with
   * sourcePath and result from parse.
   *
   * @private
   *
   * @param {string} sourcePath - Path of file to convert.
   * @param {object} options - Options (outputPath, map).
   * @param {function} fn - Map function to be called with result.
   */
  returnContents: function (sourcePath, options, fn) {
    var ret = { sourcePath: sourcePath };

    file.convert(sourcePath, options, function (err, result) {
      ret['result'] = result;
      fn(err, ret);
    });
  },

  /**
   * Alternative method that can be called within map. This both
   * writes the file to disk, using an optionally specified
   * outputPath, and returns the result object.
   *
   * @private
   *
   * @param {string} rootFolder - String representing the root folder
   *   specified by the passed glob.
   * @param {string} sourcePath - Path of file to convert.
   * @param {object} options - Options (outputPath, map).
   * @param {function} fn - Map function to be called with result.
   */
  writeContents: function (rootFolder, sourcePath, options, fn) {
    var relativePath = sourcePath.replace(rootFolder, '');
    var outputPath = options.outputPath;

    var ret = {
      sourcePath: sourcePath,
      outputPath: outputPath
    };

    // copy and modify
    options = _.clone(options);
    options['outputPath'] = path.join(outputPath, relativePath);

    file.convert(sourcePath, options, function (err, result) {
      ret['result'] = result;
      fn(err, ret);
    });
  },

  /**
   * Find the root by finding the path with the smallest
   * length.
   *
   * @private
   *
   * @param {array} paths - Array of files used to determine
   *   root directory.
   */
  getRoot: function (paths) {
    var compare = Infinity;
    var result;

    _.each(paths, function (path, i) {
      if (path.length < compare) {
        compare = path.length;
        result = path;
      }
    });

    return path.dirname(result);
  }

};


/* -----------------------------------------------------------------------------
 * export
 * ---------------------------------------------------------------------------*/

module.exports = batch;