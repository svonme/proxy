# proxy
简单的代理服务

    该项目运行在 Node.js 环境中，请提前安装好 Node.js 环境

### 下载项目

    git clone https://github.com/svonme/proxy.git

### 安装项目依赖

    cd proxy     //进入下载的项目目录

    npm install  //安装依赖模块

### 运行

    npm start    // 会自动后台运行一个 Express 环境 浏览器访问 http://127.0.0.1:3000

### 停止

    npm stop     // 关闭所有代理

### 重启

    npm restart 


### 例子

![填写配置](./test/blog1.png)

---

![访问服务](./test/blog2.png)

---

![查看日志](./test/blog3.png)

---

    从上面可以看到配置了一个服务器代理接口地址，这个接口是聚合数据上的万年历免费接口, 通过代理很轻松的获取到了聚合服务器上的的数据。


