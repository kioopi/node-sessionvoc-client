# sessionvoc-client

sessionvoc-client is client for a secure, reliable, external session
database, the SessionVOC (see http://www.worldofvoc.com/ for details).

## Installation

via npm:

    $ npm install sessionvoc-client

## Example

    var sessionvoc = require('sessionvoc-client'); 
    var svoc = sessionvoc.createClient('localhost', 8208).on("ready", function(){ 
      // ready for business. 
    }); 
