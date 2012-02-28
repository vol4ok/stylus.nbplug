###!
 * LESS plugin for nBuild
 * Copyright(c) 2011-2012 vol4ok <admin@vol4ok.net>
 * MIT Licensed
###


###* Module dependencies ###

require "colors"
fs     = require 'fs'
_      = require 'underscore'
stylus = require 'stylus'

{walkSync} = require 'fs.walker'
Filter = require 'path.filter'
{join, dirname, basename, extname, normalize, relative, existsSync} = require 'path'
{makeDir, setExt} = require 'fs.utils'

exports.initialize = (builder) -> new StylusPlugin(builder)

class StylusPlugin
  defaults:
    target: null
    targets: []
    includes: []
    outdir: null
    compress: no
    filter: null
    fileExts: [ 'styl', 'stylus' ]
  
  constructor: (@builder) ->
    @builder.registerType('stylus', @stylus, this)
    
  stylus: (name, options) ->
    @opt = _.defaults(options, @defaults)
    @opt.includes = _.map @opt.includes, (inc) -> fs.realpathSync(inc) 
    @opt.targets.push(@opt.target) if @opt.target?
            
    @filter = new Filter().allow('ext', @opt.fileExts...)
    if @opt.filter?
      @filter.allowList(@opt.filter.allow) if _.isArray(@opt.filter.allow)
      @filter.denyList(@opt.filter.deny)   if _.isArray(@opt.filter.deby)
    @count = 0
    
    @asyncOps = 1
    @builder.lock()
    for target in @opt.targets
      walkSync()
        .on 'file', (file, dir, base) => 
          return unless @filter.test(file)
          infile = join(base, dir, file)
          outdir = join(@opt.outdir ? base, dir)
          outfile = join(outdir, setExt(file, '.css'))
          makeDir(outdir)
          @_compile(infile, outfile)
        .walk(target)
    @_complete() if --@asyncOps is 0
    
  _compile: (infile, outfile) ->
    style = fs.readFileSync(infile, 'utf-8')
    console.log infile.green
    @asyncOps++
    styl = stylus(style).set('filename', infile)
    styl.include(inc) for inc in @opt.includes
    styl.render (err, css) =>
      @_complete() if --@asyncOps is 0
      if err
        console.log "error: #{err}".red
      else
        @count++
        fs.writeFileSync(outfile, css, 'utf-8')
      
  _complete: ->
    @builder.unlock()
    console.log "compile: #{@count} files successfully compiled".green
