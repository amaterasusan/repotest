$(document).ready(function() {
    DfxStudio();
});

var DfxStudio = function(options) {
    DfxStudio.setupSocket();
    DfxStudio.loadScreen({
        screenname: (DfxStudio.getQueryParam("s") == null ? "home" : DfxStudio.getQueryParam("s"))
    });
    DfxStudio.hiddenNotifCounter = document.createElement("div");
    $(DfxStudio.hiddenNotifCounter).addClass('dfx_notification_counter');
    $(DfxStudio.hiddenNotifCounter).html("" + DfxStudio.pendingNotifications.length);
    document.body.appendChild(DfxStudio.hiddenNotifCounter);
    DfxStudio.refreshNotifCounter();
    $.get('/studio/widget/list', {}, function(data) {
        //console.log(data);
    });
};

DfxStudio.templates = {};
DfxStudio.notificationStackHeight = 0;
DfxStudio.notifications = new Array();
DfxStudio.pendingNotifications = new Array();
DfxStudio.currentConfirmDialog = null;
DfxStudio.currentEditScreen = null;

DfxStudio.confirmDialog = function(options) {
    if (DfxStudio.currentConfirmDialog) {
        return console.log("There can only be 1 confirm dialog at once.");
    }
    var dialog = document.createElement("div");
    var id = Math.floor(Math.random() * 100000);
    dialog.style['width'] = "auto";
    dialog.style['height'] = "auto";
    dialog.style['z-index'] = "0";
    dialog.style['position'] = "fixed";
    dialog.style['background'] = "white";
    dialog.style['border'] = "black 5px solid";
    dialog.style['text-align'] = "center";
    dialog.style['padding'] = "10px";

    $(dialog).addClass("dfx_content_normal");
    document.body.appendChild(dialog);
    currentConfirmDialog = dialog;

    setTimeout(function() {
        dialog.style['top'] = (window.innerHeight - $(dialog).height()) / 2 + "px";
        dialog.style['left'] = (window.innerWidth - $(dialog).width()) / 2 + "px";
    }, 10);

    var html = "";
    html += "<h3>" + options.prompt + "</h3>";
    html += "<div style='width:100%'><input id='dfx_confirm_positive' class='dfx_gc_input' type='submit' value='Confirm' style='width:auto;margin:0;margin-right:20px;'/><input id='dfx_confirm_negative' class='dfx_gc_input' type='submit' value='Cancel' style='width:auto;margin:0;'/></div>";
    $(dialog).html(html);
    $("#dfx_confirm_positive").click(function() {
        DfxStudio.currentConfirmDialog = null;
        options.positiveCallback();
        dialog.style['width'] = "0";
        dialog.style['height'] = "0";
        dialog.style['visibility'] = "hidden";
        $(dialog).html("");
    });
    $("#dfx_confirm_negative").click(function() {
        DfxStudio.currentConfirmDialog = null;
        options.negativeCallback();
        dialog.style['width'] = "0";
        dialog.style['height'] = "0";
        dialog.style['visibility'] = "hidden";
        $(dialog).html("");
    });
};

DfxStudio.refreshNotifCounter = function() {
    $(DfxStudio.hiddenNotifCounter).html("" + DfxStudio.pendingNotifications.length);
    if (DfxStudio.pendingNotifications.length != 0) {
        $(DfxStudio.hiddenNotifCounter).css('opacity', 1);
    } else {
        $(DfxStudio.hiddenNotifCounter).css('opacity', 0);
    }
}

DfxStudio.getFormObject = function(options) {
    var x = document.getElementById(options.formId);
    var obj = {};
    for (var i = 0; i < x.length; i++) {
        var inputname = x.elements[i].getAttribute("data-inputname");
        if (inputname) {
            obj[inputname] = x.elements[i].value;
            console.log(inputname + ": " + x.elements[i].value);
        }
    }
    return obj;
};

DfxStudio.getAllWidgets = function(options) {
    $.get('/studio/widget/list', options || {}, function(data) {
        data = JSON.parse(data);
        options.callback(data.widgets);
    });
};

DfxStudio.setupSocket = function() {
    DfxStudio.socket = io.connect('http://localhost');

    $.get('/studio/session/getid', {}, function(sessionID) {
        DfxStudio.socket.on('updateLoadingBar:' + sessionID, function(data) {
            console.log("socket.on updateLoadingBar clientside: \n" + JSON.stringify(data));
            DfxStudio.updateLoadingBar(data);
        });

        DfxStudio.socket.on('showNotification:' + sessionID, function(data) {
            console.log("socket.on showNotification clientside: \n" + JSON.stringify(data));
            DfxStudio.showNotification(data);
        });

        DfxStudio.socket.on('serverError:' + sessionID, function(data) {
            console.log("socket.on serverError clientside: \n" + JSON.stringify(data));
            DfxStudio.showNotification(data);
        });
    });

    DfxStudio.socket.on('updateLoadingBar', function(data) {
        console.log("socket.on updateLoadingBar clientside: \n" + JSON.stringify(data));
        DfxStudio.updateLoadingBar(data);
    });

    DfxStudio.socket.on('showNotification', function(data) {
        console.log("socket.on showNotification clientside: \n" + JSON.stringify(data));
        DfxStudio.showNotification(data);
    });

    DfxStudio.socket.on('serverError', function(data) {
        console.log("socket.on serverError clientside: \n" + JSON.stringify(data));
        DfxStudio.showNotification(data);
    });
};


DfxStudio.selectMainMenu = function(options) {
    $("#dfx_help_ctx").css("display", "none");
    $("[parentmenuid=" + options.menuid + "]").toggle();
    if (options.menuid == "dashboard") {
        DfxStudio.loadScreen({
            screenname: "dashboard"
        });
    } else if (options.menuid == "sessions") {
        DfxStudio.loadScreen({
            screenname: "sessions"
        });
    } else if (options.menuid == "databases") {
        DfxStudio.databases.init();
    } else if (options.menuid == "create") {
        if (options.type) {
            DfxStudio.loadScreen({
                screenname: "" + options.type + "/create"
            });
        }
    } else if (options.menuid == "workflow") {
        DfxStudio.loadScreen({
            screenname: "workflow"
        });
    } else if (options.menuid == "settings") {
        DfxStudio.loadScreen({
            screenname: "settings"
        });
    } else if (options.menuid == "feedback") {
        DfxStudio.loadScreen({
            screenname: "feedback"
        });
    }
};

