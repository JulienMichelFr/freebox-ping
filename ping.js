var express = require('express')
var Download = require('download')
var moment = require('moment')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io').listen(server) // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
var fs = require('fs')

// Chargement de la page index.html
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html')
})

fs.access('fbx_info.txt', fs.F_OK, function(err) {
  if (err) {
    fs.writeFile('fbx_info.txt', 'Just now, we have created this file', function (err) {
      if (err) throw err;
        console.log('fbx_info.txt created.')
    })
  } else {
    console.log('fbx_info.txt already exist.')
  }
});

var fbData = {
  wan : '',
  switch: '',
  ethernet: ''
}

var lastMinute = []
var lastHour = []
var lastDay = []
var secondeIndex = 0
var minuteIndex = 0
var hourIndex = 0

io.sockets.on('connection', function (socket) {
  setInterval(function () {
  var date = moment().format('hh:mm:ss')
  var String ='==============' + date + '=============='
  new Download({mode:'755'}).get('http://192.168.0.254/pub/fbx_info.txt').dest('./').run()
  var regex = /(\ *(WAN|Ethernet|Switch)\ *(Ok||(100baseTX-FD))+\ *[0-9]*\ ko\/s\ *[0-9]*\ ko\/s)/g
  var uptimeRegex = /([0-9]*\ jours, [0-9]*\ heures, [0-9]*\ minutes)/g
  fs.readFile('fbx_info.txt', function(err, data) {
    var uptime = data.toString().match(uptimeRegex)
    var match = data.toString().match(regex)
    try {
      fbData.wan = match[ 0 ].match(/[0-9]*\ ko\/s/g)
      fbData.ethernet = match[ 1 ].match(/[0-9]*\ ko\/s/g)
      fbData.switch = match[ 2 ].match(/[0-9]*\ ko\/s/g)

      lastMinute[ secondeIndex ] = fbData
      if (secondeIndex === 59) {
        secondeIndex = 0
        lastHour[ minuteIndex ] = fbData
        if (minuteIndex === 59) {
          minuteIndex = 0
          lastDay[ hourIndex ] = fbData
          if (hourIndex === 23) {
            hourIndex = 0
          }
        }

      }
      socket.volatile.emit('dataSend', { time: String, fbData: fbData, uptime: uptime})
    } catch (e) {
      console.log('Match', match)
      console.log('Data', data)
    }
    })
  }, 1000)
});

server.listen(8080)
