/*!
 * jQuery postMessage - v0.5 - 9/11/2009
 * http://benalman.com/projects/jquery-postmessage-plugin/
 * 
 * Copyright (c) 2009 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */

// Script: jQuery postMessage: Cross-domain scripting goodness
//
// *Version: 0.5, Last updated: 9/11/2009*
// 
// Project Home - http://benalman.com/projects/jquery-postmessage-plugin/
// GitHub       - http://github.com/cowboy/jquery-postmessage/
// Source       - http://github.com/cowboy/jquery-postmessage/raw/master/jquery.ba-postmessage.js
// (Minified)   - http://github.com/cowboy/jquery-postmessage/raw/master/jquery.ba-postmessage.min.js (0.9kb)
// 
// About: License
// 
// Copyright (c) 2009 "Cowboy" Ben Alman,
// Dual licensed under the MIT and GPL licenses.
// http://benalman.com/about/license/
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
// jQuery Versions - 1.3.2
// Browsers Tested - Internet Explorer 6-8, Firefox 3, Safari 3-4, Chrome, Opera 9.
// 
// About: Release History
// 
// 0.5 - (9/11/2009) Improved cache-busting
// 0.4 - (8/25/2009) Initial release

(function($){
  '$:nomunge'; // Used by YUI compressor.
  
  // A few vars used in non-awesome browsers.
  var interval_id,
    last_hash,
    cache_bust = 1,
    
    // A var used in awesome browsers.
    rm_callback,
    
    // A few convenient shortcuts.
    FALSE = !1,
    
    // Reused internal strings.
    postMessage = 'postMessage',
    addEventListener = 'addEventListener',
    
    p_receiveMessage,
    
    has_postMessage = window[postMessage]
  
  // Method: jQuery.postMessage
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
  
  $[postMessage] = function( message, target_url, target ) {
    if ( has_postMessage ) {
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
      target[postMessage]( message, target_url );

      return true
    } 
    return false
  };
  
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
  // > jQuery.receiveMessage( callback [, source_origin ] [, delay ] );
  // 
  // Arguments:
  // 
  //  callback - (Function) This callback will execute whenever a <jQuery.postMessage>
  //    message is received, provided the source_origin matches. If callback is
  //    omitted, any existing receiveMessage event bind or polling loop will be
  //    canceled.
  //  source_origin - (String) If window.postMessage is available and this value
  //    is not equal to the event.origin property, the callback will not be
  //    called.
  //  source_origin - (Function) If window.postMessage is available and this
  //    function returns false when passed the event.origin property, the
  //    callback will not be called.
  // 
  // Returns:
  // 
  //  True if messaging is supported and message has been (apparently) sent.
  //  False otherwise
  
  $.receiveMessage = p_receiveMessage = function( callback, source_origin ) {
    if ( has_postMessage ) {
      if ( callback ) {


        // Unbind an existing callback if it exists.
        rm_callback && p_receiveMessage();
        
        // Bind the callback. A reference to the callback is stored for ease of
        // unbinding.
        rm_callback = function(e) {
          if ( ( typeof source_origin === 'string' && e.origin !== source_origin )
            || ( $.isFunction( source_origin ) && source_origin( e.origin ) === false ) ) {
            return false;
          }
          callback( e );
        };
      }
      
      if ( window[addEventListener] ) {
        window[ callback ? addEventListener : 'removeEventListener' ]( 'message', rm_callback, false );
      } else {
        window[ callback ? 'attachEvent' : 'detachEvent' ]( 'onmessage', rm_callback );
      }
     
      return true 
    }
    return false
  };
  
})(jQuery);
