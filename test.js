var request = require('supertest');
var chai = require('chai');
var expect = chai.expect;
var app = require('./app');

describe('Outdated App Tests', function() {
  
  describe('GET /', function() {
    it('should return homepage with status 200', function(done) {
      request(app)
        .get('/')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.text).to.include('Outdated Dependencies App');
          expect(res.text).to.include('Session ID');
          done();
        });
    });
  });

  describe('POST /register', function() {
    it('should register a new user', function(done) {
      request(app)
        .post('/register')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.have.property('message', 'User created');
          expect(res.body).to.have.property('token');
          expect(res.body.user).to.have.property('email', 'test@example.com');
          expect(res.body.user).to.not.have.property('password');
          done();
        });
    });

    it('should reject invalid email', function(done) {
      request(app)
        .post('/register')
        .send({ email: 'notanemail', password: 'password123' })
        .expect(400)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.have.property('error', 'Invalid email');
          done();
        });
    });
  });

  describe('POST /login', function() {
    before(function(done) {
      // Register a user first
      request(app)
        .post('/register')
        .send({ email: 'login@example.com', password: 'testpass' })
        .end(done);
    });

    it('should login with correct credentials', function(done) {
      request(app)
        .post('/login')
        .send({ email: 'login@example.com', password: 'testpass' })
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.have.property('message', 'Login successful');
          expect(res.body).to.have.property('token');
          expect(res.body.user).to.have.property('email', 'login@example.com');
          done();
        });
    });

    it('should reject wrong password', function(done) {
      request(app)
        .post('/login')
        .send({ email: 'login@example.com', password: 'wrongpass' })
        .expect(401)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.have.property('error', 'Invalid password');
          done();
        });
    });

    it('should reject non-existent user', function(done) {
      request(app)
        .post('/login')
        .send({ email: 'nobody@example.com', password: 'anypass' })
        .expect(404)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.have.property('error', 'User not found');
          done();
        });
    });
  });

  describe('GET /users', function() {
    it('should return all users without passwords', function(done) {
      request(app)
        .get('/users')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.be.an('array');
          res.body.forEach(function(user) {
            expect(user).to.not.have.property('password');
            expect(user).to.have.property('email');
          });
          done();
        });
    });
  });

  describe('GET /info', function() {
    it('should return system information', function(done) {
      request(app)
        .get('/info')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.have.property('uptime');
          expect(res.body).to.have.property('memory');
          expect(res.body).to.have.property('nodeVersion');
          expect(res.body).to.have.property('platform');
          expect(res.body).to.have.property('dependencies');
          expect(res.body.dependencies).to.be.an('array');
          expect(res.body.dependencies.length).to.be.above(50);
          done();
        });
    });
  });

  describe('GET /external-data', function() {
    it('should return external data with timestamp', function(done) {
      this.timeout(5000); // Allow more time for external API call
      request(app)
        .get('/external-data')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.have.property('timestamp');
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.be.an('array');
          done();
        });
    });
  });
});
