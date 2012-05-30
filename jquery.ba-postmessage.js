/*!
postMessage (optionally, jQuery plugin) - v2.0 - 2012
http://github.com/willowsystems/jquery-postmessage
 
Copyright (c) 2012 Willow Systems Corporation (willow-systems.com)
Copyright (c) 2009 "Cowboy" Ben Alman

Dual licensed under the MIT and GPL v.2 licenses. 

See source distribution bundle for full licenses texts,
or, lacking that, see http://benalman.com/about/license/
*/

// Script: postMessage: Cross-domain messaging library
//
// *Version: 2.0, Last updated: 2012-05-29*
// 
// Project Home - https://github.com/willowsystems/jquery-postmessage
// 
// About: License
// 
// Copyright (c) 2012 Willow Systems Corporation (willow-systems.com)
// Copyright (c) 2009 "Cowboy" Ben Alman
//
// Dual licensed under the MIT and GPL v.2 licenses. 
//
// See source distribution bundle for full licenses texts, or, lacking that, see http://benalman.com/about/license/
//
// About: Examples
// 
// This working example, complete with fully commented code, illustrates one
// way in which this plugin can be used.
// 
// Iframe resizing - http://benalman.com/code/projects/jquery-postmessage/examples/iframe/
// 
// About: Support and Testing
// 
// Information about what version or versions of jQuery this plugin has been
// tested with and what browsers it has been tested in.
// 
// Browsers Tested - Internet Explorer 8,9, recent Firefox, Safari, Chrome, Opera.
// 
// About: Release History
// 
// 2.0 - (2012-05-29) Gutted hash-based signalling. (no worky anymore. browsers are patched)
//                    Switched to PubSub-based event handling to allow multiple listeners,
//                    simplify unbinding, allow for multi-message listeners.
//                    Removed object serialization (new browsers can pass objects)
//                    It's no longer a jQuery plugin
// 0.5 - (9/11/2009) Improved cache-busting
// 0.4 - (8/25/2009) Initial release