DfxStudio.loadScreen = function(options) {
    console.log("Loading screen: " + options.screenname);
    $(".dfx_content").empty();
    $.get("/studio/" + options.screenname, function(data) {
        try {
            data = JSON.parse(data);
            if (data.error == 'SESSIONEND') {
                window.location = "/studio/index.html";
            }
        } catch (err) {
            $(".dfx_content").append(data);
        }
    });
    
    /*DfxStudio.loadHelpContext({
        screen: options.screenname
    });*/
};

/* APPLICATION MANAGEMENT */

DfxStudio.createApplication = function(options) {
    var obj = {
        applicationName: $('#dfx_application_input_applicationName').val(),
        ownerId: $('#dfx_application_input_ownerId').val(),
        title: $("#dfx_application_input_title").val(),
    };
    if (obj.applicationName.indexOf(" ") != -1) {
        DfxStudio.showNotification({
            title: 'Error',
            body: "The name of your application cannot have spaces in it",
            clickToDismiss: true
        });
        return;
    }
    $.post('/studio/application/create', obj, function(data) {
        if (!data.error) {
            DfxStudio.loadScreen({
                screenname: 'dashboard'
            });
        }
    });
};

DfxStudio.deleteApplication = function(options) {
    console.log("Deleting application " + options.applicationName);

    DfxStudio.confirmDialog({
        prompt: "Are you sure you want to delete this application?",
        positiveCallback: function() {
            console.log("positiveCallback");
            if (options.phonegap) {
                $.post('/studio/application/deletephonegap', options, function(data) {
                    if (data.error) {
                        console.error("There was a problem deleting the application from PhoneGap");
                    } else {
                        console.log("Application successfully deleted from PhoneGap");
                    }
                });
            } else {
                $.post('/studio/application/delete', options, function(data) {
                    if (data.error) {
                        console.error("There was a problem deleting the application from MongoDB");
                    } else {
                        console.log("Application successfully deleted from MongoDB");
                        DfxStudio.loadScreen({
                            screenname: 'dashboard'
                        });
                    }
                });
            }
        },
        negativeCallback: function() {
            console.log("negativeCallback");
        }
    });
};

DfxStudio.viewApplication = function(options) {
    $(".dfx_content").empty();
    $(".dfx_content").load("/studio/application/view/" + options.applicationName, function(data) {});
};

DfxStudio.editApplicationUI = function(options) {
    $(".dfx_content").empty();
    $(".dfx_content").load("/studio/application/editui/" + options.applicationName, function(data) {});
};

DfxStudio.updateApplication = function(options) {
    var obj = DfxStudio.getFormObject(options);
    $.post('/studio/application/update/' + options.applicationName, {
        change: {
            title: obj.title,
            ownerId: obj.ownerId,
            github: {
                token: obj.githubToken,
                username: obj.username,
                repository: obj.repository
            },
            phonegap: {
                token: obj.phonegapToken,
            }
        }
    }, function(data) {
        if (data == 1) {

        } else {
            // The server side error handling took care of the notification
        }
    });
};

/* END APPLICATION MANAGEMENT */

/* SCREEN MANAGEMENT */

DfxStudio.createScreen = function(options) {
    var parent_itemType = $('.tree-selected').parent().attr('item-type');
    var parent_screenName = $('.tree-selected').parent().attr('item-screen');
    var item_applicationName = $('#fldAddScreen').attr('item-application');
    var obj = {
        name: $('#fldAddScreen').val(),
        application: item_applicationName,
        title: $('#fldAddScreen').val(),
        ownerId: ''
    };
    
    if (parent_itemType=='screen' && parent_screenName!='') {
        obj.parentname = parent_screenName;
    }
        
    if (obj.name.indexOf(" ") != -1) {
        DfxStudio.showNotification({
            title: 'Error',
            body: "The name of your screen cannot have spaces in it",
            clickToDismiss: true
        });
        return;
    }
    $.post('/studio/screen/create', obj, function(data) {
        if (!data.error) {
            DfxStudio.loadScreen({
                screenname: 'dashboard'
            });
        }
    });
};

DfxStudio.editScreen = function(options) {
    $('#screen_detail_intro').css( 'display', 'none' );
    $.get( '/studio/screen/item/'+options.screen+'/'+options.application, function(data) {
        var screen_item = JSON.parse( data );
        $('#fldName').val( screen_item.screen.name  );
        $('#fldTitle').val( screen_item.screen.title  );
        $('#fldParentName').val( screen_item.screen.parentname  );
        $('#screen_detail_form').css( 'display', 'block' );
        DfxStudio.currentEditScreen = screen_item;
        DfxStudio.editScreenLayout(screen_item);
    });
};

DfxStudio.editScreenOK = function(options) {
    var parentname = $('#fldParentName').val();
    DfxStudio.currentEditScreen.screen.name = $('#fldName').val();
    DfxStudio.currentEditScreen.screen.application = options.applicationName;
    DfxStudio.currentEditScreen.screen.title = $('#fldTitle').val();
    DfxStudio.currentEditScreen.screen.parentname = (parentname=='') ? null : parentname;
    
    delete DfxStudio.currentEditScreen.screen._id;
    
    $.post('/studio/screen/update', {change: DfxStudio.currentEditScreen.screen}, function(data) {
        if (!data.error) {
            DfxStudio.editScreenCancel();
        }
    });
}
    
DfxStudio.editScreenCancel = function(options) {
    $('#lytedt_col_size').css( 'display', 'none' );
    $('#screen_detail_form').css( 'display', 'none' );
    $('#screen_detail_intro').css( 'display', 'block' );
}

