var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('index');
});

router.get('/sms', function(req, res, next) {
  res.send('sms');
});

module.exports = router;
