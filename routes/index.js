var express = require('express');
var router = express.Router();
var os = require('os')
var mongodb = require('mongodb');
var mLab =  process.env.MONGOLAB_URI  || "mongodb://Huytran1995:Minhhuy1995!@ds133084.mlab.com:33084/url-shortener-microservice";
var MongoClient = mongodb.MongoClient

var shortid = require('shortid');
/*it is a property of the shortid beside .generate*/
/*Default: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'*/
/*return new alphabet as a string*/
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');
/*check only http or https*/
var validUrl = require('valid-url');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

/*the url(*) paramater allows us to pass in properly formats. Without it express will get confused
with the forward slashes in URLs and think they're addition part of the route*/
router.get('/new/:url(*)', function (req, res, next) {
  /*connect to the database through the mba*/
  MongoClient.connect(mLab, function (err, db) {
    if (err) {
      /*error*/
      console.log("Unable to connect to server", err);
    } else {
      /*successful*/
      console.log("Connected to server")
      /*specify the name of the collection*/
      var collection = db.collection('url');
      /*take the url request*/
      var params = req.params.url;

      var newLink = function (db, callback) {
        collection.findOne({ "url": params }, function (err, doc) {
          /*if the user's data is already existed in the database and then print it*/
          if (doc != null) {
            res.json({ original_url: params, short_url: "https://joon1995urlshortener.herokuapp.com/" +  doc.short });
          } else {
            if (validUrl.isUri(params)) {
              // if URL is valid then generate the id through the shortid
              var shortCode = shortid.generate();
              /*create an object called newUrl contains two property the url user passed, and the shortCode generated
              by shortid
              */
              var newUrl = { url: params, short: shortCode };
              /*if it doesn't exist in the collection then insert the database in*/
              collection.insert([newUrl]);
              /*return the orginal url and the short version*/
              res.json({ original_url: params, short_url: "https://joon1995urlshortener.herokuapp.com/" + shortCode });
            } else {
            // if URL is invalid print out the message that the user's url is wrong
              res.json({ error: "Wrong url format, make sure you have a valid protocol and real site." });
            };
          };
        });
      };
      /*close the database*/
      newLink(db, function () {
        db.close();
      });

    };
  });

});

/*take the short url and check whether they already existed in the database or not*/
router.get('/:short', function (req, res, next) {

  MongoClient.connect(mLab, function (err, db) {
    if (err) {
      console.log("Unable to connect to server", err);
    } else {
      console.log("Connected to server")
      /*get the collection */
      var collection = db.collection('url');
      /*get the short link version that has been generated*/
      var params = req.params.short;
        /*find link function expression takes two argument, database and a callback fuunction*/
      var findLink = function (db, callback) {
        collection.findOne({ "short": params }, function (err, doc) {
          /*if the documentation is not null then redirect to the original url*/
          if (doc != null) {
            res.redirect(doc.url);
          } else {
            /*if it doesn't exist then proceed to show the error*/
            res.json({ error: "No corresponding shortlink found in the database." });
          };
        });
      };
      /*close the database*/
      findLink(db, function () {
        db.close();
      });

    };
  });
});

module.exports = router;
