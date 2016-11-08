var fs = require('fs')
var mkdirp = require('mkdirp')
var Obv = require('obv')
var path = require('path')

module.exports = function (file, block_size, flags) {
  var self
  var fd = Obv()
  var offset = Obv()
  //fs.openSync(file, flags || 'r+')
  mkdirp(path.dirname(file), function () {
    fs.open(file, flags || 'r+', function (err, _fd) {
      fd.set(_fd || err)
      fs.stat(file, function (err, stat) {
        offset.set(err ? 0 : stat.size)
      })
    })
  })

  var writing = 0

  return self = {
    get: function (i, cb) {
      fd.once(function (_fd) {
        var buf = new Buffer(block_size)
        buf.fill(0) //security
        fs.read(_fd, buf, 0, block_size, i*block_size, function (err, bytes_read) {
          cb(err, buf, bytes_read)
        })
      })
    },
    offset: offset,
    size: function () { return offset.value },
    append: function (buf, cb) {
      if(writing++) throw new Error('already writing to this file')
      fd.once(function (_fd) {
        offset.once(function (_offset) {
          fs.write(_fd, buf, 0, buf.length, _offset, function (err, written) {
            writing = 0
            offset.set(_offset+written)
            cb(null, _offset+written)
          })
        })
      })
    }
  }
}






