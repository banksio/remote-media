var express = require('express');
// var createError = require('http-errors');
var router = express.Router();

var pjson = require('../package.json');
console.log("remote-media version " + pjson.version);

/* GET room receiver */
// router.get('/:room', function(req, res, next) {
router.get('/', function(req, res, next) {
  res.render('index', { appversion: pjson.version })
});

/* GET room admin */
// router.get('/:room/admin', function(req, res, next) {
router.get('/admin', function(req, res, next) {
  res.render('admin', { appversion: pjson.version })
});

module.exports = router;