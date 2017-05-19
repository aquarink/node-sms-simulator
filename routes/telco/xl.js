'use strict';

var express = require('express');
var router = express.Router();
var reQuest = require('request');
var getConnection = require('../../connection');

router.get('/', function (req, res, next) {
    res.send('index');
});

router.get('/incoming', function (req, res, next) {
    var username = req.query.username;
    var password = req.query.password;
    var msisdn = req.query.msisdn;
    var trxId = req.query.trxid;
    var cost = req.query.serviceId;
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

    // Parsing
    if (username === '' || password === '' || msisdn === '' || cost === '' || msisdn === '' || sms === '') {
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

        function simulatorInsertSms(dataSms, callback) {
            mongoConnection(function (connection) {
                if (connection === 'ok') {
                    getConnection.db.collection('sms').insertOne(dataSms, function (err, res) {
                        if (!err) {
                            callback('insertOk');
                        } else {
                            callback(err);
                        }
                    });
                }
            });
        }

        simulatorInsertSms(obj, function (data) {
            if (data === 'insertOk') {

                // HIT DR
                reQuest({
                    // stat 1 = sended
                    url: 'http://localhost:3000/xl/dr?msisdn=' + msisdn + '&trxid=' + trxId + '&trxdate=' + dateString + '&shortcode=912345&stat=1',
                    method: "GET"
                }, function _callback(err, res, body) {
                    //console.log('[DR] ' + body + ' - ' + data);
                    //console.log(res);
                    console.log('DR to : ' + msisdn);
                });
            } else {
                console.log(data);
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

        function simulatorUpdateStatSms(sessID, callback) {
            mongoConnection(function (connection) {
                if (connection === 'ok') {
                    getConnection.db.collection('sms').update({sessionId: sessID}, {$set: {'stat': 'sended'}}, function (err, result) {
                        if (!err) {
                            callback('updateOk');
                        } else {
                            callback(err);
                        }
                    });
                }
            });
        }

        simulatorUpdateStatSms(id, function (data) {
            if (data === 'updateOk') {
                // HIT MO
                reQuest({
                    url: 'http://localhost:3000/xl/mo?msisdn=' + msisdn + '&sms=' + sms + '&trxid=' + id + '&trxdate=' + dateString + '&shortcode=912345',
                    method: "GET"
                }, function _callback(err, res, body) {
                    console.log('[MO] ' + body + ' - ' + data);
                });
            } else {
                console.log(data);
            }
        });
    }
});

module.exports = router;
