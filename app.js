
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var mongoose = require('mongoose');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//общий синтаксис метода createConnection выглядит слудеющим образом:
//mongoose.connect('mongodb://username:password@host:port/database')
var db = mongoose.createConnection('mongodb://localhost/test');
// открываем соединение
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback () {
    console.log("Connected!")
});
//shema
var UserSchema = new mongoose.Schema( {
    name: { type: String, default: "hahaha" },
    age: { type: Number, min: 18, index: true },
    bio: { type: String, match: /[a-z]/ },
    date: { type: Date },
    buff: Buffer
});
UserSchema.methods.speak = function () {
    var greeting = this.name
        ? "My name is " + this.name
        : "I don't have a name"
    console.log(greeting);
}

//model
var User = db.model("User",UserSchema);
var newUser = new User({ name: "Helen", age: 53});

// save user in db
newUser.save(function (err, newUser) {
    if (err){
        console.log("Something goes wrong with user " + newUser.name);
    }else{
        newUser.speak();
    }
});
// Find all
User.find(function (err, users) {
    console.log(users)
})
console.log("----")
// find with filter
User.find({ age: 53 }, function (err, users) {
    console.log(users)
})
