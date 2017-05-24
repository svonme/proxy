var path = require("path");
var child_process = require('child_process');


var server = path.join(__dirname, "..", "node_modules/.bin/http-server");

function proxy(option, stdout, stderr, close){
  var dir = path.normalize(option["path"]);
  var port = option["port"];

  var shell = [dir, "-p", port, "--cors","*"];
  if(option["proxy"]){
    shell.push("--proxy", option["proxy"]);
  }
  var spawn = child_process.spawn;
  console.log(server + " " + shell.join(" "));

  var http = spawn(server, shell);

  //正常输出
  http.stdout.on('data', function(info){
    stdout({
      "info": info.toString(),
      pid : http.pid,
    });
  });

  //错误输出
  http.stderr.on('data', function(info){
    stderr({
      "info": info.toString(),
      pid : http.pid,
    });
  });

  //关闭，退出
  http.on('close', function(info){
    close({
      "info": info.toString(),
      pid : http.pid,
    });
  });

  return {
    port: port,
    pid : http.pid,
    kill: function(){
      http.kill();
    },
    exit: function(){
      http.kill();
    }
  }
}

module.exports = proxy;
