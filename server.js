'use strict';

var fs = require('fs');
var express = require('express');
var mongo = require('mongodb').MongoClient
const random_string = require('./modules/random_string');
const check_url = require('./modules/check_url');

var app = express();


if (!process.env.DISABLE_XORIGIN) {
  app.use(function(req, res, next) {
    var allowedOrigins = ['https://narrow-plane.gomix.me', 'https://www.freecodecamp.com'];
    var origin = req.headers.origin || '*';
    if(!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1){
         console.log(origin);
         res.setHeader('Access-Control-Allow-Origin', origin);
         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    next();
  });
}

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/_api/package.json')
  .get(function(req, res, next) {
    console.log('requested');
    fs.readFile(__dirname + '/package.json', function(err, data) {
      if(err) return next(err);
      res.type('txt').send(data.toString());
    });
  });
  
app.route('/')
    .get(function(req, res) {
		  res.sendFile(process.cwd() + '/views/index.html');
    })

//--------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------

app.get('/favicon.ico', function(req, res) {
    res.status(204);
    res.end();
});

var url = 'mongodb://' + process.env.mongo_user + ':' + process.env.mongo_pass + '@ds033086.mlab.com:33086/url_shortener_ivan'

app.route('/*')
    .get(function(req, res) {
      var url_t = req.url;
      if(url_t.substr(0, 9) === '/new_url/'){
        
        /**************
        ****new url****
        **************/
        
        var new_url = false;
        var url_to_short = url_t.substr(9);
        if(check_url(url_to_short)){
          
          //---insert in db---
          
          mongo.connect(url, function(err, db) {
            if (err) {res.send(err)}
            var collection = db.collection('short_urls');
            var doc = {
              original_url: url_to_short
            , short_url: random_string(6)
            }
            collection.insert(doc, function(err, data) {
              if (err) throw err
              var temp = {
                original_url: data.ops[0].original_url
              , short_url: "https://3-url-shortener-fcc-ivan.glitch.me/" + data.ops[0].short_url
              }
              res.setHeader( 'Content-Type', 'application/json' );
              res.status(200);
              res.send(JSON.stringify(temp, null, '  '));
              db.close();
            })
          })
        }else{
          
          //---incorrect url---
          
          var doc = {
            error: "Wrong url format"
          }
          res.setHeader( 'Content-Type', 'application/json' );
          res.status(400);
          res.send(JSON.stringify(doc, null, '  '));
        }
        
      }else{
        
        /*******************
        ****read from db****
        *******************/
        
        mongo.connect(url, function(err, db) {
          if (err) throw err
          var collection = db.collection('short_urls')
          var curs = collection.find({
            short_url: { $eq: url_t.substr(1) }
          }, {
            original_url: 1
          , short_url: 1
          , _id: 0
          }).toArray(function(err, docs) {
            if (err) throw err
            if(docs.length !== 0){
              res.redirect(docs[0]["original_url"]);
            }else{
              var doc = {
                error: "There is no this url in db"
              }
              res.setHeader( 'Content-Type', 'application/json' );
              res.status(400);
              res.send(JSON.stringify(doc, null, '  '));
            }
            db.close()
          })
        })
        
      }
      
  
  
    })

//--------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------


// Respond not found to all the wrong routes
app.use(function(req, res, next){
  res.status(404);
  res.type('txt').send('Not found');
});

// Error Middleware
app.use(function(err, req, res, next) {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }  
})

app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});



