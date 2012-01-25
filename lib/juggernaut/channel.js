var util    = require("util");
var Events = require("./events");
var Juggernaut = require("./index");

Channel = module.exports = require("./klass").create();

Channel.extend({
  channels: {},
  allowedCommands: ["addKey", "enableAuth", "setKeyLifetime", "clearKeys", "dropClient", "dropAllClients"],
  
  find: function(name){
    if ( !this.channels[name] ) 
      this.channels[name] = Channel.inst(name)
    return this.channels[name];
  },

  issueCommands: function(message) {
    var commands = message.commands;
    var channels = message.getChannels();

    util.log(
      "Issuing command to channels: " + 
      channels.join(", ") + " : " + commands
    );

    for(var i=0, len = channels.length; i < len; i++) {
      var channel = this.find(channels[i]);
      for(var cmd in commands) {
	if(this.allowedCommands.indexOf(cmd) >= 0) {
	  channel[cmd](commands[cmd]);
	}
      }
    }
  },
  
  publish: function(message){
    var channels = message.getChannels();
    delete message.channels;
    
    util.log(
      "Publishing to channels: " + 
      channels.join(", ") + " : " + message.data
    );
    
    for(var i=0, len = channels.length; i < len; i++) {
      message.channel = channels[i];
      var clients     = this.find(channels[i]).clients;
      
      for(var client in clients) {
        clients[client].write(message);
      }
    }
  },
  
  unsubscribe: function(client){
    for (var name in this.channels)
      this.channels[name].unsubscribe(client);
  }
});

Channel.include({
  requireAuth: false,
  keypool: {},
  keylifetime: 86400,

  init: function(name){
    this.name    = name;
    this.clients = {};
    for(var i=0, len = Juggernaut.auth_chans.length; i < len; i++) {
      if(name.indexOf(Juggernaut.auth_chans[i]) == 0) {
	util.log("Authentication enabled for channel " + name);
	this.requireAuth = true;
      }
    }
  },

  dropAllClients: function() {
    for(var client in this.clients) {
      client.unsubscribe(this.name);
    }
  },

  dropClient: function(id) {
    var client = this.clients[id];
    if(client) {
      client.unsubscribe(this.name);
    }
  },

  enableAuth: function(enable) {
    this.requireAuth = enable;
    util.log("requireAuth set to " + enable)
  },

  addKey: function(key) {
    this.keypool[key] = (new Date()).getTime();
  },

  setKeyLifetime: function(time) {
    this.keylifetime = time;
  },

  clearKeys: function() {
    this.keypool = {}
  },

  redeemKey: function(key) {
    var fromPool = this.keypool[key];
    delete(this.keypool[key]);
    if(((new Date()).getTime() / 1000) - fromPool < this.keylifetime) {
      return true;
    }
    return false;
  },
  
  subscribe: function(client){
    this.clients[client.session_id] = client;
    Events.subscribe(this, client);
  },
  
  unsubscribe: function(client){
    if ( !this.clients[client.session_id] ) return;
    delete(this.clients[client.session_id]);
    Events.unsubscribe(this, client);
  }
});