DfxStudio.editScreenLayout = function(options) {
    $('#editLayoutPanel').empty();
    $('#fldNbCol').unbind( 'change' );
    
    for (i=0; i<options.screen.layout.rows.length; i++) {
        DfxStudio.editScreenLayoutAddRow( {"row": options.screen.layout.rows[i]} );
    }
    $('#fldNbCol').change( function(event) {
        var j=0;
        var rowindex = $('.dfx_lytedt_row_active').parent().attr('rowindex');
        var columns =  DfxStudio.currentEditScreen.screen.layout.rows[rowindex].columns;
        var nbcols = $(this).val();
        var concat_widgets = new Array();
        for (j=0; j<columns.length; j++) {
            concat_widgets = concat_widgets.concat( columns[j].widgets );
        }
        $('.dfx_lytedt_row_active > .dfx_lytedt_col').remove();
        $('.dfx_lytedt_col_field').css( 'display', 'none' );
        if (nbcols==1) {
            $('.dfx_lytedt_row_active').append( '<div id="lp_1a" class="col-12 dfx_lytedt_col dfx_lytedt_col_first" colwidth="12"></div>' );
            $('#lytedt_col1').css('display', 'block');
            $('[data-inputname=col1]').val(12);
            columns = [{width: '12', widgets: concat_widgets}];
        } else if (nbcols==2) {
            $('.dfx_lytedt_row_active').append( '<div id="lp_1a" class="col-6 dfx_lytedt_col dfx_lytedt_col_first" colwidth="6"></div>' );
            $('.dfx_lytedt_row_active').append( '<div id="lp_1a" class="col-6 dfx_lytedt_col" colwidth="6"></div>' );
            $('#lytedt_col1').css('display', 'block');
            $('#lytedt_col2').css('display', 'block');
            $('[data-inputname=col1]').val(6);
            $('[data-inputname=col2]').val(6);
            columns = [{width: '6', widgets: concat_widgets}, {width: '6', widgets: []}];
        } else if (nbcols==3) {
            $('.dfx_lytedt_row_active').append( '<div id="lp_1a" class="col-2 dfx_lytedt_col dfx_lytedt_col_first" colwidth="2"></div>' );
            $('.dfx_lytedt_row_active').append( '<div id="lp_1a" class="col-8 dfx_lytedt_col" colwidth="8"></div>' );
            $('.dfx_lytedt_row_active').append( '<div id="lp_1a" class="col-2 dfx_lytedt_col" colwidth="2"></div>' );
            $('#lytedt_col1').css('display', 'block');
            $('#lytedt_col2').css('display', 'block');
            $('#lytedt_col3').css('display', 'block');
            $('[data-inputname=col1]').val(2);
            $('[data-inputname=col2]').val(8);
            $('[data-inputname=col3]').val(2);
            columns = [{width: '2', widgets: []}, {width: '8', widgets: concat_widgets}, {width: '2', widgets: []}];
        } else {
            $('.dfx_lytedt_row_active').append( '<div id="lp_1a" class="col-2 dfx_lytedt_col dfx_lytedt_col_first" colwidth="2"></div>' );
            $('.dfx_lytedt_row_active').append( '<div id="lp_1a" class="col-4 dfx_lytedt_col" colwidth="4"></div>' );
            $('.dfx_lytedt_row_active').append( '<div id="lp_1a" class="col-4 dfx_lytedt_col" colwidth="4"></div>' );
            $('.dfx_lytedt_row_active').append( '<div id="lp_1a" class="col-2 dfx_lytedt_col" colwidth="2"></div>' );
            $('.dfx_lytedt_col_field').css( 'display', 'block' );
            $('[data-inputname=col1]').val(2);
            $('[data-inputname=col2]').val(4);
            $('[data-inputname=col3]').val(4);
            $('[data-inputname=col4]').val(2);
            columns = [{width: '2', widgets: []}, {width: '4', widgets: concat_widgets}, {width: '4', widgets: []}, {width: '2', widgets: []}];
        }
        DfxStudio.currentEditScreen.screen.layout.rows[rowindex].columns = columns;
    });
    
    $('.dfx_lytedt_row_block').unbind( 'click' );
    $('.dfx_lytedt_row_block').click( function(event) { DfxStudio.editScreenLayoutEditColumns(this) } );
}
    
DfxStudio.editScreenLayoutEditColumns = function(element) {
    $('#lytedt_col_size').css('display','block');
    $('.dfx_lytedt_row_active').removeClass('dfx_lytedt_row_active');
    $(element).addClass('dfx_lytedt_row_active');
    $('.dfx_lytedt_col_field').css( 'display', 'none' );
    var nbcols = $('.dfx_lytedt_col', element).size();
    $('#fldNbCol').val(nbcols);
    if (nbcols>=1) {
        $('#lytedt_col1').css('display', 'block');
    }
    if (nbcols>=2) {
        $('#lytedt_col2').css('display', 'block');
    }
    if (nbcols>=3) {
        $('#lytedt_col3').css('display', 'block');
    }
    if (nbcols==4) {
        $('#lytedt_col4').css('display', 'block');
    }
    $('.dfx_lytedt_col', element).each( function(i) {
        $('[data-inputname=col'+(i+1)+']').val( $(this).attr('colwidth') );
    });
};
    
DfxStudio.editScreenLayoutEditColumnOK = function(options) {
    var rowindex = $('.dfx_lytedt_row_active').parent().attr('rowindex');
    $('.dfx_lytedt_row_active > .dfx_lytedt_col').each( function(i) {
        var j=0;
        for (j=0; j<12; j++) {
            $(this).removeClass('col-'+(j+1));
        };
        var column_width = $('[data-inputname=col'+(i+1)+']').val();
        $(this).addClass( 'col-' + column_width );
        DfxStudio.currentEditScreen.screen.layout.rows[rowindex].columns[i].width = column_width;
    });
};

