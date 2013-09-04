DfxStudio.databases = (function(){

    var tree = {}, // cache for databases
        SHOW_HIDE_TIME = 200; // ms

    /**
     * @param {Object} docs - object of documents
     * @returns {Object} unicue first level params of all documents
     */
    function getFirstLevelParamsList ( docs ) {
        var list = {};
        for ( var id in docs ) {
            for ( var p in docs[id] ) list[p] = '';
        }
        delete list['_id'];
        return list;
    }

    /**
     * @param {Object} headers - first level params of all documents
     * @param {Object} docs
     */
    function createDocumentsTable ( headers, docs ) {
        // TODO use jade

        var $dbs_documents = $('#dbs_documents_table');
        $dbs_documents.html('');

        if ( Object.keys(docs).length === 0 ) {
            $dbs_documents.html('Here is no documents now.');
            return;
        }

        var tableHeader = '',
            tableBody = '',
            entireTable = '';

        for ( var header in headers ) tableHeader += '<th>' + header + '</th>';
        tableHeader = '<thead><tr>' + '<th width="25"> </th>' + tableHeader + '</tr></thead>';

        for ( var id in docs ) {
            var doc = docs[id],
                tableRow = '<td><input type="checkbox" onchange="DfxStudio.databases.tableCheckboxHandler"></td>',
                content;
            for ( var header in headers ) {

                content = typeof doc[ header ] === 'object'
                    ? JSON.stringify( doc[ header ] )
                    : doc[ header ];

                tableRow += '<td>' + ( content || '' ) + '</td>';
            }
            tableBody += '<tr id="'+id+'">' + tableRow + '</tr>';
        }
        tableBody = '<tbody>' + tableBody + '</tbody>';
        entireTable = '<table>' + tableHeader + tableBody + '</table>';

        var $table = $(entireTable);
        $table.appendTo($dbs_documents).flexigrid({height:'auto'});

        // to make flexigrid-table scrollable
        $('#dbs_documents_table > div.flexigrid')
            .css('height', '100%')
            .find('div.bDiv')
            .css('height', '80%');

        // on row click
        $table.find('tr').click(function(je){
            var id = je.currentTarget.id,
                oldId = $('#dbs_documents_path_document').text(),
                dbName = $('#dbs_documents_path_databse').text(),
                clName = $('#dbs_documents_path_collection').text()
                $textarea = $('#dbs_documents_textarea > textarea');

            // if there is not any digit — it is not a id
            if ( oldId && !/^[a-z\s]+$/i.test(oldId) ) {
                $('#' + oldId + ' > td:first input').prop('checked', false);
            }
            $('#' + id + ' > td:first input').prop('checked', true);

            showPath(dbName, clName, id);
            $textarea.fadeIn(SHOW_HIDE_TIME);
            showControls({create:true, save:true, delete:true});

            var text = JSON.stringify( tree[dbName].collections[clName].documents[id], null, 2 )
                    // to take string with "_id" ( mongodb id ) away
                    .replace(/"_id"\s*:\s*"[a-z0-9]+",\n|,\n\s*"_id"\s*:\s*"[a-z0-9]+"/ ,'');
            $textarea.val( text );
        });
    }

    /**
     * @param {String} dbName database name
     * @param {String} clName collection name
     * @param {String} docName id of document
     */
    function showPath ( dbName, clName, docName) {
        $('#dbs_documents_path_databse').text(dbName || '');
        $('#dbs_documents_path_collection').text(clName || '');
        $('#dbs_documents_path_document').text(docName || '');
        
    }

    /**
     * what buttons to show
     *
     * @param {Object} obj
     *      @param {Boolean} save
     *      @param {Boolean} create
     *      @param {Boolean} delete
     */
    function showControls ( obj ) {
        $('#dbs_documents_controls_save')[(obj.save  ? 'show' : 'hide')]();
        $('#dbs_documents_controls_create')[(obj.create  ? 'show' : 'hide')]();
        $('#dbs_documents_controls_delete')[(obj.delete  ? 'show' : 'hide')]();
    }

    /**
     * renders first level menu items in left (databases) menu
     *
     * @param {String} dbName database name
     * @param {Object} collections
     */
    function renderDatabase ( dbName, collections) {
        // TODO to create html for entire tree first, and to paste it whole after
        // ATTENTION: jade pastes html as text !!!
        var $dbInput = $('#dbs_databases > ul.nav > li:last');
        $dbInput.before(
            DfxStudio.templates.databases.single_database({databaseName: dbName})
        );

        var $newDatabase = $dbInput.prev().hide();

        // hide and activate remove buttons
        $newDatabase.find('a.dfx_dbs_database > div.btn')
            .hide()
            .click(DfxStudio.databases.removeDatabase);

        // show/hide remove buttons
        $newDatabase.find('a.tree-toggle').hover(
            function(){$(this).children('div.btn').show()},
            function(){$(this).children('div.btn').hide()}
        );

        // show/hide database collections
        $newDatabase.find('a.tree-toggle.dfx_dbs_database').click(function () {
            var lastActive = DfxStudio.databases._current.database;
            DfxStudio.databases._current.database = this;
            if ( lastActive !== this ) {
                $(lastActive).parent().children('ul.nav.dbx_dbs_menu_next_level').hide(SHOW_HIDE_TIME);
            }
            $(this).parent().children('ul.nav.dbx_dbs_menu_next_level').toggle(SHOW_HIDE_TIME);
            return false;
        });

        // render collections
        var $clInput = $newDatabase.find('ul').hide().find('li');
        for ( var clName in collections ) renderCollection( $clInput, clName );

        $newDatabase.show(SHOW_HIDE_TIME);
    }

    /**
     * renders second level menu items in left (databases) menu
     *
     * @param {Object} $input - jqueri dom element (input field for new collection name)
     * @param {String} clName - collection name
     * @param {Boolean} single - to add new single collection,
     *                              or to render all existed for the first time
     */
    function renderCollection ( $input, clName, single ) {
        $input.before(
            DfxStudio.templates.databases.single_collection({collectionName: clName})
        );
        var $newCollection = $input.prev();

        // hide and activate remove buttons
        $newCollection.find('a.dfx_dbs_collection > div.btn')
            .hide()
            .click(DfxStudio.databases.removeCollection);

        // show/hide remove buttons on hover
        $newCollection.find('a.tree-toggle').hover(
            function(){$(this).children('div.btn').show()},
            function(){$(this).children('div.btn').hide()}
        );
        
        // show collections documents on click
        $newCollection.find('a.tree-toggle.dfx_dbs_collection').click(function () {
            // TODO make 'renderDocuments'
            var lastActive = DfxStudio.databases._current.collection;
            DfxStudio.databases._current.collection = this;
            DfxStudio.databases.showCollection(this);
            $('#dbs_documents_textarea > textarea').val('').hide();
            $('#dbs_documents').hide().fadeIn(SHOW_HIDE_TIME);
            showControls({create:true});
            return false;
        });

        if ( single ) $newCollection.hide().show(SHOW_HIDE_TIME);
    }

    /**
     * makes request to server,
     * parses the answer,
     * handles errors (shows notifications, and rejects the promise)
     *
     * @param {String} path
     * @param {Object} params - params for request
     * @param {String) how - 'post' or 'get'
     *
     * @returns {Promise | Object} answer ( data or error )
     */
    function getFromServer ( path, params, how ) {
        return $[( how === 'post' ? 'post' : 'get')]( path, params )
        .then(function(data){
            try { data = JSON.parse(data); }
            catch (error) {
                console.log("ERROR, broken data from server:\n", data, "\n\nERROR OBJECT: ", error);
                // TODO does user need to see it?
                data = {error: 'Have got broken data from server. See console.log'};
            }

            if ( data.error === 'SESSIONEND' ) {
                // TODO show modal and resend the request
            }

            return data.error ? $.Deferred().reject(data) : data;
        })
        .fail(function(data){
            var errorTitle = 'unknown error';
            if ( data && data.error ) {
                if ( typeof data.error === 'function'  ) {
                    errorTitle = 'connection error';
                    // TODO check how DfxStudio.showNotifications renders it ( without &nbsp; it is awful )
                    errorBody = 'try&nbsp;later';
                } else {
                    errorTitle = 'error';
                    errorBody = data.error;
                }
            }
            DfxStudio.showNotification({ title: errorTitle, body: errorBody });

            return data;
        });
    }

    /**
     * @param {Object} obj
     *      @param {Object} database
     *      @param {Object} collection
     *      @param {Object} collections
     *      @param {Object} document
     *      @param {Object} documents
     *
     */
    function addToTree ( obj ) {
        // TODO check obj's syntax
        if ( obj.database && ! tree[obj.database] ) {
            tree[obj.database] = {
                size        : 0,
                collections : {}
            };
        }
        if ( obj.collection && ! tree[obj.database].collections[obj.collection] ) {
            tree[obj.database].collections[obj.collection] = {
                documents : {}
            };
        }
        if ( obj.documents ) {
            for ( var d in obj.documents ) {
                tree[obj.database].collections[obj.collection].documents = obj.documents;
            }

            // build headers
            tree[obj.database].collections[obj.collection].headers  = getFirstLevelParamsList(obj.documents);
        }
        if ( obj.document ) {
            tree[obj.database].collections[obj.collection].documents[obj.document['_id']] = obj.document;

            // rebuild headers
            tree[obj.database].collections[obj.collection].headers =
                getFirstLevelParamsList(tree[obj.database].collections[obj.collection].documents);
        }
        if ( obj.collections ) {
            for ( var c in obj.collections ) {
                tree[obj.database].collections[c] = obj.collections[c];
            }
        }
    }

    /**
     * @param {Object} obj
     *      @param {Object} database
     *      @param {Object} collection
     *      @param {Object} document
     */
    function removeFromTree ( obj ) {
        if ( obj.document ) {
            delete tree[obj.database].collections[obj.collection].documents[obj.document];
            // rebuild headers
            tree[obj.database].collections[obj.collection].headers =
                getFirstLevelParamsList(tree[obj.database].collections[obj.collection].documents);
            return;
        }
        if ( obj.collection ) {
            delete tree[obj.database].collections[obj.collection];
            return;
        }
        if ( obj.database ) {
            delete tree[obj.database];
            return;
        }
    }


    // DfxStudio.databases = 
    return {

    // currently choosen at the left-side (databases) menu
    _current : {
        database : {},
        collection : {}
    },

    /**
     * asks server for a templates and for list of databases and its collections,
     * invoke renders of the 'databases' page
     *
     * @returns {Promise}
     */
    init : function () {
        $.when(
            (function(){
                return ! DfxStudio.templates.databases
                    ?   getFromServer('/studio/databases/getTemplates')
                        .done(function(data){
                            var templates = data;
                            for ( var t in templates ) templates[t] = jade.compile(templates[t]);
                            DfxStudio.templates.databases = templates;
                        })
                    :   $.Deferred().resolve();
            })(),

            getFromServer('/studio/databases/getTree')
            .then(function(data){tree = data.tree})
        ).then(function(){
            $('.dfx_content').html( DfxStudio.templates.databases.index({}) );
            DfxStudio.databases._showTree();
        });
    },

    /**
     * @param {String} theName
     *
     * @returns {Boolean}
     */
    _isNameValid : function ( theName ) {
        if ( /^[a-z0-9_-]+$/i.test(theName) ) return true;
        DfxStudio.showNotification({
            title: 'Syntax error',
            body: 'Wrong name. Only letters, numbers, "_" and "-" allowed.',
        });
        return false;
    },

    /**
    * renders of the 'databases' page
    */
    _showTree : function() {
        for ( var database in tree ) renderDatabase( database, tree[database].collections );
    },

    /**
     * adds new collection name to tree
     * asks server for creating the collection
     * invokes rendering
     *
     * @param {Object} elem jqueri dom element for 'form' (creating collection)
     */
    createCollection : function(elem) {
        var $input = $(elem).children('input'),
            clName = $input.val();
        if ( ! this._isNameValid(clName) ) return false;
        var dbName = DfxStudio.databases._current.database.innerText;
        getFromServer( [ '/studio/databases/createCollection', dbName, clName ].join('/') )
        .done(function(data){
            addToTree(data);
            DfxStudio.databases._current.collection = null;
            renderCollection( $input.parent().parent(), clName, true );
            $input.val('');
        });
        return false;
    },

    /**
     * adds new database name to tree
     * asks server for creating the database
     * invokes rendering
     *
     * @param {Object} elem jqueri dom element for 'form' (creating database)
     */
    createDatabase : function( elem ) {
        var dbName = $(elem).children('input').val();
        if ( ! this._isNameValid(dbName) ) return false;

        getFromServer( '/studio/databases/showDatabase/' + dbName )
        .done(function(data){
            // hide currently opened database
            $(DfxStudio.databases._current.database)
                .parent()
                .children('ul.nav.dbx_dbs_menu_next_level')
                .hide(SHOW_HIDE_TIME);

            DfxStudio.databases._current.database = null;
            addToTree(data);
            renderDatabase(data.database, data.collections);

            // clear input field
            $(elem).children('input').val('');
        });
        return false;
    },

    /**
     * removes collection name from the tree
     * asks server for removing the collection
     * invokes rendering
     *
     * @param {Object} ev jqueri event for clicking on collection
     */
    removeCollection : function(ev) {
        ev.stopPropagation();
        var clName = $(this).parent().text(),
            dbName = DfxStudio.databases._current.database.innerText,
            $collection = $(this).parent().parent();
        getFromServer( [ '/studio/databases/removeCollection', dbName, clName ].join('/') )
        .done(function(data){
            removeFromTree(data);
            $collection.hide(SHOW_HIDE_TIME);
            DfxStudio.databases._current.collection = null;
        });
    },

    /**
     * removes database name from the tree
     * asks server for removing the database
     * invokes rendering
     *
     * @param {Object} ev jqueri event for clicking on database
     */
    removeDatabase : function(ev) {
        ev.stopPropagation();
        var dbName = $(this).parent().text(),
            $database = $(this).parent().parent();
        getFromServer('/studio/databases/removeDatabase/' + dbName)
        .done(function(data){
            removeFromTree(data);
            $database.hide(SHOW_HIDE_TIME);
            DfxStudio.databases._current.database = DfxStudio.databases._current.collection = null;
        });
    },

    /**
     * if there is not the documents in the tree
     * asks server for documents of the collection
     * invokes rendering
     *
     * @param {Object} dom node
     */
    showCollection : function(element) {
        var dbName = DfxStudio.databases._current.database.innerText,
            clName = element.innerText;

        // TODO check if we have this in tree !!!
        if ( tree[dbName].collections[clName] ) {
            createDocumentsTable(
                tree[dbName].collections[clName].headers,
                tree[dbName].collections[clName].documents
            );
            showPath(dbName, clName );
            showControls({create:true});
        } else {
            getFromServer( ['/studio/databases/showCollection', dbName, clName].join('/') )
            .done(function(data) {
                addToTree(data);
                createDocumentsTable(
                    tree[dbName].collections[clName].headers,
                    tree[dbName].collections[clName].documents
                );
                showPath(dbName, clName );
                showControls({create:true});
                return;
            })
        }
    },

    /**
     * checks syntax, adds to tree, sends request
     */
    insertDocument : function() {
        var dbName = DfxStudio.databases._current.database.innerText,
            clName = DfxStudio.databases._current.collection.innerText,
            $textarea = $('#dbs_documents_textarea > textarea'),
            id = $('#dbs_documents_path_document').text(),
            existingVersion,
            newVersion,
            doc;

        // (if there is 'new document' or something like this in the id's field)
        id = /^[a-z\s]+$/i.test(id) ? '' : id;

        // check syntax
        try {
            doc = JSON.parse($textarea.val());
        } catch (e) {
            console.log(e);
            DfxStudio.showNotification({
                title: 'Syntax error',
                body: 'Check JSON',
            });
            return;
        };

        if ( id ) {
            // TODO check for changing in document
            doc['_id'] = id;
        }

        getFromServer(
            [ '/studio/databases/insertDocument', dbName, clName ].join('/'),
            {doc: JSON.stringify(doc, null, 0)},
            'post'
        )
        .done(function(data){
            id = data.id || id;
            doc['_id'] = id;
            addToTree({
                database: dbName,
                collection: clName,
                document: doc
            });
            createDocumentsTable(
                tree[dbName].collections[clName].headers,
                tree[dbName].collections[clName].documents
            );
            $('#' + id + ' > td:first input').prop('checked', true);
            showPath(dbName, clName, id );
            showControls({create:true,save:true,delete:true});
        });
    },

    /**
     * renders page for creating document
     */
    createDocument : function() {
        var dbName = $('#dbs_documents_path_databse').text(),
            clName = $('#dbs_documents_path_collection').text(),
            headers = tree[dbName].collections[clName].headers,
            oldId = $('#dbs_documents_path_document').text(),
            $textarea = $('#dbs_documents_textarea > textarea');
        $textarea.val( JSON.stringify(headers, null, 2) ).fadeIn(SHOW_HIDE_TIME);

        // if there is not any digit — it is not id
        if ( oldId && !/^[a-z\s]+$/i.test(oldId) ) {
            $('#' + oldId + ' > td:first input').prop('checked', false);
        }

        showPath(dbName, clName, 'new document');
        showControls({save:true});
    },

    /**
     * removes from tree, asks server, renders
     */
    removeDocument : function() {
        var dbName = $('#dbs_documents_path_databse').text(),
            clName = $('#dbs_documents_path_collection').text(),
            id = $('#dbs_documents_path_document').text(),
            $textarea = $('#dbs_documents_textarea > textarea');

        getFromServer( [ '/studio/databases/removeDocument', dbName, clName, id ].join('/') )
        .done(function(data){
            showPath(dbName, clName);
            removeFromTree({
                database: dbName,
                collection: clName,
                document: id
            });
            showControls({
                create: true
            });
            $textarea.val('');
            $('#' + id).hide(SHOW_HIDE_TIME).remove();

        });
    },
}
})();
