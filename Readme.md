# sessionvoc-client

sessionvoc-client is client for a secure, reliable, external session
database, the SessionVOC (see http://www.worldofvoc.com/ for details).

## Installation

via npm:

    $ npm install sessionvoc-client

## Example

    var svc = require('sessionvoc-client');
    var client = svc.createClient().on('ready', function() {console.log('ready for business');});
    
    client.createSession(function(err,data) {console.log("sid = " + data);});
