// 进程维护

let map = {};

function refresh(socket){
  let list = [];
  for(var key in map){
    var httpserver = map[key];
    list.push({
      "pid": httpserver.pid,
      "port": httpserver.port
    });
  }
  socket.emit('pids', list);
}

function Add(httpserver, socket){
  map[httpserver.pid] = httpserver;
  refresh(socket);
}

function Kill(pid, socket){
  var httpserver = map[pid];
  httpserver.kill(pid); //关闭进程
  delete map[pid];
  refresh(socket);
}

module.exports = {
  "add": Add,
  "kill": Kill,
  "refresh": refresh
};