DfxStudio.editScreenLayoutAddRow = function(options) {
    var i=0;
    var div_id = Math.floor(Math.random() * 1000);
    var rowindex = $('.dfx_lytedt_row').size();
    var fragment_row = '<div id="'+div_id+'" class="row dfx_lytedt_row" rowindex="'+rowindex+'"><div id="'
        + div_id + '_rowblock" class="pull-left dfx_lytedt_row_block">';
    if (options==null) {
        fragment_row += '<div class="col-12 dfx_lytedt_col dfx_lytedt_col_first" colwidth="12"></div>';
        DfxStudio.currentEditScreen.screen.layout.rows.push( {columns: [{width: '12', widgets:[]}], id: ''} );
    } else {
        for (i=0; i<options.row.columns.length; i++) {
            fragment_row += '<div class="col-'+options.row.columns[i].width+' dfx_lytedt_col ';
            if (i==0) {
                fragment_row += 'dfx_lytedt_col_first';
            }
            fragment_row += '" colwidth="'+options.row.columns[i].width+'"></div>';
        }
    }
    fragment_row += '</div><div class="pull-left dfx_lytedt_row_detail"><div class="form-group col-lg-3">'
        + '<label for="' + div_id + '_label_id">Element ID:</label>';
    if (options==null) {
        fragment_row += '<input id="' + div_id + '_field_id" class="input-small form-control" type="text" rowindex="'+rowindex+'" />';
    } else {
        fragment_row += '<input id="' + div_id + '_field_id" class="input-small form-control" type="text" rowindex="'+rowindex+'" value="'+options.row.id+'" />';
    }
    fragment_row += '</div></div></div>';
    $('#editLayoutPanel').append( fragment_row );
    $('#' + div_id + '_field_id').change( function(event) {
        var current_rowindex = $(this).attr('rowindex');
        DfxStudio.currentEditScreen.screen.layout.rows[current_rowindex].id = $(this).val();
    });
    $('#'+div_id+'_rowblock').click( function(event) { DfxStudio.editScreenLayoutEditColumns(this) } );
    if (options==null) {
        $('#'+div_id+'_rowblock').trigger( 'click' );
    }
};

DfxStudio.editScreenLayoutRemoveRow = function(options) {
    if ($('.dfx_lytedt_row').size()>1) {
        var rowindex = $('.dfx_lytedt_row_active').parent().attr('rowindex');
        DfxStudio.currentEditScreen.screen.layout.rows.splice(rowindex,1);
        $('.dfx_lytedt_row_active').parent().remove();
        $('.dfx_lytedt_row_block:first').trigger('click');
    } else {
        DfxStudio.showNotification({
            title: 'Warning',
            body: 'Your layout must have at least 1 row',
            clickToDismiss: true
        });
    }
};
    
DfxStudio.editScreenLayoutEditContent = function(options) {
    if ($('.dfx_lytedt_row_active').size()>0) {
        var panel_width = 500;
        var nbcols = $('#fldNbCol').val();
        var group_id = Math.floor(Math.random() * 1000);
        var widgets = null;
        var column_width = null;
        var i=0;
        var rowindex = $('.dfx_lytedt_row_active').parent().attr('rowindex');
        
        var adjustment;
        
        column_width = $('.dfx_lytedt_row_active > div:first').attr( 'colwidth' );
        var fragment_html = '<div class="dfx_edit_content_col_panel_item panel panel-default pull-left" style="margin-left:0px" colwidth="'+column_width+'">'
            + '<ul class="dfx_edit_content dfx_edit_content_'+group_id+'">';
        
        widgets = DfxStudio.currentEditScreen.screen.layout.rows[rowindex].columns[0].widgets;
        
        if (widgets!=null) {
            for (i=0; i<widgets.length; i++) {
                fragment_html += '<li>'+widgets[i].name+'</li>';
            }
        }
        
        fragment_html += '</ul></div>';
        
        if (nbcols>1) {
            column_width = $('.dfx_lytedt_row_active > div:nth-child(2)').attr( 'colwidth' );
            fragment_html += '<div class="dfx_edit_content_col_panel_item panel panel-default pull-left" style="margin-left:20px" colwidth="'+column_width+'">'
                + '<ul class="dfx_edit_content dfx_edit_content_'+group_id+'">';
            
            if (DfxStudio.currentEditScreen.screen.layout.rows[rowindex].columns[1]!=null) {
                widgets = DfxStudio.currentEditScreen.screen.layout.rows[rowindex].columns[1].widgets;
                if (widgets!=null) {
                    for (i=0; i<widgets.length; i++) {
                        fragment_html += '<li>'+widgets[i].name+'</li>';
                    }
                }
            }
            fragment_html += '</ul></div>';
            panel_width = 710;
        }
        if (nbcols>2) {
            column_width = $('.dfx_lytedt_row_active > div:nth-child(3)').attr( 'colwidth' );
            fragment_html += '<div class="dfx_edit_content_col_panel_item panel panel-default pull-left" style="margin-left:20px" colwidth="'+column_width+'">'
                + '<ul class="dfx_edit_content dfx_edit_content_'+group_id+'">';
            
            if (DfxStudio.currentEditScreen.screen.layout.rows[rowindex].columns[2]!=null) {
                widgets = DfxStudio.currentEditScreen.screen.layout.rows[rowindex].columns[2].widgets;
                if (widgets!=null) {
                    for (i=0; i<widgets.length; i++) {
                        fragment_html += '<li>'+widgets[i].name+'</li>';
                    }
                }
            }
            fragment_html += '</ul></div>';
            panel_width = 930;
        }
        if (nbcols>3) {
            column_width = $('.dfx_lytedt_row_active > div:nth-child(4)').attr( 'colwidth' );
            fragment_html += '<div class="dfx_edit_content_col_panel_item panel panel-default pull-left" style="margin-left:20px" colwidth="'+column_width+'">'
                + '<ul class="dfx_edit_content dfx_edit_content_'+group_id+'">';
            
            if (DfxStudio.currentEditScreen.screen.layout.rows[rowindex].columns[3]!=null) {
                widgets = DfxStudio.currentEditScreen.screen.layout.rows[rowindex].columns[3].widgets;
                if (widgets!=null) {
                    for (i=0; i<widgets.length; i++) {
                        fragment_html += '<li>'+widgets[i].name+'</li>';
                    }
                }
            }
            fragment_html += '</ul></div>';
            panel_width = 1110;
        }
        
        $('#dfx_edit_content_col_panel').empty();
        $('#dfx_edit_content_panel').width( panel_width );
        $('#dfx_edit_content_col_panel').append(fragment_html);
        $('#dfx_edit_content_panel').css( 'display', 'block' );
        
        var adjustment;
        $('ul.dfx_edit_content_'+group_id).sortable({
            group: 'dfx_edit_content_'+group_id,
            onDragStart: function ($item, container, _super) {
                var offset = $item.offset(),
                    pointer = container.rootGroup.pointer;

                adjustment = {
                    left: pointer.left - offset.left,
                    top: pointer.top - offset.top
                };

                _super($item, container);
            },
            onDrag: function ($item, position) {
                $item.css({
                    left: position.left - adjustment.left,
                    top: position.top - adjustment.top
                })
            }
        });
    }
};
    
