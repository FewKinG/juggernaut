require("./ext/array");

var Publish = require("./publish");
var Server  = require("./server");
var util      = require("util");
var fs       = require("fs");
var path     = require("path");

module.exports.auth_chans = []
module.exports.loadAuthFile = function(file) {
  util.log("Loading authorized channels from file: " + file);
  if(path.existsSync(file)) {    
    var data = fs.readFileSync(file, "utf8");   
    this.auth_chans = JSON.parse(data);
  } else {
    util.log("Auth file does not exist!");
  }
}

module.exports.listen = function(port){
  Publish.listen();
  var server = Server.inst();
  server.listen(port);
};
