var mongoc = require('mongodb').MongoClient,
    mongodb = require('mongodb'),
    //T = require('../../../p/tools/d.js'),
    jade = require('jade'),
    Q = require('q'),
    QFS = require('q-io/fs');

var MONGO_HOST = 'localhost',
    MONGO_PORT = 27017,
    MONGO_USER_DBNAME_PREFIX = 'dreamface_demo_',
    PATH_TO_TEMPLATES = 'studio/templates/databases/',
    actions = {};

actions.showDatabase = function (p) {

    return getCollections(p.db)
    .then(function(collections){
        return { data: {
            database    : p.req.params.dbName,
            collections : filterCollections(collections)
        }};
    })
}

actions.showCollection = function (p) {
    return getDocuments(p.db, p.req.params.clName)
    .then(function(docs){
        return { data: {
            documents  : docs,
            database   : p.req.params.dbName,
            collection : p.req.params.clName
        }}
    })
}

actions.insertDocument = function (p) {
    var doc = JSON.parse(p.req.body.doc),
        id = doc['_id'];
    return connectCollection(p.db, p.req.params.clName)
    .then(function(collection){
        var D = Q.defer();
        if ( ! id ) {
            collection.insert(doc, {safe: true}, function(error, records){
                //T.l('created: ' + records[0]['_id']);
                return error
                    ? D.reject({ data: { error: error } })
                    : D.resolve({ data: { id: records[0]['_id'] } });
            });
        } else {
            //T.l('UPDATING document', 'ID: ' + id, 'DOC: ', doc);
            collection.save(doc, {safe:true}, function(error, result){
                return error
                    ? D.reject({ data: { error: error } })
                    : D.resolve({ data: { result: result } });
            });
        
        }
        return D.promise;
    })
}

actions.removeDocument = function (p) {
    var id = p.req.params.id;
    return connectCollection(p.db, p.req.params.clName)
    .then(function(collection){
        var D = Q.defer();
        //T.l('removing: ' + id);
        collection.remove({'_id': mongodb.ObjectID(id)}, {safe: true}, function(error, count){
            //T.l('removed');
            return error
                ? D.reject({ data: { error: error } })
                : D.resolve({ data: { success: true } });
        })
        return D.promise;
    })
}

actions.removeCollection = function (p) {
    var D = Q.defer();
    p.db.dropCollection(p.req.params.clName, function(error, result){
        return error
            ? D.reject({ data: { error: error } })
            : D.resolve({data:{
                database   : p.req.params.dbName,
                collection : p.req.params.clName
            }});
    })
    return D.promise;
}

actions.createCollection = function (p) {
    var clName = p.req.params.clName;
    if ( ! isNameValid(clName) ) return Q.reject({data: {error: 'invalid collection name'}});
    var D = Q.defer();
    p.db.createCollection(clName, function(error, collection){
        return error
            ? D.reject({ data: { error: error } })
            : D.resolve( { data: {
                database   : p.req.params.dbName,
                collection : clName
            }});
    })
    return D.promise;
}

actions.removeDatabase = function (p) {
    var D = Q.defer();
    p.db.dropDatabase(function(error, result) {
        return error
            ? D.reject({ data: { error: error } })
            : D.resolve({ data: {
                database : p.req.params.dbName
            }});
    })
    return D.promise;
}

actions.getTemplates = function (p) {
    var templates = {},
        promises = [];
    return QFS.list( PATH_TO_TEMPLATES )
    .then(function(list){
        for ( var i = list.length; i; ) (function(i){
            if ( ! /\.jade$/.test( ( list[i]) ) ) return;
            promises.push(
                QFS.read( PATH_TO_TEMPLATES + list[i] )
                .then(function( text ){
                    templates[ list[i].replace(/\.jade$/, '') ] = text;
                })
            );
        })(--i);
        return Q.all(promises);
    })
    .then(function(){
        return { data: templates}
    })
}

actions.getTree = function (p) {
    return getFullDatabasesList(p.db)
    .fail(function(){
        //T.l('[databases]: getFullDatabasesList rejects');
    })
    .then(function (databases) { return filterDemoDatabasesForTheTenant(databases, p.req.session.tenant.id) })
    .then(function(dbs){
        p.db.close();
        var promises = [],
            tree = {};
        for ( var i = dbs.length; i; ) (function(i){
            promises.push(
                connect(dbs[i].name, p.req.session.tenant.id) 
                .then(function(db){
                    return getCollections(db)
                    .then(function(collections){
                        db.close;
                        tree[dbs[i].name] = {};
                        tree[dbs[i].name].size = dbs[i].sizeOnDisk;
                        tree[dbs[i].name].collections = filterCollections(collections);
                    })
                    .fail(function(error){
                        console.log('ERROR [databases.getTree]: ' + error);
                        db.close;
                        dbs[i].collections = [];
                    })
                })
            )
        })(--i);

        return promises.length === 0 ? Q.resolve([]) : Q.all(promises)
        .then(function(){
            return { data: { tree : tree } }
        })
        .fail(function(error){
            console.log('ERROR [databases.getTree]: ' + error);
            return { data: { error : '[dfx_databases.actions.getTree]: ' + error } }
        })
        .fin(function(){ dbs = null })
    })
}

