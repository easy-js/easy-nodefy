/*!
 * test/helpers.js
 * 
 * Copyright (c) 2014
 */

// core
var fs = require('fs');
var path = require('path');

// 3rd party
var rimraf = require('rimraf');


/* -----------------------------------------------------------------------------
 * scope
 * ---------------------------------------------------------------------------*/

var SHOULD_PURGE = true;


/* -----------------------------------------------------------------------------
 * helpers
 * ---------------------------------------------------------------------------*/

var helpers = {

  /**
   * Read file with `-in` postfix inside `test/files` directory.
   *
   * @public
   *
   * @param {string} id - File id. 
   */
  readIn: function(id) {
    return helpers.readFile(__dirname +'/files/'+  id +'-in.js');
  },

  /**
   * Read file with `-out` postfix inside `test/files` directory.
   *
   * @public
   *
   * @param {string} id - File id. 
   */
  readOut: function(id) {
    return helpers.readFile(__dirname +'/files/'+  id +'-out.js');
  },

  /**
   * Read file sync and return contents as string.
   *
   * @public
   *
   * @param {string} filePath - Path of file to read. 
   */
  readFile: function(filePath) {
    return fs.readFileSync(filePath).toString();
  },

  /**
   * Remove directory and contents.
   *
   * @public
   *
   * @param {string} directoryPath - Path of directory to remove. 
   */
  purge: function(directoryPath) {
    if (!SHOULD_PURGE) {
      return
    };

    rimraf.sync(directoryPath);
  },

  /**
   * Make directory if it does not already exist.
   *
   * @public
   *
   * @param {string} directoryPath - Path of directory to create. 
   */
  mkdir: function(directoryPath) {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath);
    }
  }

};


/* -----------------------------------------------------------------------------
 * export
 * ---------------------------------------------------------------------------*/

module.exports = helpers;