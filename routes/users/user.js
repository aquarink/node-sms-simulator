'use strict';

var express = require('express');
var router = express.Router();
var reQuest = require('request');
var getConnection = require('../../connection');

router.post('/sendsms', function (req, res) {
    // Date
    var ts_hms = new Date();
    var dateString = ts_hms.getFullYear() + '' +
            ("0" + (ts_hms.getMonth() + 1)).slice(-2) + '' +
            ("0" + (ts_hms.getDate() + 1)).slice(-2) + '_' +
            ("0" + ts_hms.getHours()).slice(-2) + '' +
            ("0" + ts_hms.getMinutes()).slice(-2);

    // New
    var hrtime = process.hrtime();
    var hrTimeMicro = hrtime[0] * 1000000 + hrtime[1];

    var trxIdBySms = dateString + hrTimeMicro;

    // Parsing msisdn 0 = 62
    var msisdnNew;

    if (req.body.msisdn.slice(0, 2) === '62') {

    } else {
        msisdnNew = '62' + req.body.msisdn.slice(1);
    }

    var obj = {
        sessionId: trxIdBySms,
        type: 'send',
        msisdn: msisdnNew,
        sms: req.body.sms,
        from: 912345,
        sms_date: dateString,
        stat: 'delivered'
    };
    function simulatorResponse(callback) {
        reQuest({
            url: 'http://localhost:3010/xl/origin?id=' + trxIdBySms + '&msisdn=' + req.body.msisdn + '&sms=' + req.body.sms + '&shortcode=912345',
            method: "GET"
        }, function _callback(err, res, body) {
            if (body === 'originError') {
                callback(body);
            } else {
                callback('drOk');
            }
        });
    }

    function mongoConnection(callback) {
        getConnection.connect(function (err) {
            if (err) {
                callback(err);
            } else {
                callback('ok');
            }
        });
    }

    function simulatorSendSms(sendSms, callback) {
        mongoConnection(function (connection) {
            if (connection === 'ok') {
                getConnection.db.collection('sms').insertOne(sendSms, function (err, res) {
                    if (!err) {
                        callback('insertOk');
                    } else {
                        callback(err);
                    }
                });
            }
        });
    }

    simulatorResponse(function (result) {
        if (result === 'drOk') {
            simulatorSendSms(obj, function (data) {
                if (data === 'insertOk') {
                    res.redirect('/u/' + req.body.msisdn);
                } else {
                    console.log(data);
                }
            });
        } else {
            res.send('Failed Connection');
            console.log('Error Pada ' + result);
        }
    });


});

/* GET msisdn listing. */
router.get('/', function (req, res, next) {
    function mongoConnection(callback) {
        getConnection.connect(function (err) {
            if (err) {
                callback(err);
            } else {
                callback('ok');
            }
        });
    }

    function simulatorReadSms(callback) {
        mongoConnection(function (connection) {
            if (connection === 'ok') {
                getConnection.db.collection('sms').distinct('msisdn', function (err, doc) {
                    if (!err) {
                        if (doc !== null) {
                            callback(doc);
                        } else {
                            callback('dataNull');
                        }
                    } else {
                        callback('err');
                    }
                });
            }
        });
    }

    simulatorReadSms(function (data) {
        if (data === 'dataNull' || data === 'err') {
            console.log('Data Null');
        } else {
            res.render('index', {
                items: data
            });
        }
    });
});

/* GET sms listing by MSISDN. */
router.get('/:msisdn', function (req, res, next) {
    //req.params.msisdn
    function mongoConnection(callback) {
        getConnection.connect(function (err) {
            if (err) {
                callback(err);
            } else {
                callback('ok');
            }
        });
    }

    function simulatorReadMsisdn(msisdn, callback) {
        mongoConnection(function (connection) {
            if (connection === 'ok') {
                getConnection.db.collection('sms').find({'msisdn': msisdn}, {"sort": [['sms_date', 'desc']]}).toArray(function (err, doc) {
                    if (!err) {
                        if (doc !== null) {
                            callback(doc);
                        } else {
                            callback('dataNull');
                        }
                    } else {
                        callback('err');
                    }
                });
            }
        });
    }

    simulatorReadMsisdn(req.params.msisdn, function (data) {
        if (data === 'dataNull' || data === 'err') {
            console.log('Data Null');
        } else {
            res.render('inbox', {
                msisdn: req.params.msisdn,
                items: data
            });
        }
    });
});

/* Write sms by MSISDN. */
router.get('/w/:msisdn', function (req, res, next) {
    res.render('write', {
        msisdn: req.params.msisdn
    });
});

module.exports = router;