DfxStudio.editScreenLayoutEditContentSearch = function(options) {
    $('.dfx_edit_content_cat').empty();
    var search_key = $('#fldSearchWidget').val();
    $.get('/studio/widget/search?q='+search_key, function(data) {
        var i=0;
        var doc_widgets = JSON.parse(data);
        if (doc_widgets.widgets) {
            for (i=0; i<doc_widgets.widgets.length; i++) {
                var fragment_wgt = '<li><div class="dfx_edit_content_cat_wgt pull-left">'+doc_widgets.widgets[i].name+'</div><button class="btn btn-primary btn-small pull-right" type="button" onclick="DfxStudio.editScreenLayoutEditContentAddWidget({widget:\''+doc_widgets.widgets[i].name+'\'})"><span class="icon-plus"></span></button></li>';
                $('.dfx_edit_content_cat').append( fragment_wgt );
            }
        }
    });
};

DfxStudio.editScreenLayoutEditContentOK = function(options) {
    var rowindex = $('.dfx_lytedt_row_active').parent().attr('rowindex');
    var columns = new Array();
    $('.dfx_edit_content_col_panel_item').each( function(i) {
        var colwidth = $(this).attr('colwidth');
        var column = { 'width': colwidth, 'widgets': [] };
        $('li', this).each( function(j) {
            column.widgets.push( {name: $(this).text()} );
        });
        columns.push( column );
    });
    DfxStudio.currentEditScreen.screen.layout.rows[rowindex].columns = columns;
    $('#dfx_edit_content_panel').css('display', 'none');
};

DfxStudio.editScreenLayoutEditContentCancel = function(options) {
    $('#dfx_edit_content_panel').css('display', 'none');
};

DfxStudio.editScreenLayoutEditContentAddWidget = function(options) {
    $('.dfx_edit_content:first').prepend( '<li>'+options.widget+'</li>' );
};

/* END SCREEN MANAGEMENT */

/* WIDGET MANAGEMENT */

DfxStudio.createWidget = function(options) {
    var obj = {
        name: $('#fldName').val(),
        ownerId: $('#fldOwnerId').val(),
        description: $("#fldDescription").val(),
        category: $("#fldCategory").val(),
        wtype: $("#fldType").val(),
    };
    if (obj.name.indexOf(" ") != -1) {
        DfxStudio.showNotification({
            title: 'Error',
            body: "The name of your widget cannot have spaces in it",
            clickToDismiss: true
        });
        return;
    }
    $.post('/studio/widget/create', obj, function(data) {
        if (!data.error) {
            DfxStudio.loadScreen({
                screenname: 'dashboard'
            });
        }
    });
};

DfxStudio.searchWidget = function(options) {
    var search_key = $('#fldWidgetName').val();
    $('#dfx_widget_search_result').css( 'display', 'block' );
    $('#dfx_widget_search_result_body').empty();
    $.get('/studio/widget/search?q='+search_key, function(data) {
        var i=0;
        var doc_widgets = JSON.parse(data);
        if (doc_widgets.widgets) {
            for (i=0; i<doc_widgets.widgets.length; i++) {
                var name = (doc_widgets.widgets[i].name==null) ? '-' : doc_widgets.widgets[i].name;
                var desc = (doc_widgets.widgets[i].description==null) ? '-' : doc_widgets.widgets[i].description;
                var wtype = (doc_widgets.widgets[i].wtype==null) ? '-' : doc_widgets.widgets[i].wtype;
                var fragment_html = '<tr>'
                    + '<td>' + name + '</td>'
                    + '<td style="text-align:center">' + wtype + '</td>'
                    + '<td>' + desc + '</td>'
                    + '<td></td>'
                    + '</tr>';
                $('#dfx_widget_search_result_body').append( fragment_html );
            }
        }
    });
};

/* END WIDGET MANAGEMENT */

/* QUERY MANAGEMENT */
DfxStudio.checkQuery = function() {
    // check form - required fields cannot be empty
    if($('[required=required]').length && $('[required=required]').val() == ""){
        DfxStudio.showNotification({
            title: 'Error',
            body: 'Fields cannot be empty!',
            clickToDismiss: true
        });
        return false;

    }

    // query name cannot have space
    if ($('#queryName').val().indexOf(" ") != -1) {
        DfxStudio.showNotification({
            title: 'Error',
            body: "The name of your query cannot have spaces in it",
            clickToDismiss: true
        });
        return false;
    }
    return true;
};

DfxStudio.buildQuery = function() {
    var elPars = $('#dfx_add_params [name="queryParam[name]"]'),
        arrParams = [],
        obj = [];
    // build query parameters
    $.each(elPars, function (index, element) {
        if($(element).val() != ""){
            arrParams[index] = {
                name:  $(element).val(),
                type:  $('#queryParamType'+index).val(),
                value: $('#queryParamValue'+index).val()
            }
        }
    });

    // object with all form values
    obj = {
        name: $('#queryName').val(),
        ownerId: '',
        description: $("#queryDesc").val(),
        category: $("#queryCat").val(),
        format: $('#queryFormat').val(),
        settings: {
            authentication : "",
            auth_password: "",
            typerequest: 'HTTP_'+$('#queryRequestType').val(),
            auth_userid:"",
            url:$('#queryRequestUrl').val()
        },
        parameters: arrParams
    };
    return obj;
};

