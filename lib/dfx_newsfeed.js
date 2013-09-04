/*
    DreamFace DFX News feed
    Version: 1.0
    Author: DreamFace Interactive
    License: Commercial
    (c) 2013 DreamFace Interactive, all rights reserved.
*/

var mongoc = require('mongodb').MongoClient;

var getAll = function( req, callback ) {
    mongoc.connect('mongodb://localhost:27017/dreamface_db', function(err, db) {
        if(err) { return console.dir(err); }
    
        // TODO: tenant id as a session variable
        var m_newsfeed = db.collection('tests'+'.newsfeed');
    
        m_newsfeed.find({'visibility': 'visible'}).toArray( function(err, news_results) {
            if ( callback!==null ) {
                callback( err, app_results );
            }
        });
    });
};
                   
var get = function( req, query, callback ) {
    mongoc.connect('mongodb://localhost:27017/dreamface_db', function(err, db) {
        if(err) { return console.dir(err); }
    
        // TODO: tenant id as a session variable
        var m_newsfeed = db.collection('tests'+'.newsfeed');
    
        m_newsfeed.find(query, {'sort': [['newsDate','desc']]}).toArray( function(err, news_results) {
            var i=0, j=0;
            if ( news_results!==null ) {
                // TODO: tenant id as a session variable
                var m_users = db.collection('tests'+'.users');
                m_users.find( {'role': 'admin'} ).toArray( function(err, user_results) {
                    for (i=0; i<news_results.length; i++) {
                        var user = null;
                        for (j=0; j<user_results.length; j++) {
                            if (user_results[j].id == news_results[i].newsOwnerId) {
                                news_results[i].persona = user_results[j].properties;
                            }
                        }
                    }
                    if ( callback!==null ) {
                        callback( err, news_results );
                    }
                });
            }
        });
    });
};

exports.getAll = getAll;
exports.get = get;