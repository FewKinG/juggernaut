var util     = require("util");
var Channel = require("./channel");
var Events  = require("./events");

Client = module.exports = require("./klass").create();

Client.include({
  init: function(conn){
    this.connection = conn;
    this.session_id = this.connection.session_id;
  },
  
  setMeta: function(value){
    this.meta = value;
  },
  
  event: function(data){
    Events.custom(this, data);
  },
  
  subscribe: function(name, options){
    util.log("Client subscribing to: " + name);
    options = options ? options : {}
        
    var channel = Channel.find(name)
    if(channel.requireAuth) {
      util.log("Channel requires authentication");
      var key = options["key"];
      if(key && channel.redeemKey(key)) {
	util.log("Successfully authenticated with key " + key);
      } else if(key) {
	util.log("Invalid key supplied: " + key);
	return;
      }	else {
	util.log("No key supplied");
	return;
      }
    }
    channel.subscribe(this);
  },
  
  unsubscribe: function(name){
    util.log("Client unsubscribing from: " + name);

    var channel = Channel.find(name);
    channel.unsubscribe(this);
  },
    
  write: function(message){
    if (message.except) {
      var except = Array.makeArray(message.except);
      if (except.include(this.session_id))
        return false;
    }
    
    this.connection.write(message);
  },
  
  disconnect: function(){
    // Unsubscribe from all channels
    Channel.unsubscribe(this);
  }
});
