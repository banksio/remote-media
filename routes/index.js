var express = require('express');
// var createError = require('http-errors');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // next(createError(421));
  res.send("oof");
});

module.exports = router;