DfxStudio.executeQuery = function(){

};

DfxStudio.viewQuery = function(){

};

DfxStudio.createQuery = function(options) {
    var obj = [];

    // check query
    if(!DfxStudio.checkQuery()) {
        return false;
    }

    // build query
    obj = DfxStudio.buildQuery();

    // create new query
    $.post('/studio/query/create', obj, function(data) {
        if (!data.error) {
            DfxStudio.loadScreen({
                screenname: 'dashboard'
            });
        }
    });
};

DfxStudio.updateQuery = function(options) {
    var obj = [];

    // check query
    if(!DfxStudio.checkQuery()) {
        return false;
    }
    // build query
    obj = DfxStudio.buildQuery();

    // update query
    $.post('/studio/query/update/' + options.queryName, obj, function(data) {
        if (!data.error) {
            DfxStudio.loadScreen({
                screenname: 'dashboard'
            });
        }
    });
};

DfxStudio.deleteQuery = function(options) {
    console.log("Deleting application " + options.queryName);
    DfxStudio.confirmDialog({
        prompt: "Are you sure you want to delete this query?",
        positiveCallback: function() {
            console.log("positiveCallback");
            $.post('/studio/query/delete', options, function(data) {
                console.log(data)
                if (data.error) {
                    console.error("There was a problem deleting the query from MongoDB");
                } else {
                    console.log("Query successfully deleted from MongoDB");
                    DfxStudio.loadScreen({
                        screenname: 'dashboard'
                    });
                }
            });
        },
        negativeCallback: function() {
            console.log("negativeCallback");
        }
    });
};

DfxStudio.viewQuery = function(options) {
    $(".dfx_content").empty();
    $(".dfx_content").load("/studio/query/view/" + options.queryName, function(data) {
        $('#dfx_add_params').show();
    });
};

DfxStudio.showAddQueryCat = function(options) {
    // show popup
    $('#showPopAddQueryCat').popover({
        html: true,
        trigger: 'manual',
        title: function () {
            return $('.popover-markup >.head').html();
        },
        content: function () {
            return $('.popover-markup >.content').html();
        }
    }).popover('toggle');

    // send form with new category name
    $('.submitPopover').click(function(event){
        if($('#queryCatName').val() == ""){
            $('#queryCatName').parents('.control-group').addClass('has-error');
            return;
        }
        var objCat = {
            name: $('#queryCatName').val(),
            ownerId: '',
            act: 'createQueryCat'
        };
        $.ajax({
            url: '/studio/query/create',
            type: 'post',
            dataType: 'json',
            data: objCat
        }).done(function ( data ) {
            // if success create new category - we add new option
            $('#queryCat :selected').attr('selected',false);
            $('#queryCat').prepend( $('<option value="'+objCat.name+'" selected="selected">'+objCat.name+'</option>'));
            $('#showPopAddQueryCat').popover('hide');
        });
    });

    // close popup
    $('.closePopover').click(function(event){
        $('#showPopAddQueryCat').popover('hide');

    });
};

DfxStudio.addQueryParams = function(options) {
    // add new row empty row for query parameters
    var countAddPars = $('tr','#dfx_add_params_body').length;
    console.log(countAddPars)
    $('#dfx_add_params').show();
    $('<tr>')
    .append (
        $('<td>')
        .append(
            $('<input type="text" />')
            .attr({
                    'id':'queryParamName' + countAddPars,
                    'class':'form-control',
                    'name':'queryParam[name]',
                    'placeholder':'Name Parameter'
                })
        )
    )
    .append (
        $('<td>')
        .append (
            $('<select>')
            .attr({
                    'id':'queryParamType' + countAddPars,
                    'class':'form-control',
                    'name':'queryParam[type]'
                })
            .append ($('<option value="header">header</option>'))
            .append ($('<option value="request" selected="selected">request</option>'))
            .append ($('<option value="url">url</option>'))
        )
    )
    .append (
        $('<td>')
            .append(
                $('<input type="text" />')
                    .attr({
                        'id':'queryParamValue' + countAddPars,
                        'class':'form-control',
                        'name':'queryParam[value]',
                        'placeholder':'Value Parameter'
                    })
            )
    )
    .appendTo('#dfx_add_params_body');
};

DfxStudio.searchQuery = function(options) {
    // search query - if search_key is empty - show all queries
    var search_key = $('#fldQueryName').val();
    $('#dfx_query_search_result').css( 'display', 'block' );
    $('#dfx_query_search_result_body').empty();
    $.get('/studio/query/search?q='+search_key, function(data) {
        var i=0;
        var doc_queries = JSON.parse(data);
        if (doc_queries.queries) {
            for (i=0; i<doc_queries.queries.length; i++) {
                var name = (doc_queries.queries[i].name==null) ? '-' : doc_queries.queries[i].name;
                var desc = (doc_queries.queries[i].description==null) ? '-' : doc_queries.queries[i].description;
                var fragment_html = '<tr>'
                    + '<td><a href="javascript:DfxStudio.viewQuery({queryName:\''+name+'\'});" class="btn btn-link">' + name + '</a></td>'
                    + '<td><span class="dfx_table_text">' + desc + '</span></td>'
                    + '<td><a href="javascript:DfxStudio.deleteQuery({queryName:\''+name+'\'});" class="btn btn-danger btn-small"><span class="icon-trash"></span></a></td>'
                    + '</tr>';
                $('#dfx_query_search_result_body').append( fragment_html );
            }
        }
    });
};
/* END QUERY MANAGEMENT */

/* BUILD APPLICATION */

DfxStudio.buildZipApplication = function(options) {
    window.location = '/compiler/make/zip/' + options.applicationName;
};

DfxStudio.buildGithubApplication = function(options) {
    $.get('/compiler/make/github/' + options.applicationName, {}, function() {});
};

DfxStudio.buildPhoneGapApplication = function(options) {
    $.get('/compiler/make/phonegap/' + options.applicationName, {}, function(data) {
        $.get("/studio/application/getid/" + options.applicationName, {}, function(data) {
            console.log("Application id: " + data);
            document.getElementById("testframe").src = "https://build.phonegap.com/apps/" + data + "/builds";
        })
    });

};

