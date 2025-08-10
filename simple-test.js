// Simple test without external dependencies
var http = require('http');
var assert = require('assert');

var testsPassed = 0;
var testsFailed = 0;

function makeRequest(method, path, data, callback) {
  var options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  var req = http.request(options, function(res) {
    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      callback(null, res, body);
    });
  });

  req.on('error', callback);
  
  if (data) {
    req.write(JSON.stringify(data));
  }
  req.end();
}

function test(name, fn) {
  console.log('Testing: ' + name);
  fn(function(err) {
    if (err) {
      console.log('  ✗ FAILED:', err.message);
      testsFailed++;
    } else {
      console.log('  ✓ PASSED');
      testsPassed++;
    }
  });
}

// Start the server first
var app = require('./app');
var server = app.listen(3000, function() {
  console.log('\n=== Running Tests ===\n');
  
  // Run tests sequentially
  setTimeout(runTests, 100);
});

function runTests() {
  test('GET / should return homepage', function(done) {
    makeRequest('GET', '/', null, function(err, res, body) {
      if (err) return done(err);
      assert.equal(res.statusCode, 200, 'Status should be 200');
      assert(body.includes('Outdated Dependencies App'), 'Should contain app title');
      done();
    });
  });

  setTimeout(function() {
    test('POST /register should create user', function(done) {
      makeRequest('POST', '/register', {
        email: 'test@example.com',
        password: 'password123'
      }, function(err, res, body) {
        if (err) return done(err);
        assert.equal(res.statusCode, 200, 'Status should be 200');
        var data = JSON.parse(body);
        assert.equal(data.message, 'User created', 'Should have success message');
        assert(data.token, 'Should have token');
        done();
      });
    });
  }, 200);

  setTimeout(function() {
    test('POST /register with invalid email should fail', function(done) {
      makeRequest('POST', '/register', {
        email: 'notanemail',
        password: 'password123'
      }, function(err, res, body) {
        if (err) return done(err);
        assert.equal(res.statusCode, 400, 'Status should be 400');
        var data = JSON.parse(body);
        assert.equal(data.error, 'Invalid email', 'Should have error message');
        done();
      });
    });
  }, 400);

  setTimeout(function() {
    test('POST /login with correct credentials', function(done) {
      makeRequest('POST', '/login', {
        email: 'test@example.com',
        password: 'password123'
      }, function(err, res, body) {
        if (err) return done(err);
        assert.equal(res.statusCode, 200, 'Status should be 200');
        var data = JSON.parse(body);
        assert.equal(data.message, 'Login successful', 'Should have success message');
        assert(data.token, 'Should have token');
        done();
      });
    });
  }, 600);

  setTimeout(function() {
    test('POST /login with wrong password', function(done) {
      makeRequest('POST', '/login', {
        email: 'test@example.com',
        password: 'wrongpassword'
      }, function(err, res, body) {
        if (err) return done(err);
        assert.equal(res.statusCode, 401, 'Status should be 401');
        var data = JSON.parse(body);
        assert.equal(data.error, 'Invalid password', 'Should have error message');
        done();
      });
    });
  }, 800);

  setTimeout(function() {
    test('GET /users should return users', function(done) {
      makeRequest('GET', '/users', null, function(err, res, body) {
        if (err) return done(err);
        assert.equal(res.statusCode, 200, 'Status should be 200');
        var data = JSON.parse(body);
        assert(Array.isArray(data), 'Should be an array');
        assert(data.length > 0, 'Should have at least one user');
        assert(!data[0].password, 'Should not include password');
        done();
      });
    });
  }, 1000);

  setTimeout(function() {
    test('GET /info should return system info', function(done) {
      makeRequest('GET', '/info', null, function(err, res, body) {
        if (err) return done(err);
        assert.equal(res.statusCode, 200, 'Status should be 200');
        var data = JSON.parse(body);
        assert(data.uptime, 'Should have uptime');
        assert(data.memory, 'Should have memory info');
        assert(data.nodeVersion, 'Should have node version');
        assert(Array.isArray(data.dependencies), 'Should have dependencies array');
        done();
      });
    });
  }, 1200);

  // Print results and exit
  setTimeout(function() {
    console.log('\n=== Test Results ===');
    console.log('Passed:', testsPassed);
    console.log('Failed:', testsFailed);
    console.log('Total:', testsPassed + testsFailed);
    
    server.close();
    process.exit(testsFailed > 0 ? 1 : 0);
  }, 1500);
}