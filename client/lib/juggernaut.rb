require "redis"
require "json"

# Attempt to provide Engine to Rails
require "juggernaut/rails/engine"

module Juggernaut
  EVENTS = [
    "juggernaut:subscribe", 
    "juggernaut:unsubscribe", 
    "juggernaut:custom"
  ]

  def create_key(channels)
    require 'simple_uuid'
    key = SimpleUUID::UUID.new.to_guid
    Juggernaut.command(channels, {
      :enableAuth => true,
      :addKey => key
    })
    key
  end
 
  def command(channels, commands)
    message = ({:channels => Array(channels).uniq, :commands => commands})
    redis.publish(key, message.to_json)
  end

  def options
    @options ||= {}
  end
  
  def options=(val)
    @options = val
  end
  
  def url=(url)
    options[:url] = url
  end
  
  def publish(channels, data, options = {})
    message = ({:channels => Array(channels).uniq, :data => data}).merge(options)
    redis.publish(key, message.to_json) 
  end
  
  def subscribe
    Redis.connect(options).subscribe(*EVENTS) do |on|
      on.message do |type, msg|
        yield(type.gsub(/^juggernaut:/, "").to_sym, JSON.parse(msg))
      end
    end
  end
  
  protected
    def redis
      @redis ||= Redis.connect(options)
    end
  
    def key(*args)
      args.unshift(:juggernaut).join(":")
    end

    extend self
end