/* END BUILD APPLICATION */

/* SESSION MANAGEMENT */

DfxStudio.showSession = function(options) {
    var dialog = document.createElement("div");
    var id = Math.floor(Math.random() * 100000);
    dialog.style['width'] = "600px";
    dialog.style['height'] = "550px";
    dialog.style['z-index'] = "0";
    dialog.style['position'] = "fixed";
    dialog.style['background'] = "white";
    dialog.style['border'] = "black 5px solid";
    dialog.style['top'] = (window.innerHeight - 600) / 2 + "px";
    dialog.style['left'] = (window.innerWidth - 600) / 2 + "px";

    $(dialog).addClass("dfx_content_normal");
    document.body.appendChild(dialog);

    $(dialog).load('/studio/session/view', {
        sessionId: options.sessionId
    }, function(responseText) {
        $(dialog).html("<h1 style=''>Session " + options.sessionId + "</h1><div style='overflow:auto;height:400px'>" + responseText.replace(/\n/g, "<br />").replace(/\t/g, "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp") + "</div><br /><button id=" + id + ">Close</button>");
        $("#" + id).click(function() {
            dialog.style['width'] = "0";
            dialog.style['height'] = "0";
            dialog.style['visibility'] = "hidden";
            $(dialog).html("");
        });
    });
};

/* END SESSION MANAGEMENT */

/* HELP CONTEXT */

DfxStudio.hideHelpContext = function(options) {
    $("#dfx_help_ctx").css("display", "none");
};

DfxStudio.showHelpContext = function(options) {
    $("#dfx_help_ctx").css("display", "block");
};

DfxStudio.loadHelpContext = function(options) {
    $.get("/studio/help/" + options.screen + ".json", function(data) {
        var i = 0;
        $(".dfx_help_ctx_content_article").empty();
        for (i = 0; i < data.steps.length; i++) {
            var article = data.steps[i];
            var fragment = "<span data-type='context-help-step' step='" + i + "' top='" + article.top + "' left='" + article.left + "' class='dfx_help_ctx_content_article_item'>";
            fragment += "<p class='dfx_help_ctx_content_title'>" + article.title + "</p>";
            fragment += "<p class='dfx_help_ctx_content_text'>" + article.content + "</p></span>";
            $(".dfx_help_ctx_content_article").append(fragment);
        }
        var first_item = $("span[data-type=context-help-step][step=0]")[0];
        var first_item_top = $(first_item).attr("top");
        var first_item_left = $(first_item).attr("left");
        $("#dfx_help_ctx").css("top", first_item_top + "px");
        $("#dfx_help_ctx").css("left", first_item_left + "px");
        $(first_item).addClass("dfx_help_ctx_content_article_item_selected");
    });
};

DfxStudio.nextHelpContext = function(options) {
    var nb_articles = $("span[data-type=context-help-step]").size();
    var current_article = $(".dfx_help_ctx_content_article_item_selected")[0];
    var current_step = parseInt($(current_article).attr("step"));
    var next_step = current_step + 1;
    if ((next_step + 1) <= nb_articles) {
        var next_article = $("span[data-type=context-help-step][step=" + next_step + "]")[0];
        var item_top = $(next_article).attr("top");
        var item_left = $(next_article).attr("left");
        $("#dfx_help_ctx").css("top", item_top + "px");
        $("#dfx_help_ctx").css("left", item_left + "px");
        $(current_article).removeClass("dfx_help_ctx_content_article_item_selected");
        $("span[data-type=context-help-step][step=" + next_step + "]").addClass("dfx_help_ctx_content_article_item_selected");
    }
};

DfxStudio.previousHelpContext = function(options) {
    var current_article = $(".dfx_help_ctx_content_article_item_selected")[0];
    var current_step = parseInt($(current_article).attr("step"));
    var prev_step = current_step - 1;
    if (prev_step >= 0) {
        var prev_article = $("span[data-type=context-help-step][step=" + prev_step + "]")[0];
        var item_top = $(prev_article).attr("top");
        var item_left = $(prev_article).attr("left");
        $("#dfx_help_ctx").css("top", item_top + "px");
        $("#dfx_help_ctx").css("left", item_left + "px");
        $(current_article).removeClass("dfx_help_ctx_content_article_item_selected");
        $("span[data-type=context-help-step][step=" + prev_step + "]").addClass("dfx_help_ctx_content_article_item_selected");
    }
};

/* END HELP CONTEXT */

/* LOADING MESSAGE MANAGEMENT */

DfxStudio.updateLoadingBar = function(options) {
    console.log("Updating loading bar: " + JSON.stringify(options));
    if (options.done) {
        setTimeout(function() {
            $('#dfx_header_loadingbar_container').css('opacity', 0);
            $('#dfx_header_loadingbar_title').html("");
            $('##dfx_header_loadingbar_info').css('width', 0 + "%");
            $('#dfx_header_loadingbar_info').html("")
            $('#dfx_header_loadingbar_subtitle').html("");
        }, 5000);
    }
    if (options.error) {
        $('#dfx_header_loadingbar_info').removeClass("progress-bar-info");
        $('#dfx_header_loadingbar_info').addClass("progress-bar-danger");
    } else {
        $('#dfx_header_loadingbar_info').addClass("progress-bar-info");
        $('#dfx_header_loadingbar_info').removeClass("progress-bar-danger");
    }

    options.mode = options.mode ? options.mode : "nobar";
    if (options.mode == 'nobar') {
        // There will usually only be 1 call with a nobar
        $('#dfx_header_loadingbar_container').css('opacity', 1);
        $('#dfx_header_loadingbar_title').html("");
        $('#dfx_header_loadingbar_info').css('width', "100%");
        $('#dfx_header_loadingbar_info').html(options.done ? "Saved!" : "Saving...")
        $('#dfx_header_loadingbar_subtitle').html("");
    } else if (options.mode == 'bar') {
        $('#dfx_header_loadingbar_container').css('opacity', 1);
        $('#dfx_header_loadingbar_title').html(options.title);
        $('#dfx_header_loadingbar_info').css('width', options.percent + "%");
        $('#dfx_header_loadingbar_info').html(Math.floor(options.percent) + "%")
        $('#dfx_header_loadingbar_subtitle').html(options.subtitle);
    }
};

