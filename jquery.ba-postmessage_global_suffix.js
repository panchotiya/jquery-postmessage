
  // if we have global jQuery, we attach to it:
  if (window['jQuery']) {
    window['jQuery']['receiveMessage'] = API['receiveMessage']
    window['jQuery']['postMessage'] = API['receiveMessage']
  } 
  // else we attach to some other global:
  else {
  	window['BAPostMessage'] = API
  }

})();