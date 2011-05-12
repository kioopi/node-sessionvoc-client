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

var sessionvoc = require('sessionvoc-client.js'),
    assert = require('assert'),
    should = require('should');

/**
 * Working client
 */

var store1 = sessionvoc.createClient({ host: 'localhost', port: 8208 });

/**
 * Broken client
 */

var store2 = sessionvoc.createClient({ host: 'localhost', port: 1234 });

/* *****************************************************************************
 * Tests
 * ************************************************************************** */

module.exports = {
  'dummy': function() {
  },

  'exports()': function() {
    sessionvoc.createClient.should.be.a('function');
  },



  'crud()': function() {
    create1(store1,
            function(sid) {
              read1(store1, sid,
                    function(session) {
                      update1(store1, session.sid,
                              function(session) {
                                read1(store1, session.sid,
                                      function(session) {
                                        assert.isNotNull(session.transData.message);
                                        assert.equal(session.transData.message, 'Test Message');

                                        update2(store1, session.sid,
                                                function(session) {
                                                  read1(store1, session.sid,
                                                        function(session) {
                                                          assert.equal(session.transData.message, '');

                                                          delete1(store1, session.sid,
                                                                  function(result) {
                                                                    read2(store1, session.sid,
                                                                          function() {
                                                                          });
                                                                  });
                                                        });
                                                });

                                      });
                                   });
                      });
               });
  },



  'read-unknown()': function() {
    read2(store1, 'unknown',
          function(session) {
            assert.equal(session.error, true);
          });
  },



  'login()': function() {
    create1(store1,
            function(sid) {
              login1(store1, sid,
                     function(session) {
                       logout1(store1, sid,
                               function(session) {
                               });
                     });
            });
  },



  'crud-form()': function() {
    create1(store1, function(sid) {
              fcreate1(store1, sid,
                       function(sid, fid) {
                         fread1(store1, sid, fid,
                                function(form) {
                                  assert.equal(form, 'TEST FORM DATA');

                                  fupdate1(store1, sid, fid,
                                           function(sid, fid) {
                                             fread1(store1, sid, fid,
                                                    function(form) {
                                                      assert.equal(form, 'NEW TEST DATA');

                                                      fdelete1(store1, sid, fid,
                                                               function(result) {
                                                                 fread2(store1, sid, fid,
                                                                        function() {
                                                                        });
                                                               });
                                                    });
                                           });
                                });
                       });
            });
  },



  /*
  'nonce()': function() {
    ncreate1(store1, function(nonce) {
               nread1(store1, nonce, function(unused) {
                        assert.equal(unused, true);

                        nread1(store1, nonce, function(unused) {
                                 assert.equal(unused, false);
                               });
                      });
             });
  }
  */
};

/* *****************************************************************************
 * Helper functions
 * ************************************************************************** */

function create1 (store, next) {
  store.createSession(function(err, sid, result) {
                        assert.isNull(err);
                        assert.isNotNull(result);
                        assert.isNotNull(result.sid);
                        
                        console.log('[SUCCESS] created session: ' + sid);
                        
                        next(sid);
                      });
}



function read1 (store, sid, next) {
  store.loadSession(sid, function(err, result) {
                      assert.isNull(err);
                      assert.isNotNull(result);

                      assert.equal(result.sid, sid);
                      
                      console.log('[SUCCESS] read session: ' + result.sid);
                      
                      next(result);
                    });
}
    


function read2 (store, sid, next) {
  store.loadSession(sid, function(err, result) {
                      assert.isNotNull(err);
                      
                      console.log('[SUCCESS] read session failed: ' + JSON.stringify(err));
                      
                      next(err);
                    });
}
    


function update1 (store, sid, next) {
  var n = { transData: { message: 'Test Message' } };
      
  store.updateSession(sid, n, function(err, result) {
                        assert.isNull(err);
                        assert.isNotNull(result);

                        assert.equal(result.sid, sid);
                        assert.equal(result.transData.message, 'Test Message');
                        
                        console.log('[SUCCESS] update session: ' + result.sid);
                        
                        next(result);
                      });
}



function update2 (store, sid, next) {
  var n = { transData: { message: '' } };
      
  store.updateSession(sid, n, function(err, result) {
                        assert.isNull(err);
                        assert.isNotNull(result);

                        assert.equal(result.sid, sid);
                        assert.equal(result.transData.message, '');
                        
                        console.log('[SUCCESS] update session: ' + result.sid);
                        
                        next(result);
                      });
}

    

function delete1 (store, sid, next) {
  store.deleteSession(sid, function(err, result) {
                        assert.isNull(err);
                        assert.isNotNull(result);
                        assert.equal(result.deleted, true);
                        
                        console.log('[SUCCESS] delete session: ' + sid);
                        
                        next(result);
                      });
}



function login1 (store, sid, next) {
  store.login(sid, 'plain', 'plain', function(err, result) {
                assert.isNull(err);
                assert.isNotNull(result);
                assert.isNotNull(result.userData);
                
                console.log('[SUCCESS] login session: ' + sid);
                       
                next(result);
              });
}
    

function logout1 (store, sid, next) {
  store.logout(sid, function(err, result) {
                 assert.isNull(err);
                 assert.isNotNull(result);
                 assert.isNull(result.userData);
                 
                 console.log('[SUCCESS] logout session: ' + sid);
                 
                 next(result);
               });
}
    


function fcreate1 (store, sid, next) {
  store.createFormdata(sid, 'TEST FORM DATA', function(err, result) {
                         assert.isNull(err);
                         assert.isNotNull(result);
                         assert.isNotNull(result.fid);

                         assert.equal(result.sid, sid);
                         
                         console.log('[SUCCESS] created form data: ' + JSON.stringify(result));
                         
                         next(result.sid, result.fid);
                       });
}



function fread1 (store, sid, fid, next) {
  store.loadFormdata(sid, fid, function(err, result) {
                       assert.isNull(err);
                       assert.isNotNull(result);
                       
                       console.log('[SUCCESS] read form data: ' + result);
                       
                       next(result);
                     });
}



function fread2 (store, sid, fid, next) {
  store.loadFormdata(sid, fid, function(err, result) {
                       assert.isNotNull(err);
                       
                       console.log('[SUCCESS] read form data failed: ' + JSON.stringify(err));
                       
                       next(err);
                     });
}



function fupdate1 (store, sid, fid, next) {
  var n = 'NEW TEST DATA';
      
  store.updateFormdata(sid, fid, n, function(err, result) {
                         assert.isNull(err);
                         assert.isNotNull(result);

                         assert.equal(result.sid, sid);
                         assert.equal(result.fid, fid);
                         assert.equal(result.updated, true);
                         
                         console.log('[SUCCESS] update form data: ' + result.fid);
                         
                         next(result.sid, result.fid);
                       });
}



function fdelete1 (store, sid, fid, next) {
  store.deleteFormdata(sid, fid, function(err, result) {
                         assert.isNull(err);
                         assert.isNotNull(result);
                         assert.equal(result.deleted, true);
                         
                         console.log('[SUCCESS] delete form data: ' + sid);
                         
                         next(result);
                       });
}



function ncreate1 (store, next) {
  store.createNonce(function(err, result) {
                      assert.isNull(err);
                      assert.isNotNull(result);

                      console.log('[SUCCESS] create nonce: ' + result);

                      next(result);
                    });
}



function nread1 (store, nonce, next) {
  store.readNonce(nonce, function(err, result) {
                    assert.isNull(err);
                    assert.isNotNull(result);

                    console.log('[SUCCESS] read nonce: ' + result);
                    
                    next(result);
                  });
}
