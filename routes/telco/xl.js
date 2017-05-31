'use strict';

var express = require('express');
var router = express.Router();
var reQuest = require('request');
var getConnection = require('../../connection');

router.get('/', function (req, res, next) {
    res.send('index');
});

// Dari Engine
router.get('/incoming', function (req, res, next) {
    var username = req.query.username;
    var password = req.query.password;
    var msisdn = req.query.msisdn;
    var trxId = req.query.trxid;
    var cost = req.query.serviceId;
    var sms = req.query.sms;
    var shortName = req.query.shortname;

    // Date
    var dateString = new Date().toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/T/, '').replace(/\..+/, '');

    // New
    var hrtime = process.hrtime();
    var hrTimeMicro = hrtime[0] * 1000000 + hrtime[1];

    // Parsing
    if (username === '' || password === '' || msisdn === '' || cost === '' || msisdn === '' || sms === '') {
        res.send('incomingEmpty');
        console.log('null');
    } else {


        if (trxId === '') {
            trxId = dateString + hrTimeMicro;
            res.send(dateString + hrTimeMicro);
        } else {
            res.send('ok');
        }

        var obj = {
            type: 'inbox',
            msisdn: msisdn,
            sms: sms,
            from: 912345,
            sms_date: dateString,
            stat: 'reply'
        };

        function mongoConnection(callback) {
            getConnection.connect(function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback('ok');
                }
            });
        }

        function responseEngine(callback) {
            // HIT DR
            reQuest({
                // stat 1 = sended
                url: 'http://localhost:3000/dr/xl?msisdn=' + msisdn + '&trxid=' + trxId + '&trxdate=' + dateString + '&shortcode=912345&stat=1',
                method: "GET"
            }, function _callback(err, res, body) {
                if (err) {
                    callback(err.code);
                } else {
                    callback('drOk');
                }
            });
        }

        responseEngine(function (result) {
            if (result === 'drOk') {
                mongoConnection(function (connection) {
                    if (connection === 'ok') {
                        getConnection.db.collection('sms').insertOne(obj, function (err, res) {
                            if (!err) {
                                console.log('Insert Incoming : ' + dateString);
                            } else {
                                console.log(err);
                            }
                        });
                    }
                });
            } else {
                res.send('incomingError');
                console.log('incoming ' + result);
            }
        });
    }
});

router.get('/origin', function (req, res, next) {
    var id = req.query.id;
    var msisdn = req.query.msisdn;
    var shortcode = req.query.shortcode;
    var sms = req.query.sms;
    var shortName = req.query.shortname;

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

    var trxIdByTelco = dateString + hrTimeMicro;

    // Parsing
    if (msisdn === '' || msisdn === '' || sms === '' || id === '') {
        res.send('originEmpty');
        console.log('null');
    } else {

        function mongoConnection(callback) {
            getConnection.connect(function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback('ok');
                }
            });
        }

        function responseEngine(callback) {
            // HIT DR
            reQuest({
                url: 'http://localhost:3000/mo/xl?msisdn=' + msisdn + '&sms=' + sms + '&trxid=' + id + '&trxdate=' + dateString + '&shortcode=912345',
                method: "GET"
            }, function _callback(err, res, body) {
                if (err) {
                    callback(err.code);
                } else {
                    callback('drOk');
                }
            });
        }

        responseEngine(function (result) {
            if (result === 'drOk') {
                mongoConnection(function (connection) {
                    if (connection === 'ok') {
                        mongoConnection(function (connection) {
                            if (connection === 'ok') {
                                getConnection.db.collection('sms').update({sessionId: id}, {$set: {'stat': 'sended'}}, function (err, result) {
                                    if (!err) {
                                        res.send('originOk');
                                    } else {
                                        console.log(err);
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                res.send('originError');
            }
        });
    }
});

module.exports = router;
