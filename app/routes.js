// app/routes.js

var User = require('./models/user');

module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });

    // =====================================
    // TWITTER ROUTES ======================
    // =====================================
    // route for twitter authentication and login
    app.get('/auth/twitter', passport.authenticate('twitter'));

    // handle the callback after twitter has authenticated the user
    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect : '/profile',
            failureRedirect : '/'
    }));

    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
    }));

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login',
	passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));


    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {

        var http = require('http');
        var MongoClient = require('mongodb').MongoClient;
        var url = "mongodb://localhost:27017/login";

      	MongoClient.connect(url, function(err, db) {
      	  if (err) throw err;
      	  db.collection("users").find({},{"local.email":1}).toArray(function(err, result) {
            if (err) throw err;
            db.collection("users").find({"local.email":req.user.local.email},{}).toArray(function(err,result2){
              if (err) throw err;
              res.render('profile.ejs', {
                       user : req.user, // get the user out of session and pass to template
                       contacts: result,
                       mensaje: result2
              });
              db.close();
            })



          });
      	});
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });


    //
    //
    app.post('/send-message', function(req,res){

      var http = require('http');
      var MongoClient = require('mongodb').MongoClient;
      var url = "mongodb://localhost:27017/login";

      MongoClient.connect(url, function(err,db){
       if (err) { throw err; }
       else {
         var collection = db.collection("users");
         collection.findOneAndUpdate({"local.email": req.body.email}, {$push:{"message":{"from":req.body.from, "mensaje":req.body.mensaje}}}, {upsert: true}, function(err,doc) {
           if (err) { throw err; }
           else {
             console.log("Updated");
             res.redirect('/profile');
            }
         });
       }
     });
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
