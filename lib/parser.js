/*!
 * parser.js
 * 
 * Copyright (c) 2014
 */

// core
var path = require('path');

// 3rd party
var _ = require('underscore');
var esprima = require('esprima');
var resolve = require('amd-resolve');


/* -----------------------------------------------------------------------------
 * scope
 * ---------------------------------------------------------------------------*/

// http://requirejs.org/docs/api.html#cjsmodule
var SIMPLIFIED_CJS_ARGS = ['require', 'exports', 'module'];
var MAGIC_DEPS = { 'exports': true, 'module': true, 'require': true };

// templates used to created mappings for conversion.
var variableMappingTmpl = 'var <%=parameter%> = <%=dependency%>;';
var requireMappingTmpl  = 'var <%=parameter%> = require(\'<%=dependency%>\');';


/* -----------------------------------------------------------------------------
 * parser
 * ---------------------------------------------------------------------------*/

var parser = {

  /**
   * Convert AMD-style JavaScript string into node.js compatible module.
   *
   * @example
   * parser.parse(fileContentsStr);
   *
   * @public
   *
   * @param {string} raw - Raw file contents.
   * @param {object} options - Parsing options.
   */
  parse: function (raw, options) {
    // We are going to make some quick modifications to
    // options (specifically the base directory to use an
    // absolute path), but we don't want to alter the original.
    options = _.clone(options);

    // base directory needs to use absolute path
    if (options && options.baseDir && options.baseDir[0] !== '/') {
      options.baseDir = path.resolve(process.cwd(), options.baseDir);
    }

    // Parse raw contents
    var ast = esprima.parse(raw, { range: true, raw: true });
    var defines = ast.body.filter(parser.isDefine);

    // Check file for validity
    if (defines.length > 1){
      throw new Error('File can have only 1 define call.');
    }

    // Return raw if no conversion needed.
    return !defines.length
      ? raw
      : parser.convert(raw, defines[0], options);
  },


  /* ---------------------------------------------------------------------------
   * utils
   * -------------------------------------------------------------------------*/

  /**
   * Convert raw data using amd syntax to commonjs compatible module
   * using the provided define node.
   *
   * @private
   *
   * @param {string} raw - Raw file contents.
   * @param {object} defineNode - Esprima created ast `define` method node.
   */
  convert: function (raw, defineNode, options) {
    // parse define
    var defineArgsNode = defineNode.expression['arguments'];
    var factoryNode    = parser.getFactoryNode(defineArgsNode);
    var useStrictNode  = parser.getUseStrictNode(factoryNode);

    var output = '';

    // "use strict" should be applied at the top of the file
    if (useStrictNode) {
      output += useStrictNode.expression.raw +';\n';
    }

    // contents before define
    output += raw.substring(0, defineNode.range[0]);

    // conversion
    output += parser.convertMappings(defineArgsNode, factoryNode, options);
    output += parser.convertBody(raw, factoryNode, useStrictNode);

    // contents after define
    output += raw.substring(defineNode.range[1], raw.length);

    // return final converted ouput
    return output;
  },

  /**
   * Creates and returns a string which maps amd define method
   * arguments to commonjs style require calls.
   *
   * @private
   *
   * @param {array} defineArgsNode - Esprima created ast node of define
   *   method arguments.
   * @param {object} factoryNode - Esprima created ast node of define
   *   method factory argument.
   */
  convertMappings: function (defineArgsNode, factoryNode, options) {
    var dependencies = parser.dependencyNames(defineArgsNode);
    var parameters = parser.parameterNames(factoryNode);

    var mappings = [];
    _.each(parameters, function (parameter, i) {
      var mapping = parser.createMapping(parameter, dependencies[i], options);
      parser.addMapping(mappings, mapping);
    });

    return mappings.join('\n');
  },

  /**
   * Modify dependency in order to support amd common config
   * options (map, paths).
   *
   * @private
   *
   * @param {string} parameter -
   * @param {string} dependency -
   * @param {object} options - Parse options.
   */
  createMapping: function (parameter, dependency, options) {
    if (options && (options.map || options.paths)) {
      dependency = parser.resolveDependency(dependency, options);
    }

    return {
      parameter: parameter,
      dependency: dependency
    };
  },

  /**
   * Resolve dependency using `map` and `paths` options.
   *
   * @public
   *
   * @param {string} dependency - Dependency id.
   * @param {object} options - Parsing options.
   */
  resolveDependency: function (dependency, options) {
    var firstChar = dependency[0];
    var dependencyPath = resolve.sync(dependency, options, true);

    if (dependency.match(/^\.\.\//)) {
      return path.relative(options.relDir, dependencyPath);
    } else if (dependency.match(/^\.\//)) {
      return './' + path.relative(options.relDir, dependencyPath);
    } else if (dependency.match(/^\//)) {
      return dependencyPath;
    } else {
      return dependencyPath.replace(options.baseDir + '/', '');
    }
  },

  /**
   * If a mapping exsists for a given paramter, add it to 
   * the mappings array.
   *
   * @private
   *
   * @param {array} mappings - Array holding all mappings.
   * @param {object} mapping - Object containing paramater and dependency
   *   to map.
   */
  addMapping: function (mappings, mapping) {
    var isMagicDep = MAGIC_DEPS[mapping.dependency];
    var isMagicParam = MAGIC_DEPS[mapping.parameter];

    // if user remapped a magic dependency to a different
    // argument name - correct it.
    if (isMagicDep  && !isMagicParam) {
      mappings.push(_.template(variableMappingTmpl, mapping));


    // only do require for params that have a matching dependency also
    // skip "magic" dependencies
    } else if (mapping.dependency && !isMagicDep) {
      mappings.push(_.template(requireMappingTmpl, mapping));
    }
  },

  /**
   * Returns body of factory (after optionally declared "use strict"
   * expression) with converted return -> module.exports statement.
   *
   * @private
   *
   * @param {string} raw - Raw file contents.
   * @param {object} factoryNode - Esprima created ast node of define
   *   method factory argument.
   * @param {object} userStrictNode - Esprima created ast node for factory
   *   method return statement.
   */
  convertBody: function (raw, factoryNode, useStrictNode) {
    var returnNode = parser.getReturnNode(factoryNode);
    var bodyStart = factoryNode.body.range[0] + 1;
    var bodyEnd = factoryNode.body.range[1] - 1;

    // if uses strict, move body start past it
    if (useStrictNode) {
      bodyStart = useStrictNode.expression.range[1] + 1;
    }
    
    return returnNode
      ? parser.createBodyReturn(raw, bodyStart, bodyEnd, returnNode)
      : parser.createBody(raw, bodyStart, bodyEnd);
  },

  /**
   * Create body string by replacing `return` statement with
   * `module.exports =`.
   *
   * @private
   *
   * @param {string} raw - Raw file contents.
   * @param {integer} bodyStart - Character count of factory body start.
   * @param {integer} bodyEnd - Character count of factory body end.
   */
  createBodyReturn: function (raw, bodyStart, bodyEnd, returnNode) {
    // "return ".length === 7 so we add "6" to returnStatement start
    var returnValueStart = returnNode.range[0] + 6;
    var returnStart = returnNode.range[0];

    var output = raw.substring(bodyStart, returnStart);
    output += 'module.exports ='+ raw.substring(returnValueStart, bodyEnd);

    return output;
  },

  /**
   * Return contents of factory body.
   *
   * @private
   *
   * @param {string} raw - Raw file contents.
   * @param {integer} bodyStart - Character count of factory body start.
   * @param {integer} bodyEnd - Character count of factory body end.
   */
  createBody: function (raw, bodyStart, bodyEnd) {
    // if using exports or module.exports or just a private module we
    // simply return the factoryBody content
    return raw.substring(bodyStart, bodyEnd);
  },


  /* ---------------------------------------------------------------------------
   * parts
   * -------------------------------------------------------------------------*/

  /**
   * Determine weather a given node is a amd style define method.
   *
   * @private
   *
   * @param {object} node - Esprima created ast node.
   */
  isDefine: function (node) {
    return node.type === 'ExpressionStatement'
       && node.expression.type === 'CallExpression'
       && node.expression.callee.type === 'Identifier'
       && node.expression.callee.name === 'define';
  },

  /**
   * Determine weather a given node is a "use strict" statement.
   *
   * @private
   *
   * @param {object} node - Esprima created ast node.
   */
  isUseStrict: function (node) {
    return node.type === 'ExpressionStatement'
      && node.expression.type === 'Literal'
      && node.expression.value === 'use strict';
  },

  /**
   * Get the factory of the define method by grabbing the
   * the first passed function.
   *
   * @private
   *
   * @param {array} defineArgsNode - Esprima created ast node of define
   *   method arguments.
   */
  getFactoryNode: function (defineArgsNode) {
    return defineArgsNode.filter(function (arg) {
      return arg.type === 'FunctionExpression';
    })[0];
  },

  /**
   * Get any userStrict definitions declared within define
   * factory.
   *
   * @private
   *
   * @param {object} factoryNode - Esprima created ast node of define
   *   factory.
   */
  getUseStrictNode: function (factoryNode) {
    return factoryNode.body.body.filter(this.isUseStrict)[0];
  },

  /**
   * Get return statement declared withing the define
   * factory function.
   *
   * @private
   *
   * @param {object} factoryNode - Esprima created ast node of define
   *   factory.
   */
  getReturnNode: function (factoryNode) {
    return factoryNode.body.body.filter(function(node){
      return node.type === 'ReturnStatement';
    })[0];
  },

  /**
   * Grab array from dependency arguments and return
   * each argument value. If no array exists, return
   * an empty array.
   *
   * @private
   *
   * @param {array} defineArgsNode - Esprima created ast node of define
   *   method arguments.
   */
  dependencyNames: function (defineArgsNode) {
    var dependencyArr = defineArgsNode.filter(function(arg){
      return arg.type === 'ArrayExpression';
    })[0];

    return dependencyArr
      ? _.pluck(dependencyArr.elements, 'value')
      : _.clone(SIMPLIFIED_CJS_ARGS);
  },

  /**
   * Grab name from each factory argument.
   *
   * @private
   *
   * @param {object} factoryNode - Esprima created ast node of define
   *   method factory argument.
   */
  parameterNames: function (factoryNode) {
    return _.pluck(factoryNode.params, 'name');
  }

};


/* -----------------------------------------------------------------------------
 * export
 * ---------------------------------------------------------------------------*/

module.exports = parser;