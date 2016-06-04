var express = require('express');
var Download = require('download');
var moment = require('moment');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server); // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
var fs = require('fs');

const uptimeRegex = /([0-9]*\ jours, [0-9]*\ heures, [0-9]*\ minutes)/g;
const networkRegex = /(\ *(WAN|Ethernet|Switch)\ *(Ok||(100baseTX-FD))+\ *[0-9]*\ ko\/s\ *[0-9]*\ ko\/s)/g;
const speedRegex = /[0-9]*\ ko\/s/g;

// Chargement de la page index.html
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
});

fs.access('fbx_info.txt', fs.F_OK, function (err) {
  if (err) {
    fs.writeFile('fbx_info.txt', 'Just now, we have created this file', function (err) {
      if (err) throw err;
      console.info('fbx_info.txt created.')
    })
  } else {
    console.info('fbx_info.txt already exist.')
  }
});

io.sockets.on('connection', function (socket) {
  setInterval(function () {
    var date = moment().format('hh:mm:ss');
    var String = '==============' + date + '==============';
    new Download({mode: '755'}).get('http://192.168.0.254/pub/fbx_info.txt').dest('./').run();
    fs.readFile('fbx_info.txt', function (err, data) {
      var uptime = data.toString().match(uptimeRegex);
      var match = data.toString().match(networkRegex);
      try {
        fbData = buildData(match);
        socket.volatile.emit('dataSend', {time: String, fbData: fbData, uptime: uptime})
      } catch (e) {
        console.error({
          'Match': match,
          'Data': data
        });

      }
    })
  }, 1000)
});

function buildData (match) {
  var build = {};
  build.wan = match[0].match(speedRegex);
  build.ethernet = match[1].match(speedRegex);
  build.switch = match[2].match(speedRegex);
  return build
}

server.listen(8080);
