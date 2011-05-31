/*!
 * Client for a SessionVOC
 *
 * (see http://www.worldofvoc.com)
 *
 *  DISCLAIMER
 * 
 *  Copyright 2010-2011 triagens GmbH, Cologne, Germany
 * 
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 * 
 *  Copyright holder is triAGENS GmbH, Cologne, Germany
 */


/**
 * Module dependencies.
 */

var http = require('http'),
    events = require('events'), 
    sys = require('sys');

/**
 * Exports the constructors.
 */

module.exports.Client = Client;
module.exports.createClient = connect;

/**
 * Exports the debugging flag.
 */

exports.debug = false;



/* *****************************************************************************
 * Constants and variables
 */

/**
 * Client-server communication methods.
 */

var COMM_NONE = 0,
    COMM_SIMPLE = 1,
    COMM_CHALLENGE_RESPONSE = 2;



/* *****************************************************************************
 * Client constructors
 */

/**
 * Creates a new client.
 */

function connect (host, port) { 
  return (new Client({'host': host, 'port': port})).loadInfo(); 
} 

/**
 * Initializes a new `Client`. You can define an options array to specifiy
 * the host and port.
 *
 * @param {Object} options
 * @api public
 */

function Client (options) {
  events.EventEmitter.call(this);  // initialize the "parent" EventEmitter

  Object.defineProperty(this, 'host', { value: (options && options.host) || 'localhost' });
  Object.defineProperty(this, 'port', { value: (options && options.port) || 8208 });

  this.description = 'Client to interface with a SessionVOC';
  this.datainfo = null;
};

// inherit from EventEmitter to deal with async initialisation of voc
Client.prototype = Object.create(events.EventEmitter.prototype);  



/* *****************************************************************************
 * Client methods
 */

/**
 * Requests the Info-Object from the server. When the Object is
 * recieved, the "ready" event is emitted and the callback is executed
 *
 * @param {function} fn
 * @api public
 */

Client.prototype.loadInfo = function (fn) {
  if (this.datainfo) return fn(null); 
  this._request(
    'GET', 
    '/datainfo',
    function (err, data) {
      if (err){
        this.emit('error', err); 
        fn && fn(err); 
        return 0; 
      } 

      this.datainfo = JSON.parse(data); 
      this.emit('ready', data); 
      fn && fn(null, data);
    }.bind(this) 
  );
  return this; // chainability
}; 

/**
 * Creates a new session. Takes a callback function fn(err, sid) that
 * will be passed a session-id.
 *
 * @param {function} next
 */

Client.prototype.createSession = function (next) {
  this._request('POST', '/session', function(err, data){
    if (err) return next(err); // TODO should this emit error as well?

    try { 
      next(null, JSON.parse(data).sid); 
    }
    catch (err) { 
      next(err); 
    } 
  });  
};

/**
 * Loads an existing session.
 *
 * @param {string} sid
 * @param {function} next
 */

Client.prototype.loadSession = function (sid, next) {
  this._request('GET', '/session/' + sid, function(err, data){ 
    if (err){ 
      try { 
        var jsondata = JSON.parse(data); 

        if (jsondata.message === "unknown session identifier"){ 
          return next('Session not found');  
        } 
      }
      catch (err2) { 
      } 
      return next(err); 
    } 
    next(null, JSON.parse(data));  
  });  
};

/**
 * Updates an existing session.
 *
 * @param {string} sid
 * @param {Object} data
 * @param {function} next
 */

Client.prototype.updateSession = function (sid, data, next) {
  next = next || function(){};
  if(typeof data === 'string'){ 
    try { 
      var data = JSON.parse(data); 
    } catch (err) { 
      return next(err); 
    } 
  } 

  // put only the transient and/or user-data into the request body.
  // meta-data like sid and urlsecret dont need to be sent.
  var sdata = {}; 
  if(data.transData) sdata.transData = data.transData;
  if(data.userData) sdata.userData = data.userData;

  this._request('PUT', '/session/' + sid, JSON.stringify(sdata), function (err, data) { 
    if (err) { 
      try { 
        var jsondata = JSON.parse(data); 
        if(jsondata.message === "unknown session identifier"){ 
          return next('Session not found');  
        } 
      } catch (err2) { 
      } 
      return next(err);
    } 

    next(null);
  }); 

};

/**
 * Deletes an existing session.
 *
 * @param {string} sid
 * @param {function} next
 */

