const portumuz = 4000;
const portp = 4001;
const veritabani = require('mongodb').MongoClient;
const uygulamamiz = require('express')();
const http = require('http').Server(app);
const socketioJwt = require("socketio-jwt");
const kullanici = require('socket.io')(http).listen(port).sockets;
const striptaglarimiz = require('striptags');
const xssengelle = require('xss');
const klasor = require('path');
const ipgetir = require('ipware')().get_ip;
const kanal = 'genel';
const statik = require("express-static");
const yönlendirici = require('express').Router();
const anahtar = 'RootRaz0r';

mongo.connect('mongodb://127.0.0.1/hackersohbet', function(err, db){
    if(err){
        throw err;
    }
    console.log('MongoDB giris yapildi');

    app.use(morgan('dev'));
    app.use("/tasarim", static(__dirname + "/tasarim"));
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
    client.on('giris',  function(socket){
        console.log('sunucu basari ile aktif edildi '+port);
        let sohbet = db.collection('sohbet');

        // --- fonksiyonlarimiz --- \\
        function istatistik(){
            let toplamkullanici = Object.keys(client.connected).length;
            let toplammesaj = 0;

            chat.find().count(function(err, res){
                toplammesaj = res;
                var genelOnline = 0;
                var oyuncuAramaOnline = 0;
                client.in('genel').clients((error, clients) => {
                    if (error) throw error;
                    genelOnline = clients.length;
                    socket.broadcast.emit('stats', {online: toplamkullanici, message: toplammesaj, odalar: {genel: genelOnline, oyuncu_arama: oyuncuAramaOnline}});
                    socket.emit('stats', {online: toplamkullanici, message: toplammesaj, odalar: {genel: genelOnline, oyuncu_arama: oyuncuAramaOnline}});
                });
                client.in('oyuncu-arama').clients((error, clients) => {
                    if (error) throw error;
                    oyuncuAramaOnline = clients.length;
                    socket.broadcast.emit('istatistikler', {online: toplamkullanici, mesaj: toplammesaj, odalar: {genel: genelOnline, oyuncu_arama: oyuncuAramaOnline}});
                    socket.emit('istatistikler', {online: toplamkullanici, mesaj: toplammesaj, odalar: {genel: genelOnline, oyuncu_arama: oyuncuAramaOnline}});
                });
                
            });
        }
       
        socket.on('odayagir', function(r) {
            let kanal = r.oda;
            if(kanal == 'genel' || kanal == 'oyuncu-arama'){
                if(socket.oda)
                socket.cikis(socket.kanal);
                socket.giris(kanal);
                sohbetloglari(kanal);
            }else{
                let kanal = 'genel';
                if(socket.kanal)
                socket.cikis(socket.kanal);
                socket.giris(kanal);
                sohbetloglari(kanal);
            }
        });
        
        socket.on('gonder', function(data){
            let isim = data.isim;
            let mesaj = xss(striptags(data.mesaj));
            let zaman = data.zaman;
            let oda = data.oda;
            let avatar = data.avatar;
            if(isim == ''){
                GeriDonus('Lütfen bir kullanıcı adı belirleyin!', false);
            }else if(mesaj == ''){
                GeriDonus('Lütfen bir mesaj girin!', false);
            }else if(mesaj.length > 100){
                GeriDonus('Mesaj uzunluğu maksimum 100 karakter içermelidir', false);
            }else if(mesaj.length < 1){
                GeriDonus('Mesaj uzunluğu minimum 1 karakter içermelidir', false);
            }else if(typeof avatar != "number"){
                GeriDonus('Geçersiz avatar', false);
            }else {
                KullaniciMesaji(mesaj, data);
                console.log(data.isim+': '+data.isim+' ('+data.zaman+' in '+data.oda+')');
            }
        });

        socket.on('sil', function(data){
            chat.remove({}, function(){
                socket.emit('silindi');
                istatistikler();
            });
        });

        socket.on('giris', function(){
            istatistikler();
        });
        socket.on('cikis', function(){
            istatistikler();
        });
        istatistikler();
    });
    app.listen(portp);
    console.log('basari ile start verildi '+portp);
});