(function($){
  
  // Method: jQuery.postMessage
  'use strict'

  // 
  // This method will call window.postMessage if available, setting the
  // targetOrigin parameter to the base of the target_url parameter for maximum
  // security in browsers that support it. 
  // 
  // Usage:
  // 
  // > jQuery.postMessage( message, target_url [, target ] );
  // 
  // Arguments:
  // 
  //  message - (Object) An object to be passed to the other window
  //  target_url - (String) The URL of the other frame this window is
  //    attempting to communicate with. If given, this must be the exact URL
  //    of the other window.
  //  target - (Object) A reference to the other frame this window is
  //    attempting to communicate with. If omitted, defaults to `parent`.
  // 
  // Returns:
  // 
  //  True if messaging is supported and message has been (apparently) sent.
  //  False otherwise

  function postMessageFn( message, target_url, target ) {
    if ( window['postMessage'] ) {
      // Default to parent if unspecified.
      if (target === undef){
        target = parent
      }
        
      if (target_url === undef) {
        // User explicitly chose not to care about domain of
        // message recepient. Let's follow the command:
        target_url = '*'
      } else {
        // Messaging domain matching happens on
        //  prefix://fqdn:port 
        // chopping off everything else.
        target_url = target_url.replace( /([^:]+:\/\/[^\/]+).*/, '$1' )
      }

      // The browser supports window.postMessage, so call it with a targetOrigin
      // set appropriately, based on the target_url parameter.
      target['postMessage']( message, target_url );

      return true
    } 
    return false
  }

  function PubSub(){
      'use strict'
      /*  @preserve 
      -----------------------------------------------------------------------------------------------
      JavaScript PubSub library
      2012 (c) ddotsenko@willowsystems.com
      based on Peter Higgins (dante@dojotoolkit.org)
      Loosely based on Dojo publish/subscribe API, limited in scope. Rewritten blindly.
      Original is (c) Dojo Foundation 2004-2010. Released under either AFL or new BSD, see:
      http://dojofoundation.org/license for more information.
      -----------------------------------------------------------------------------------------------
      */
      this.topics = {};
      /**
       * Allows caller to emit an event and pass arguments to event listeners.
       * @public
       * @function
       * @param topic {String} Name of the channel on which to voice this event
       * @param **arguments Any number of arguments you want to pass to the listeners of this event.
       */
      this.publish = function(topic, arg1, arg2, etc) {
          'use strict'
          if (this.topics[topic]) {
              var currentTopic = this.topics[topic]
              , args = Array.prototype.slice.call(arguments, 1)
              , toremove = []
              , fn
              , i, l

              for (i = 0, l = currentTopic.length; i < l; i++) {
                  // once flag set?
                  if (currentTopic[i][1]){
                    fn = currentTopic[i][0]
                    currentTopic[i][0] = function(){}
                    toremove.push(i)
                  } else {
                    currentTopic[i][0].apply(null, args)
                  }
              }
              for (i = 0, l = toremove.length; i < l; i++) {
                currentTopic.splice(toremove[i], 1)
              }
          }
      }
      /**
       * Allows listener code to subscribe to channel and be called when data is available 
       * @public
       * @function
       * @param topic {String} Name of the channel on which to voice this event
       * @param callback {Function} Executable (function pointer) that will be ran when event is voiced on this channel.
       * @param once {Boolean} (optional. False by default) Flag indicating if the function is to be triggered only once.
       * @returns {Object} A token object that cen be used for unsubscribing.  
       */
      this.subscribe = function(topic, callback, once) {
          'use strict'
          if (!this.topics[topic]) {
              this.topics[topic] = [[callback, once]];
          } else {
              this.topics[topic].push([callback,once]);
          }
          return {
              "topic": topic,
              "callback": callback
          };
      };
      /**
       * Allows listener code to unsubscribe from a channel 
       * @public
       * @function
       * @param token {Object} A token object that was returned by `subscribe` method 
       */
      this.unsubscribe = function(token) {
          if (this.topics[token.topic]) {
              var currentTopic = this.topics[token.topic]
              
              for (var i = 0, l = currentTopic.length; i < l; i++) {
                  if (currentTopic[i][0] === token.callback) {
                      currentTopic.splice(i, 1)
                  }
              }
          }
      }
  }
  
  // Method: jQuery.receiveMessage
  // 
  // Register a callback for a window.postMessage call. If window.postMessage
  // is supported and source_origin is specified, the message source window 
  // URL will be checked against this URL before. 
  // 
  // Note that for simplicity's sake, only a single callback can be registered
  // at one time. Passing no params will unbind this event 
  // and calling this method a second time with another callback will
  // unbind the event first, before binding the new callback.
  // 
  // Also note that if window.postMessage is available, the optional
  // source_origin param will be used to test the event.origin property. From
  // the MDC window.postMessage docs: This string is the concatenation of the
  // protocol and "://", the host name if one exists, and ":" followed by a port
  // number if a port is present and differs from the default port for the given
  // protocol. Examples of typical origins are https://example.org (implying
  // port 443), http://example.net (implying port 80), and http://example.com:8080.
  // 
  // Usage:
  // 
  // > jQuery.receiveMessage( callback [, origin_url ] [, persistent ] );
  // 
  // Arguments:
  // 
  //  callback - (Function) This callback will execute whenever a <jQuery.postMessage>
  //    message is received, provided the source_origin matches. If callback is
  //    omitted, any existing receiveMessage event bind or polling loop will be
  //    canceled.
  //  origin_url - (String) If window.postMessage is available and this value
  //    is not equal to the event.origin property, the callback will not be
  //    called.
  //    Defaults to '*' (i.e. will listen to events from all origins).
  //  persistent - (Boolean) If True, will run until event listener is
  //    unbound. (See return value). If False, callback runs only once. 
  //    False by default.
  // 
  // Returns:
  // 
  //  Callable object (function) that you can run to unbind the callback. Returned
  //    only when the browser is found to support the messaging.
  //  Undefined otherwise

  var listeners
  function receiveMessageFn( callback, origin_url, persistent ) {
    'use strict'

    var undef

    if ( window['postMessage'] && callback) {

      // First, spinning up global listener for "Message" events.
      // It will be one and only. Will publish events on proper
      // chanlles within internal - `listeners` - PubSub instance.
      if (!listeners) {
        listeners = new PubSub()

        function global_callback(e) {
          listeners.publish(e.origin, e.data, e );
        };

        if ( window['addEventListener'] ) {
          window['addEventListener']( 'message', global_callback, false );
        } else {
          window['attachEvent']( 'onmessage', global_callback );
        }
      }

      if (origin_url === undef) {
        // User explicitly chose not to care about domain of
        // message recepient. Let's follow the command:
        origin_url = '*'
      } else if (typeof origin_url === 'string'){
        // Messaging domain matching happens on
        //  prefix://fqdn:port 
        // chopping off everything else.
        origin_url = origin_url.replace( /([^:]+:\/\/[^\/]+).*/, '$1' )
      } else {
        // a function? 
        // whatever it is, we don't support you.
        throw new Error(
          "We don't support functions as origin conformance resolvers. Strings only.\n" + 
          "Instead, just register your callback with '*' origin and make it decide" + 
          "if it wants to handle it"
        )
      }

      var token = listeners.subscribe(origin_url, callback, !persistent)

      return function(){
        listeners.unsubscribe(token)
      }
    }
    return undef
  }

  
})(jQuery);