/* END LOADING MESSAGE MANAGEMENT */

/* NOTIFICATION MANAGEMENT */

DfxStudio.showNotification = function(options) {
    console.log("showNotification: " + JSON.stringify(options));

    if (DfxStudio.notificationStackHeight > 500) {
        DfxStudio.pendingNotifications.push(options);
        DfxStudio.refreshNotifCounter();
        return;
    }

    DfxStudio.refreshNotifCounter();

    var container = document.createElement('div');
    var bodyId = Math.floor(Math.random() * 1000);

    $(container).addClass('dfx_notification_container');
    $(container).addClass('alert');
    $(container).addClass('fade');
    $(container).addClass('in');
    $(container).css('top', window.innerHeight + "px");
    $(container).css('left', window.innerWidth + "px");
    $(container).html("<div class='dfx_notification_title'>" + options.title + "</div><button id='" + bodyId + "_close' class='close' style='right:0px'>&times;</button><div id='" + bodyId + "' class='dfx_notification_body'>" + (options.body ? options.body : "") + "</div>");

    $("body").append(container);

    var width = (options.width != undefined ? options.width : $(container).width());
    var height = (options.height != undefined ? options.height : $(container).height());
    height = height > 400 ? 400 : height;
    $(container).height(height);
    $(container).width(width);

    console.log("Container: " + $(container).width() + "; " + $(container).height());
    $(container).css('left', ($("#dfx_footer").width() - width - 50) + "px");

    var previousStackHeight = DfxStudio.notificationStackHeight;
    setTimeout(function() {
        $(container).css('top', ($("#dfx_footer").position().top - height - 5 - previousStackHeight - 15) + "px");
    }, 10);

    DfxStudio.notificationStackHeight += height + 15;
    DfxStudio.notifications.push(container);

    if (options.autoDismiss) {
        setTimeout(function() {
            DfxStudio.onDismissNotification({
                container: container,
                width: width,
                height: height
            });
        }, options.autoDismiss + 1000);
    }
    $("#" + bodyId + "_close").click(function() {
        setTimeout(function() {
            DfxStudio.onDismissNotification({
                container: container,
                width: width,
                height: height
            });
        }, 10);
    });
    if (options.dismissButtonId) {
        $('#' + options.dismissButtonId).click(function() {
            setTimeout(function() {
                DfxStudio.onDismissNotification({
                    container: container,
                    width: width,
                    height: height
                });
            }, 10);
        });
    }
    $('#' + bodyId).height(height - $('.dfx_notification_title').height() - $('.dfx_notification_footer').height() - 13);
};

DfxStudio.onDismissNotification = function(options) {
    var container = options.container;
    var width = options.width;
    var height = options.height;

    DfxStudio.notificationStackHeight -= height + 5;
    var hasRemoved = false;
    for (var i = 0; i < DfxStudio.notifications.length; i++) {
        if (DfxStudio.notifications[i] === container) {
            DfxStudio.notifications.splice(i, 1);
            break;
        }
    }

    $(container).css('left', window.innerWidth + "px");
    setTimeout(function() {
        $(container).remove();
    }, 1100);
    if (DfxStudio.pendingNotifications.length != 0) {
        DfxStudio.showNotification(DfxStudio.pendingNotifications[0]);
        DfxStudio.pendingNotifications.splice(0, 1);
    }
    DfxStudio.refreshNotifCounter();
    setTimeout(function() {
        var newStackHeight = 0;
        for (var i = 0; i < DfxStudio.notifications.length; i++) {
            console.log(DfxStudio.notifications[i].height)
            $(DfxStudio.notifications[i]).css('top', ($("#dfx_footer").position().top - $(DfxStudio.notifications[i]).height() - 5 - newStackHeight - 15) + "px");
            newStackHeight += $(DfxStudio.notifications[i]).height() + 15;
        }
        DfxStudio.notificationStackHeight = newStackHeight;
    }, 10);
};

/* END NOTIFICATION MANAGEMENT */

/* UTILITIES */

DfxStudio.getQueryParam = function(name) {
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null) {
        return null;
    } else {
        return results[1] || 0;
    }
};

/* END UTILITIES */

DfxStudio.doNothing = function() {
    // do nothing
};

/* DEPRECATED */

DfxStudio.openMenu = function(options) {
    var top_offset = options.top;
    var left_offset = options.left;
    var left_offset_padding = 0;
    var i = 0;

    if ((left_offset + 150) > $(window).width()) {
        left_offset_padding = ((left_offset + 150) - $(window).width()) + 10;
    }

    $("#dfx_ddmenu_arrow").remove();
    $("#dfx_ddmenu").remove();
    var fragment = "<div id='dfx_ddmenu_arrow' class='dfx_ddmenu_arrow'></div><div id='dfx_ddmenu' class='dfx_ddmenu'><ul id='dfx_ddmenu_items'></ul></div>";
    $("body").append(fragment);
    $("#dfx_ddmenu_arrow").css("top", top_offset - 6);
    $("#dfx_ddmenu_arrow").css("left", left_offset + 10);
    $("#dfx_ddmenu").css("top", top_offset);
    $("#dfx_ddmenu").css("left", (left_offset - left_offset_padding));

    if (options.items != null) {
        for (i = 0; i < options.items.length; i++) {
            $("#dfx_ddmenu_items").append("<li><a href='#' id='" + options.items[i].id + "'>" + options.items[i].label + "</a></li>");
            $("#" + options.items[i].id).bind('click', {
                action: options.items[i].action
            }, function(event) {
                event.data.action();
            });
        }
    }
};

/* END DEPRECATED */

(function($) {
    var methods = {
        init: function(options) {
            // TODO
        },
    };
    $.fn.dfxStudio = function(methodOrOptions) {
        if (methods[methodOrOptions]) {
            return methods[methodOrOptions].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
            // Default to "init"
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on dreamface studio');
        }
    };


})(jQuery);
