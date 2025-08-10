var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var _ = require('lodash');
var moment = require('moment');
var async = require('async');
var request = require('request');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var winston = require('winston');
var morgan = require('morgan');
var helmet = require('helmet');
var cors = require('cors');
var chalk = require('chalk');
var validator = require('validator');
var uuid = require('uuid');
var compression = require('compression');

var app = express();

app.use(bodyParser());
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(compression());

var logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true
    })
  ]
});

var users = [];

app.get('/', function(req, res) {
  var now = moment().format('YYYY-MM-DD HH:mm:ss');
  var randomId = uuid.v4();
  
  logger.info('Home page accessed at ' + now);
  
  res.send('<h1>Outdated Dependencies App</h1>' + 
           '<p>Current time: ' + now + '</p>' +
           '<p>Session ID: ' + randomId + '</p>' +
           '<p>This app uses ' + _.keys(require('./package.json').dependencies).length + ' outdated dependencies!</p>');
});

app.post('/register', function(req, res) {
  var email = req.body.email;
  var password = req.body.password;
  
  if (!validator.isEmail(email)) {
    return res.status(400).send({ error: 'Invalid email' });
  }
  
  bcrypt.hash(password, 10, function(err, hash) {
    if (err) {
      return res.status(500).send({ error: 'Hash error' });
    }
    
    var user = {
      id: uuid.v4(),
      email: email,
      password: hash,
      created: moment().toISOString()
    };
    
    users.push(user);
    
    var token = jwt.sign({ id: user.id }, 'secret', { expiresInMinutes: 60 });
    
    logger.info(chalk.green('New user registered: ' + email));
    
    res.send({ 
      message: 'User created',
      token: token,
      user: _.omit(user, 'password')
    });
  });
});

app.post('/login', function(req, res) {
  var email = req.body.email;
  var password = req.body.password;
  
  var user = _.find(users, { email: email });
  
  if (!user) {
    return res.status(404).send({ error: 'User not found' });
  }
  
  bcrypt.compare(password, user.password, function(err, valid) {
    if (!valid) {
      return res.status(401).send({ error: 'Invalid password' });
    }
    
    var token = jwt.sign({ id: user.id }, 'secret', { expiresInMinutes: 60 });
    
    logger.info(chalk.blue('User logged in: ' + email));
    
    res.send({
      message: 'Login successful',
      token: token,
      user: _.omit(user, 'password')
    });
  });
});

app.get('/users', function(req, res) {
  var sanitized = _.map(users, function(user) {
    return _.omit(user, 'password');
  });
  
  res.send(sanitized);
});

app.get('/external-data', function(req, res) {
  async.parallel([
    function(callback) {
      request('http://api.github.com/repos/nodejs/node', function(error, response, body) {
        callback(null, { github: body ? JSON.parse(body).stargazers_count : 0 });
      });
    },
    function(callback) {
      setTimeout(function() {
        callback(null, { random: Math.random() });
      }, 100);
    }
  ], function(err, results) {
    res.send({
      timestamp: moment().unix(),
      data: results
    });
  });
});

app.get('/info', function(req, res) {
  var memUsage = process.memoryUsage();
  
  res.send({
    uptime: process.uptime(),
    memory: {
      rss: (memUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
      heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
      heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB'
    },
    nodeVersion: process.version,
    platform: process.platform,
    dependencies: _.keys(require('./package.json').dependencies)
  });
});

var port = process.env.PORT || 3000;

if (!module.parent) {
  app.listen(port, function() {
    console.log(chalk.yellow('Server running on port ' + port));
    logger.info('Application started with ' + _.keys(require('./package.json').dependencies).length + ' dependencies');
  });
}

module.exports = app;