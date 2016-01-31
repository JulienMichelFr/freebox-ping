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

io.sockets.on('connection', function (socket) {
  setInterval(function () {
  var date = moment().format('hh:mm:ss')
  var String ='==============' + date + '=============='
  new Download({mode:'755'}).get('http://192.168.0.254/pub/fbx_info.txt').dest('./').run()
  var regex = /(\ *(WAN|Ethernet|Switch)\ *(Ok||(100baseTX-FD))+\ *[0-9]*\ ko\/s\ *[0-9]*\ ko\/s)/g
  fs.readFile('fbx_info.txt', function(err, data) {
    var match = data.toString().match(regex)
    fbData.wan = match[0].match(/[0-9]*\ ko\/s/g)
    fbData.ethernet = match[1].match(/[0-9]*\ ko\/s/g)
    fbData.switch = match[2].match(/[0-9]*\ ko\/s/g)
    socket.volatile.emit('dataSend', {time: String, fbData: fbData})
    })
  }, 1000)
});

server.listen(8080)
