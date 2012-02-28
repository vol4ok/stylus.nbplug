/*!
 * LESS plugin for nBuild
 * Copyright(c) 2011-2012 vol4ok <admin@vol4ok.net>
 * MIT Licensed
*/
/** Module dependencies
*/
var Filter, StylusPlugin, basename, dirname, existsSync, extname, fs, join, makeDir, normalize, relative, setExt, stylus, walkSync, _, _ref, _ref2,
  __slice = Array.prototype.slice;

require("colors");

fs = require('fs');

_ = require('underscore');

stylus = require('stylus');

walkSync = require('fs.walker').walkSync;

Filter = require('path.filter');

_ref = require('path'), join = _ref.join, dirname = _ref.dirname, basename = _ref.basename, extname = _ref.extname, normalize = _ref.normalize, relative = _ref.relative, existsSync = _ref.existsSync;

_ref2 = require('fs.utils'), makeDir = _ref2.makeDir, setExt = _ref2.setExt;

exports.initialize = function(builder) {
  return new StylusPlugin(builder);
};

StylusPlugin = (function() {

  StylusPlugin.prototype.defaults = {
    target: null,
    targets: [],
    includes: [],
    outputDir: null,
    compress: false,
    filter: null,
    fileExts: ['styl', 'stylus']
  };

  function StylusPlugin(builder) {
    this.builder = builder;
    this.builder.registerType('stylus', this.stylus, this);
  }

  StylusPlugin.prototype.stylus = function(name, options) {
    var target, _i, _len, _ref3, _ref4,
      _this = this;
    this.opt = _.defaults(options, this.defaults);
    this.opt.includes = _.map(this.opt.includes, function(inc) {
      return fs.realpathSync(inc);
    });
    if (this.opt.target != null) this.opt.targets.push(this.opt.target);
    this.filter = (_ref3 = new Filter()).allow.apply(_ref3, ['ext'].concat(__slice.call(this.opt.fileExts)));
    if (this.opt.filter != null) {
      if (_.isArray(this.opt.filter.allow)) {
        this.filter.allowList(this.opt.filter.allow);
      }
      if (_.isArray(this.opt.filter.deby)) {
        this.filter.denyList(this.opt.filter.deny);
      }
    }
    this.count = 0;
    this.asyncOps = 1;
    this.builder.lock();
    _ref4 = this.opt.targets;
    for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
      target = _ref4[_i];
      walkSync().on('file', function(file, dir, base) {
        var infile, outdir, outfile, _ref5;
        if (!_this.filter.test(file)) return;
        infile = join(base, dir, file);
        outdir = join((_ref5 = _this.opt.outputDir) != null ? _ref5 : base, dir);
        outfile = join(outdir, setExt(file, '.css'));
        makeDir(outdir);
        return _this._compile(infile, outfile);
      }).walk(target);
    }
    if (--this.asyncOps === 0) return this._complete();
  };

  StylusPlugin.prototype._compile = function(infile, outfile) {
    var inc, styl, style, _i, _len, _ref3,
      _this = this;
    style = fs.readFileSync(infile, 'utf-8');
    console.log(infile.green);
    this.asyncOps++;
    styl = stylus(style).set('filename', infile);
    _ref3 = this.opt.includes;
    for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
      inc = _ref3[_i];
      styl.include(inc);
    }
    return styl.render(function(err, css) {
      if (--_this.asyncOps === 0) _this._complete();
      if (err) {
        return console.log(("error: " + err).red);
      } else {
        _this.count++;
        return fs.writeFileSync(outfile, css, 'utf-8');
      }
    });
  };

  StylusPlugin.prototype._complete = function() {
    this.builder.unlock();
    return console.log(("compile: " + this.count + " files successfully compiled").green);
  };

  return StylusPlugin;

})();
