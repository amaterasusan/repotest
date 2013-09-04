$(document).ready( function() {
    DreamFace();
});

var DreamFace = function(options) {
    $('[dfx-renderrer]').each( function(i) {
        var element_name = $(this).attr('name');
        var fct = new Function( 'return ' + element_name + '_eventHandler();' );
        fct();
    });
};

DreamFace.initSession = function( options ) {
    sessionStorage.dfx_server = options.dfx_server;
    sessionStorage.dfx_tenantid = options.dfx_tenantid;
    sessionStorage.dfx_appname = options.dfx_appname;
    sessionStorage.dfx_appcontext = {};
};

DreamFace.post = function( options ) {
    $.ajax({
            type: 'POST',
            url: sessionStorage.dfx_server + '/dfx/' + sessionStorage.dfx_tenantid + '/' + sessionStorage.dfx_appname + '/' + options.url,
            data: options.data,
            success: function(data) {
                options.callback( null, data );
            },
            error: function(jqXHR, textStatus, errorThrown) {
                options.callback( errorThrown );
            }
    });
};

DreamFace.setAppContext = function( options ) {
    // TODO
};

DreamFace.getAppContext = function( name ) {
    // TODO
};

DreamFace.authenticate = function( options ) {
    var username = $(options.fieldUserName).val();
    var password = $(options.fieldPassword).val();
    DreamFace.post({ url: 'login', data: {'username':username, 'password':password}, callback: function(err, result) {
        if (err!=null) {
            $.mobile.changePage( 'Home.html', {
                transition: "slideup"
            });
        }
    }});
};

DreamFace.openDialog = function( options ) {
    $.mobile.changePage( 'dialog', {
        data: 'text=test',
        transition: 'pop',
        reverse: false,
        changeHash: false
    });
};


// former jquery plugin
(function( $ ){

    var methods = {
        init : function(options) {
            /*$("dfx-widget[wclass]").each( function(i) {
                var dfx_widget = this;
                var dfx_widget_id = $(this).attr("id");
                var wclass_value = $(dfx_widget).attr( "wclass" );
                $.get('widget.html?wclass='+wclass_value, function(data) {
                    $(dfx_widget).replaceWith( data );
                    $("a[data-role='button']").button();
                    var widget_initializer = new Function("return " + dfx_widget_id + "_eventHandler();");
                    widget_initializer();
                });
            });*/
        }
    };

    $.fn.dreamface = function(methodOrOptions) {
        if ( methods[methodOrOptions] ) {
            return methods[ methodOrOptions ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
            // Default to "init"
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.dreamface' );
        }    
    };


})( jQuery );