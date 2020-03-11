'use strict';

import logger from './utils/Logger';
import UserModel from './UserModel';
import ExerciseModel from './ExerciseModel';

logger.info('Starting chico_express ... ')

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var sfy = JSON.stringify;

var app = express();
app.use(express.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: false })) // for parsing application/x-www-form-urlencoded



logger.info(`Connecting DB to ${process.env.DATABASE_URI}` )
mongoose.connect(process.env.DATABASE_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
}); 


function simpleRequestLogger(req, resp, next){

  logger.verbose(`req.method='${req.method}' req.path='${req.path}' req.ip='${req.ip}'`);
  logger.verbose(`req.body='${JSON.stringify(req.body)}'`);
  next();
}

app.use(simpleRequestLogger);

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// creating a new user
app.post('/api/exercise/new-user', (req, res)=>{
  try{
    logger.verbose("inside /api/exercise/new-user")
    let username = req.body.username;
    UserModel.add(username).then((result)=>{
      logger.verbose("result from add is " + sfy(result))
       if(result.error){
        logger.verbose("found an error " + result.error.code);
        if(result.code==11000){
          logger.verbose("username already taken");
          res.send("username already taken");
        }else{
          res.send(result);
        }
       }else{
        res.send(result);
       }

    })

  }catch(err){
    res.send(err);
  }
})

app.post('/api/exercise/add', (req, res)=>{
  logger.verbose("inside /api/exercise/add with " );
  try{
    let exercise = {};
    exercise.user_id = req.body.userId;
    exercise.date = new Date(req.body.date);
    exercise.description = req.body.description;
    exercise.duration = req.body.duration;
    ExerciseModel.add(exercise).then((result)=>{
      res.send(result);
    })
  }catch(err){
    res.send(err)
  }
})

app.get('/api/exercise/log', (req, res)=>{
  logger.verbose("insdie /api/exercise/log params are " + JSON.stringify(req.query));
  try{
    let exercises = {};
    ExerciseModel.findByUserId(req.query.userId, req.query.from, req.query.to, req.query.limit).then((result)=>{
      logger.verbose("finished finding result is " + result);
      res.send(result);
    })
  }catch(err){
    res.send(err);
  }

})


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  logger.info('Your app is listening on port ' + listener.address().port)
})
