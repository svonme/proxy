define("formatJSON",[], function(){
  var realTypeOf = function (v) {
    if (typeof(v) == "object") {
        if (v === null) return "null";
        if (v.constructor == ([]).constructor) return "array";
        if (v.constructor == (new Date).constructor) return "date";
        if (v.constructor == (new RegExp).constructor) return "regex";
        return "object";
    }
    return typeof(v);
  };

  var escapeHTML = function (string) {                                       
    return (string + "").replace(/&/g,'&amp;').replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  };

  /**
   * 通过返回JSON数据，进行格式化
   * @param {Object} oData
   * @param {String} sIndent
   * @returns {*}
   */
  var formatJSON = function (oData, sIndent) {
      if (!oData) {
          return '';
      }
      var sHTML,
          iCount;
      if (arguments.length < 2) {
          sIndent = "";
      }
      var sIndentStyle = "    ",
          sDataType = realTypeOf(oData);

      // open object
      if (sDataType === "array") {
          if (oData.length === 0) {
              return "[]";
          }
          sHTML = "[";
      } else {
          iCount = 0;
          Object.keys(oData).forEach(function () {
              iCount++;
          });
          if (iCount === 0) { // object is empty
              return "{}";
          }
          sHTML = "{";
      }
      // loop through items
      iCount = 0;
      Object.keys(oData).forEach(function(sKey){
        var vValue = oData[sKey];
        if (iCount > 0) {
            sHTML += ",";
        }
        if (sDataType === "array") {
            sHTML += ("\n" + sIndent + sIndentStyle);
        } else {
            sHTML += ("\n" + sIndent + sIndentStyle + "\"" + escapeHTML(sKey) + "\"" + ": ");
        }

        // display relevant data type
        switch (realTypeOf(vValue)) {
            case "array":
            case "object": {
                sHTML += formatJSON(vValue, (sIndent + sIndentStyle));
            }
                break;
            case "boolean":
            case "number": {
                sHTML += vValue.toString();
            }
                break;
            case "null": {
                sHTML += "null";
            }
                break;
            case "string": {
                sHTML += ("\"" + escapeHTML(vValue) + "\"");
            }
                break;
            default: {
                sHTML += ("TYPEOF: " + typeof(vValue));
            }
        }

        // loop
        iCount++;
      })

      // close object
      if (sDataType === "array") {
          sHTML += ("\n" + sIndent + "]");
      } else {
          sHTML += ("\n" + sIndent + "}");
      }
      // return
      return sHTML;
  };
  return formatJSON;
})




define("message", ["$"], function($){
  function Message(e){
    var message = e.message || "异常，请稍后再试";
    var $message = $("#message");
    $(".tips-text", $message).html(message);
    $message.modal();
  }
  return Message;
});

define("logs", ["$", "formatJSON"], function($, formatJSON){
  var $logs = $("#logs-con");
  var $form = $("#form-con");
  function Logs(){
    this.show = function(pid){
      $form.hide();
      $logs.show();
      if(pid){
        this.append(pid);
        $("#pid-" + pid, $logs).show().siblings().hide();
        var $groupI = $("#group-i-" + pid);
        $groupI.addClass('active').siblings('.active').removeClass('active');
      }
    };

    this.hide = function(){
      $logs.hide();
      $form.show();
      $(".list-group-item.active", ".list-group").removeClass('active');
    };

    this.append = function(pid, port){
      if(pid){
        var $item = $("#pid-" + pid, $logs);
        if($item.length < 1){
          var html = '<div class="list" id="pid-'+ pid +'" style="display: none;">'+
                          '<div>'+
                            '<div class="btn btn-warning stop-proxy" data-id="'+ pid +'">'+
                              '<span class="glyphicon glyphicon-remove"></span>停止该服务'+
                            '</div>';
                  if(port){
                    var href = "http://127.0.0.1:" + port;
                    html += '<a class="btn btn-primary" href="'+ href +'" target="_blank" style="margin-left:50px;">'+
                              '访问 : ' + href + 
                            '</a>';
                  }
                    html +='<hr/>'+
                          '</div>'+
                      '</div>';
          $logs.append(html);
        }
      }
    }

    this.remove = function(pid){
      if(pid){
        this.hide();
        $("#pid-"+pid, $logs).remove();
      }
    }

    this.message = function(pid, info){
      var html = "<div><pre>";
      if(typeof info == "object"){
        html += formatJSON(info);
      }else{
        if(info.slice(0,1) == "{"){
          html += formatJSON(eval('('+info+')'));
        }else{
          html +=info;
        }
      }
      html += "</pre></div><hr/>";
      $("#pid-"+pid, $logs).append(html);
    }
  }
  return new Logs();
});



define("socket", ["$","message", "logs"], function($, Message, logs){
  var origin = window.location.origin;
  var socket = io.connect(origin);

  socket.on('message', function (data) {
    var info = data.info;
    var pid = data.pid;
    logs.message(pid, info);
  });

  socket.on('proxy', function (data) {
    logs.show(data.pid); //显示日志，并且定位到当前任务
  });

  socket.on('err', function (error) {
    Message(error);
  });


  socket.on('pids', function (list) {
    var li = [];
    list.forEach(function(item){
      li.push('<li id="group-i-'+ item.pid +'" class="list-group-item pointer" data-id="'+ item.pid +'">' +
                '<span class="badge">'+ item.pid +'</span>'+ item.port +
              '</li>');
      logs.append(item.pid, item.port);
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



define("proxy", ["$","message", "socket", "logs"], function($, Message, Socket, logs){
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
      logs.hide();//隐藏日志，显示创建代理任务界面
    });

    $(".list-group", $main).on("click", ".list-group-item", function(){
      var id = $(this).data("id");
      logs.show(id);
    });

    $("#logs-con", $main).on("click",".stop-proxy",function(){
      var id = $(this).data("id");
      socket.kill(id);
      logs.remove(id);
    });
  }

  return proxy;
});

require(["$", "proxy", ,"bootstrap"], function($, proxy){
  $("#main").show();
  proxy();
});
