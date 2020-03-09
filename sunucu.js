const port = 4000;
const portp = 4001;
const mongo = require('mongodb').MongoClient;
const app = require('express')();
const http = require('http').Server(app);
const socketioJwt = require("socketio-jwt");
const client = require('socket.io')(http).listen(port).sockets;
const striptags = require('striptags');
const xss = require('xss');
const path = require('path');
const getIP = require('ipware')().get_ip;
const room = 'genel';
const static = require("express-static");
const router = require('express').Router();
const morgan = require('morgan');
const jwt_secret = 'RootRaz0r';

mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
    }
    console.log('MongoDB giris yapildi');

    app.use(morgan('dev'));
    app.use("/assets", static(__dirname + "/assets"));
    app.get('/', function(req, res){
        res.sendFile(__dirname + '/index.html');
        console.log(getIP(req));
    });
    app.use(function(req, res) {
        res.status(404);
        res.json({
            error: true,
            code: 404,
            message: 'Not found'
          });
          console.log(getIP(req));
    });
    app.use(function(error, req, res, next) {
        res.status(500); 
        res.json({
            error: true,
            code: 500,
            message: 'Internal server error'
          });
          console.log(getIP(req));
    });
    client.on('connection',  function(socket){
        console.log('Successfully started chat server on '+port);
        let chat = db.collection('chats');

        // --- FUNCTIONS START --- \\
        function sendStats(){
            let totalOnline = Object.keys(client.connected).length;
            let totalMessage = 0;

            chat.find().count(function(err, res){
                totalMessage = res;
                var genelOnline = 0;
                var oyuncuAramaOnline = 0;
                client.in('genel').clients((error, clients) => {
                    if (error) throw error;
                    genelOnline = clients.length;
                    socket.broadcast.emit('stats', {online: totalOnline, message: totalMessage, rooms: {genel: genelOnline, oyuncu_arama: oyuncuAramaOnline}});
                    socket.emit('stats', {online: totalOnline, message: totalMessage, rooms: {genel: genelOnline, oyuncu_arama: oyuncuAramaOnline}});
                });
                client.in('oyuncu-arama').clients((error, clients) => {
                    if (error) throw error;
                    oyuncuAramaOnline = clients.length;
                    socket.broadcast.emit('stats', {online: totalOnline, message: totalMessage, rooms: {genel: genelOnline, oyuncu_arama: oyuncuAramaOnline}});
                    socket.emit('stats', {online: totalOnline, message: totalMessage, rooms: {genel: genelOnline, oyuncu_arama: oyuncuAramaOnline}});
                });
                
            });
        }
       
        socket.on('joinroom', function(r) {
            let room = r.room;
            if(room == 'genel' || room == 'oyuncu-arama'){
                if(socket.room)
                socket.leave(socket.room);
                socket.join(room);
                getChatHistory(room);
            }else{
                let room = 'genel';
                if(socket.room)
                socket.leave(socket.room);
                socket.join(room);
                getChatHistory(room);
            }
        });
        
        socket.on('send', function(data){
            let name = data.name;
            let message = xss(striptags(data.message));
            let time = data.time;
            let room = data.room;
            let avatar = data.avatar;
            if(name == ''){
                fallBack('Lütfen bir kullanıcı adı belirleyin!', false);
            }else if(message == ''){
                fallBack('Lütfen bir mesaj girin!', false);
            }else if(message.length > 100){
                fallBack('Mesaj uzunluğu maksimum 100 karakter içermelidir', false);
            }else if(message.length < 1){
                fallBack('Mesaj uzunluğu minimum 1 karakter içermelidir', false);
            }else if(typeof avatar != "number"){
                fallBack('Geçersiz avatar', false);
            }else {
                handleMessage(message, data);
                console.log(data.name+': '+data.message+' ('+data.time+' in '+data.room+')');
            }
        });

        socket.on('sil', function(data){
            chat.remove({}, function(){
                socket.emit('silindi');
                sendStats();
            });
        });

        socket.on('giris', function(){
            sendStats();
        });
        socket.on('cikis', function(){
            sendStats();
        });
        sendStats();
    });
    app.listen(portp);
    console.log('basari ile start verildi '+portp);
});
