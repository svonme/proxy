var fs = require("fs");
var path = require("path");
var del = require('del');

var tmp = path.join(__dirname, "..", "tmp");

function proxy(dir, port, proxydomain){
  var dir2 = new Buffer(dir, "base64").toString();
  var httpserver = require("http-server");
  var createServer = httpserver.createServer;
  var server = createServer({
    root: dir2,
    robots: true,
    proxy: proxydomain || void 0,
    cors: true,
    logFn: function(req, res){
      console.log(Object.assign({
        "url": req.url
      },req.headers));
    }
  });
  console.log({
    "filePath": dir2,
    "port": port,
    "proxy": proxydomain
  });
  server.listen(port, function(){
    console.log("proxy server at http://127.0.0.1:%s", port);  
  });
}

function create(dir, port, proxydomain, callback){
  var dir2 = new Buffer(dir).toString("base64");
  var w_data = proxy + "\n" + "new proxy('"+ dir2 +"','"+ port +"','"+ proxydomain +"');";
  //判断文件是否存在
  fs.exists(tmp, function(st){
    if(!st){
      fs.mkdirSync(tmp);    
    }
    var filename = tmp + '/proxy_'+ port +'.js';
    fs.writeFile(filename, new Buffer(w_data), function (err) {
      callback && callback(err, filename);
    });
  });
}

function empty(callback){
  del([tmp + '/*.js']).then(function(res){
    callback && callback(res);
  });
}

module.exports = {
  "create": create,
  "empty" : empty,
  "tmp"   : tmp
};