Client.prototype.deleteSession = function (sid, next) {
  this._request('DELETE', '/session/' + sid, next); 
};

/**
 * Logs in a session without a preceding challenge. 
 *
 * @param {string} sid
 * @param {string} username
 * @param {string} password
 * @param {function} next
 */

Client.prototype.login = function (sid, username, password, next) {
  this._request('PUT', '/session/' + sid + '/authenticate', JSON.stringify({ 'uid' : username, 'password' : password }), next); 
}

/**
 * Logs out a session.
 *
 * @param {string} sid
 * @param {function} next
 */

Client.prototype.logout = function (sid, next) {
  this._request('PUT', '/session/' + sid + '/logout', next); 
}

/**
 * Creates a new form.
 *
 * @param {string} sid
 * @param {string} data
 * @param {function} next
 */

Client.prototype.createFormdata = function (sid, data, next) {
  this._request('POST', '/formdata/' + sid, JSON.stringify(data), next); 
};

/**
 * Loads an existing form.
 *
 * @param {string} sid
 * @param {string} fid
 * @param {function} next
 */

Client.prototype.loadFormdata = function (sid, fid, next) {
  this._request('GET', '/formdata/' + sid + '/' + fid, next); 
};

/**
 * Updates an existing form.
 *
 * @param {string} sid
 * @param {string} fid
 * @param {string} data
 * @param {function} next
 */

Client.prototype.updateFormdata = function (sid, fid, data, next) {
  this._request('PUT', '/formdata/' + sid + '/' + fid, JSON.stringify(data), next); 
};

/**
 * Deletes an existing form.
 *
 * @param {string} sid
 * @param {string} fid
 * @param {function} next
 */

Client.prototype.deleteFormdata = function (sid, fid, next) {
  this._request('DELETE', '/formdata/' + sid + '/' + fid, next); 
};

/**
 * Sends a request to the Voc-Server. Should not directly be used.
 *
 * @param {string} method
 * @param {string} path
 * @param {object} param (optional) 
 * @param {function} fn (optional) 
 */

Client.prototype._request = function (method, path, data, fn) { 

  // make data  and fn optional
  if(!fn && typeof data == 'function') fn = data; 
  if(!fn) fn = function(){}; 

  var self = this; 

  var options = { 
    host: this.host, 
    port: this.port, 
    method: method, 
    path: path, 
    headers: {
      'connection': 'keep-alive',
    }
  }; 

  options.headers['content-length'] = (data && typeof data !== 'function') ? data.length : 0;

  var requ = http.request(options, function (res) {
    var body = '';
    res.setEncoding('utf8');

    res.on('error', function (err) {
      fn(err);
      self.emit('error', err); 
    });

    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function () {
      debuglog('status code: ' + res.statusCode);
      
      var data = body;

      try {
        if (res.statusCode == 200) {
          fn(null, data);
        }
        else {
          fn(data);
        }
      } 
      catch (err) {
        debuglog('ERROR (callback): ' + JSON.stringify(err));
        return fn(err);
      }
    });
  });

  requ.on('error', function (err) {
    debuglog('ERROR (connect): ' + JSON.stringify(err));
    self.emit('error', err); 
    fn(err);
  });

  // write data in the request body
  if (data && typeof data !== 'function') {
    debuglog('sessionvocRequest body: ' + JSON.stringify(data));
    requ.write(data);
  }

  requ.end();
}; 

// functions for use from the shell and debugging.

Client.prototype.printSession = function (sid) {
  this.loadSession(sid, function(err, data){ 
    if(err){ 
      console.log('Could not load session.', err); 
    } else { 
      console.log(data);
    } 
  });
}; 


Client.prototype.setValue = function (sid, key, val, dataset) {
  dataset = dataset || 'transData'; 
  if(dataset != 'transData' && dataset != 'userData'){ 
    console.log("'" + dataset  + "' is not part of a session."); 
    return 0;
  } 
  this.loadSession(sid, function(err, data){
    if(err){ 
      console.log('Could not load session', err); 
    } else { 
      data[dataset][key] = val;  
      this.updateSession(sid, data); 
    } 
  }.bind(this)); 
} 



/* *****************************************************************************
 * Private functions
 */

/**
 * Log informational output if debug flag is set.
 */

function debuglog (msg) {
  if (exports.debug) {
    console.log('[sessionvoc-client] ' + msg);
  }
}
