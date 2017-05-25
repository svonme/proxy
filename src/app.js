var path = require("path");
var http = require('http');
var fs = require('fs');
var express = require('express');
var socket = require('socket.io');
var url = require("url");
var proxy = require('./proxy');
var Pid = require('./pid');
var app = express();
var server = http.Server(app);
var io = socket(server);

var staticDir = path.normalize(path.join(__dirname, "static"));
//静态文件资源
app.use(express.static(staticDir));

function stdout(info){
  //标准日志
  io.emit('message', info);
}
function stderr(info){
  //错误日志
  io.emit('message', info);
}
function close(info){
  //服务关闭，退出
  io.emit('message', info);
}

io.on('connection', function (socket) {

  socket.on('kill', function (pid) {
    Pid.kill(pid, socket);
  });

  socket.on('proxy', function (data) {
    if(!data["path"]){
      return socket.emit('err', {
        "message": "项目文件地址不能为空<br/>请填写项目文件地址"
      });
    }
    var status = fs.existsSync(path.normalize(data["path"]));
    if(!status){
      return socket.emit('err', {
        "message": "项目文件地址不存在<br/>请检测后重新填写"
      });
    }
    if(!/^[0-9]{2,4}$/.test(data["port"])){
      return socket.emit('err', {
        "message": "请正确填写项目运行端口<br/>注意端口只能为数字且为 80 - 9999 之间的数字"
      });
    }

    if(data['proxy']){
      var location = url.parse(data['proxy']);
      var host = location.host;
      var protocol = location.protocol;

      if(!host){
        return socket.emit('message', {
          "message": "代理服务器地址错误，请检查后重新填写"
        });
      }
      data['proxy'] = protocol + "//" + host;
    }

    var httpserver = proxy(data, stdout, stderr, close);

    

    Pid.add(httpserver, socket);

    socket.emit('proxy', {
      "message": "参数正确，启动代理中",
      "pid": httpserver.pid
    });
    return true;

  });

  Pid.refresh(socket);
  
});



server.listen(3000, function(){
  console.log('Example app listening at http://%s:%s', "127.0.0.1", "3000");
});
