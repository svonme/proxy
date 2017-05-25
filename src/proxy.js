var path = require("path");
var task = require("./task");
var child_process = require('child_process');

task.empty();

function proxy(option, stdout, stderr, close, callback){
  var dir = path.normalize(option["path"]);
  var port = option["port"];

  task.create(path.resolve(dir), port, option["proxy"], function(status, taskfile){
    var shell = [taskfile];
    var spawn = child_process.spawn;
    var http = spawn("node", shell);
    //正常输出
    http.stdout.on('data', function(info){
      stdout({
        "info": info && info.toString(),
        "pid" : http.pid,
      });
    });

    //错误输出
    http.stderr.on('data', function(info){
      stderr({
        "info": info && info.toString(),
        "pid" : http.pid,
      });
    });

    //关闭，退出
    http.on('close', function(info){
      close({
        "info": info && info.toString(),
        "pid" : http.pid,
      });
    });
    callback({
      port: port,
      pid : http.pid,
      kill: function(){
        http.kill();
      },
      exit: function(){
        http.kill();
      }
    });
  });


  
}

module.exports = proxy;
