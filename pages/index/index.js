import mqtt from "../../utils/mqtt.min.js";

// host在【MQTT】->【服务概览】->【服务配置】下的【连接地址】获取
const host = "wxs://XXXXXXXX";

/**
 * 推荐使用真机调试、模拟器websocket连接不稳定
 *
 * appId、baseUrl、orgName、appName 需从console控制台获取
 *
 */

var deviceId = "deviceId"; // MQTT 用户自定义deviceID

var appId = "appId"; // 从console控制台获取
var appName = "appName"; // appName
var orgName = "orgName"; // orgName

var baseUrl = "baseUrl"; // token域名 https://

var grantType = "password"; // 获取token接口的参数,不用改动

var username = "username"; // IM用户名
var password = "password"; // IM用户密码

Page({
  data: {
    client: null, // 记录重连的次数
    reconnectCounts: 0,
    // MQTT连接的配置,注意传参！！！！
    options: {
      keepalive: 60,
      protocolVersion: 4, // MQTT连接协议版本
      clientId: `${deviceId}@${appId}`, // deviceID@AppID
      clean: true, // cleanSession不保持持久会话
      password: "", // 用户token, 可以通过getToken方法获取,或者去console控制台获取对应的token
      username,
      reconnectPeriod: 1000, // 1000毫秒，两次重新连接之间的间隔
      connectTimeout: 30 * 1000, // 1000毫秒，两次重新连接之间的间隔
      resubscribe: true, // 如果连接断开并重新连接，则会再次自动订阅已订阅的主题（默认true）
      appid: appId
    }
  },
  /**
   * 客户端获取token(password)代码示例如下：
   */
  getToken() {
    var that = this;
    var api = `${baseUrl}/${orgName}/${appName}/token`;

    // 配置连接的用户名和密码
    var params = {
      grant_type: grantType,
      username,
      password
    };
    // 注意：可以对params加密等处理
    wx.request({
      url: api,
      data: params,
      method: "POST",
      success(res) {
        const {
          data: { access_token }
        } = res;
        that.data.options.password = access_token;
        wx.showModal({
          content: access_token
        });
      },
      fail() {
        wx.showModal({
          content: "fail"
        });
      }
    });
  },
  connect() {
    // 开始连接
    this.data.client = mqtt.connect(host, this.data.options);
    this.data.client.on("connect", function (connack) {
      console.log("开始连接", connack);
      wx.showToast({
        title: "连接成功"
      });
    });

    // 服务器下发消息的回调
    this.data.client.on("message", function (topic, payload) {
      console.log(` 收到 topic:${topic} , payload :${payload}`);
      wx.showModal({
        content: ` 收到topic:[${topic}], payload :[${payload}]`,
        showCancel: false
      });
    });

    // 服务器连接异常的回调
    this.data.client.on("error", function (error) {
      console.log(` 服务器 error 的回调${error}`);
    });

    // 服务器重连连接异常的回调
    this.data.client.on("reconnect", function () {
      console.log(" 服务器 reconnect的回调");
    });

    // 服务器连接异常的回调
    this.data.client.on("offline", function () {
      console.log(" 服务器offline的回调");
    });

   
  },
  subOne() {
    if (this.data.client && this.data.client.connected) {
      // 仅订阅单个主题
      this.data.client.subscribe("Topic0", function (err, granted) {
        if (!err) {
          wx.showToast({
            title: "订阅主题成功"
          });
        } else {
          wx.showToast({
            title: "订阅主题失败",
            icon: "fail",
            duration: 2000
          });
        }
      });
    } else {
      wx.showToast({
        title: "请先连接服务器",
        icon: "none",
        duration: 2000
      });
    }
  },
  pubMsg() {
    if (this.data.client && this.data.client.connected) {
      this.data.client.publish("Topic0", "i am  from wechat msg");
    } else {
      wx.showToast({
        title: "请先连接服务器",
        icon: "none",
        duration: 2000
      });
    }
  },
  unSubscribe() {
    if (this.data.client && this.data.client.connected) {
      this.data.client.unsubscribe("Topic0");
    } else {
      wx.showToast({
        title: "请先连接服务器",
        icon: "none",
        duration: 2000
      });
    }
  }
});
