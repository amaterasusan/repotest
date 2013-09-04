/*
	DreamFace DFX GitHub Management
	Version: 1.0
	Author: DreamFace Interactive
	License: Commercial
	(c) 2013 DreamFace Interactive, all rights reserved.
*/

/*Sample use of an error: 
try{
	var asd = undefined;
	asd.asd = "";
}catch(e){
	errors.NO_IDEA(e, req).notifySession();
}
*/

var sockets = require("./dfx_sockets");

var Errors = function() {};
Errors.Error = function(consoleError, errorTitle, errorMessage, req) {
    this.consoleError = consoleError || "Default console error.";
    this.errorTitle = errorTitle || "Default error title";
    this.errorMessage = errorMessage || "Default error message.";
    this.req = req;
};

var DfxError = Errors.Error;
DfxError.prototype.toString = function() {
    return "\nConsole: " + this.consoleError + "\n" + this.errorMessage + "\n";
};

DfxError.prototype.notifySession = function() {
    if (!this.req) {
        console.log("There was an error with the error... This is ridiculous...");
    }
    var me = this;
    setTimeout(function() {
        console.log("\nNotifying session " + me.req.sessionID + " of error: " + me.toString());
        sockets.emitToSession("showNotification", me.req.sessionID, {
            clickToDismiss: true,
            title: "Error: " + me.errorTitle,
            body: me.errorMessage,
            width: 180
        });
    }, 500);
    return this;
};

Errors.NO_IDEA = function(consoleError, req) {
    return new DfxError(consoleError, "No Idea", "We have no idea where the error is coming from...", req);
};

Errors.DEFAULT_MONGO = function(consoleError, req) {
    return new DfxError(consoleError, "MongoDB", "Something went wrong with MongoDB.", req);
};

Errors.DEFAULT_GITHUB = function(consoleError, req) {
    return new DfxError(consoleError, "GitHub", "Something went wrong with GitHub.", req);
};

Errors.DEFAULT_PHONEGAP = function(consoleError, req) {
    return new DfxError(consoleError, "PhoneGap", "Something went wrong with PhoneGap.", req);
};

Errors.DEFAULT_WIDGET = function(consoleError, req) {
    return new DfxError(consoleError, "Widget", "There was an error with a widget.", req);
};

Errors.DEFAULT_QUERY = function(consoleError, req) {
    return new DfxError(consoleError, "Query", "There was an error with a query.", req);
};

Errors.DEFAULT_SCREEN = function(consoleError, req) {
    return new DfxError(consoleError, "Screen", "There was an error with a screen.", req);
};

Errors.DEFAULT_APPLICATION = function(consoleError, req) {
    return new DfxError(consoleError, "Application", "There was an error with an application.", req);
};

Errors.PHONEGAP_APPLICATION_NO_ID = function(consoleError, req) {
    return new DfxError(consoleError, "PhoneGap", "Could not find the ID of your application.", req);
};

Errors.PHONEGAP_WRONG_TOKEN = function(consoleError, req) {
    return new DfxError(consoleError, "PhoneGap", "Wrong PhoneGap token", req);
};

Errors.GITHUB_AUTHENTIFICATION = function(consoleError, req) {
    return new DfxError(consoleError, "GitHub", "Wrong credentials regarding GitHub", req);
};

Errors.GITHUB_WRONG_TOKEN = function(consoleError, req) {
    return new DfxError(consoleError, "GitHub", "Wrong GitHub token", req);
};

Errors.GITHUB_TOO_MANY_ATTEMPTS = function(consoleError, req) {
    return new DfxError(consoleError, "GitHub", "Too many attempts at authentification... Wait a few minutes before trying again.", req);
};

exports = module.exports = Errors;