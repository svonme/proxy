define("message", ["$"], function($){
  function Message(e){
    var message = e.message || "异常，请稍后再试";
    var $message = $("#message");
    $(".tips-text", $message).html(message);
    $message.modal();
  }
  return Message;
});



define("socket", ["$","message"], function($, Message){
  var origin = window.location.origin;
  var socket = io.connect(origin);

  var $logs = $("#logs-con");

  socket.on('message', function (data) {
    var info = data.info;
    var pid = data.pid;
    var html = "<p>";
    if(typeof info == "object"){
      for(var key in info){
        html += info[key]+"<br/>";
      }
    }else{
      html += info;
    }
    html += "</p><hr/>";
    $("#pid-"+pid, $logs).append(html);
  });

  socket.on('proxy', function (data) {
    $("#form-con").hide();
    $logs.show();
    $("#pid-"+data.pid, $logs).show().siblings().hide();
  });

  socket.on('err', function (error) {
    Message(error);
  });


  socket.on('pids', function (list) {
    var li = [];
    list.forEach(function(item){
      li.push('<li class="list-group-item pointer" data-id="pid-'+ item.pid +'">' +
                '<span class="badge">'+ item.pid +'</span>'+ item.port +
              '</li>');
      if($("#pid-" + item.pid).length < 1){
        $logs.append('<div class="list" id="pid-'+ item.pid +'" style="display:none;">'+
                        '<div>'+
                          '<div class="btn btn-warning stop-proxy" data-id="'+ item.pid +'">'+
                            '<span class="glyphicon glyphicon-remove"></span>停止该服务'+
                          '</div>'+
                          '<hr/>'+
                        '</div>'+
                    '</div>');
      }
    });
    $(".list-group").html(li.join(""));
  });



  return function Socket(){
    this.emit = function(){
      socket.emit.apply(socket, arguments);
    }
    this.proxy = function(data){
      socket.emit("proxy", data); 
    }
    this.kill = function(pid){
      socket.emit("kill", pid);
    }
  };
});



define("proxy", ["$","message", "socket"], function($, Message, Socket){
  var $main = $("#main");
  var socket = new Socket();

  function check(elements){
    new Promise(function(resolve){
      var data = {};
      for(var key in elements){
        data[key] = $.trim(elements[key] || "");
      }
      resolve(data);
    }).then(function(data){
      if(data["path"]){
        return data;
      }
      throw {
        "message": "请填写项目文件地址"
      }
    }).then(function(data){
      //端口判断
      var key = "port";
      if(!data[key]){
        data[key] = "8080";
      }
      if(data[key] && /^[0-9]{2,4}$/.test(data[key])){
        return data;
      }
      throw {
        "message": "请正确填写项目运行端口<br/>注意端口只能为数字且为 80 - 9999 之间的数字"
      }
    }).then(function(data){
      //发送代理事件
      socket.proxy(data);
    }).catch(function(e){
      Message(e);
    });
  }


  function proxy(){
    $("#submit", $main).on("click", function(e){
      var form = $("form", "#form-con").get(0);
      var elements = {};
      ["path","port","proxy"].forEach(function(key){
        elements[key] = form.elements[key] ? form.elements[key].value : "";
      });
      check(elements);
      return false;
    });

    $(".glyphicon-plus", $main).on("click", function(){
      $("#logs-con").hide();
      $("#form-con").show();
    });

    $(".list-group", $main).on("click", ".list-group-item", function(){
      $("#form-con").hide();
      $("#logs-con").show();
      var id = $(this).data("id");

      $("#pid-"+id).show().siblings().hide();
    });

    $("#logs-con", $main).on("click",".stop-proxy",function(){
      var id = $(this).data("id");
      socket.kill(id);

      $("#logs-con").hide();
      $("#form-con").show();

      $("#pid-"+id).remove();
    });
  }

  return proxy;
});

require(["$", "proxy", ,"bootstrap"], function($, proxy){
  $("#main").show();
  proxy();
});