exports.action = function ( req, res ) {
    //T.l('[databases]: asking for ' + req.params.action + ', for tenant: ' + req.session.tenant.id);
    if ( !actions[req.params.action] ) {
        return doAnswer( res, '', {error:'unknown action: ' + req.params.action});
    }
    // TODO is the tenant valid (valid as a string)

    connect(req.params.dbName, req.session.tenant.id)
    .then(function(db){
        //T.l('[databases]: connected');
        actions[req.params.action]({ req:req, db:db })
        .then(function(answ){ doAnswer(res, ( answ.templ || '' ), answ.data) })
        .fin(db.close)
    }).done();
}

function filterCollections ( collections ) {
    collections = collections.filter(function(e){
        return !/\.system\.indexes$/.test(e.name);
    }).map(function(c){
        return { name : c.name.replace(/^.+\.([^.]+)$/, '$1') };
    });

    // make object
    var obj = {};
    for ( var k = collections.length; k; ) obj[collections[--k].name] = null;

    return obj;
}

function isNameValid ( clName ) {
    return /^[a-z0-9_-]+$/i.test(clName);
}

function connectCollection (db, clName) {
    var D = Q.defer();
    db.collection(clName, function(error, collection){
        return error ? D.reject(error) : D.resolve(collection);
    });
    return D.promise;
}

/**
 * @param {Object} db
 * @param {String} clName collection's name
 * @returns {Promise | Array} array of jsons
 */
function getDocuments( db, clName ) { // TODO use connectCollection
    var D = Q.defer();
    db.collection(clName, function(error, collection){
        if ( error ) return D.reject(error);
        var cursor = collection.find({}),
            docs = {};
        cursor.each(function(err, doc){
            if ( error ) return D.reject(error);
            if ( doc === null ) return D.resolve(docs); // null is sign of end
            var id = doc['_id'];
            // delete doc['_id']; // TODO remove the 'delete'
            docs[id] = doc;
        });
    });
    return D.promise;
}

/**
 * @param {Object} db
 * @returns {Promise | Array}
 */
function getCollections(db) {
    var D = Q.defer();
    db.collectionNames(function(error, collections){
        return error ? D.reject(error) : D.resolve(collections);
    });
    return D.promise;
}

/**
 * @param {Object} res
 * @param {String} templateName
 * @param {Object} params for jade to fill the template
 */
function doAnswer ( res, templateName, params ) {
    //T.l('[databases]: preparing to send answer');
    return compileAnswer( templateName, params )
    .then(function(answer){
        //T.l('[databases]: sending answer now: ' + answer );
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Length', answer.length);
        res.end(answer);
    })
}

function compileAnswer ( templateName, params ) {
    if ( ! templateName ) return Q.resolve(
        typeof params === 'object'
            ? JSON.stringify(params, null, 0)
            : params
    );

    return QFS.read( PATH_TO_TEMPLATES + templateName )
    .then(function(templateText){
	    return jade.compile(templateText)(params);
    })
}

/**
 * @param {String} dbName database name without MONGO_USER_DBNAME_PREFIX
 * @returns {Promise | Object}
 */
function connect ( dbName, tenant ) {
    var dbName = dbName ? MONGO_USER_DBNAME_PREFIX + tenant + '_' + dbName : '';
    //T.l('[databases]: dbName to connect: ' + dbName);
    return Q.nfcall(
        mongoc.connect,
        [ 'mongodb://', MONGO_HOST, ':', MONGO_PORT, '/', dbName ].join('')
    );
};

/**
 * @param {Object} db
 * @returns {Promise | Array}
 */
function getFullDatabasesList (db) {
    //T.l('[databases]: in getFullDatabasesList');
    var D = Q.defer();
    db.admin().listDatabases(function(err, dbs){
        //T.l('[databases]: inside getFullDatabasesList.listDatabases, err: ', err, 'dbs:', dbs );
        return err ? D.reject(err) : D.resolve(dbs.databases);
    });
    return D.promise;
}

/**
 * @param {Array} databases
 * @returns {Array} demo databases only
 */
function filterDemoDatabasesForTheTenant ( databases, tenant ) {
    return databases.filter(function(e, i, a){
        var regex = new RegExp('^' + MONGO_USER_DBNAME_PREFIX + tenant + '_(.+)$'),
            dbName = ( regex.exec( e.name ) || [] )[1];
        return ( dbName && ( a[i].name = dbName ) ) ? true : false;
    });
}
