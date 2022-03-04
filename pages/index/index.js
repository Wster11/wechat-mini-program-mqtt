import mqtt from "../../utils/mqtt.min.js";

const host = "wxs://xxxx.xxx.xx.xx"; //环信MQTT服务器地址 通过console后台[MQTT]->[服务概览]->[服务配置]下[连接地址]获取

/**
 * 推荐使用真机调试、模拟器websocket连接不稳定
 */

var deviceId = "deviceId"; // MQTT 用户自定义deviceID

var appId = "appId"; // appID 通过console后台[MQTT]->[服务概览]->[服务配置]下[AppID]获取

var restApiUrl = "restApiUrl"; //环信MQTT REST API地址 通过console后台[MQTT]->[服务概览]->[服务配置]下[REST API地址]获取

var username = "username"; //自定义用户名 长度不超过64位即可

var appClientId = "appClientId"; // 开发者ID 通过console后台[应用概览]->[应用详情]->[开发者ID]下[ Client ID]获取

var appClientSecret = "appClientSecret"; // 开发者密钥 通过console后台[应用概览]->[应用详情]->[开发者ID]下[ ClientSecret]获取

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
      password: "", // 用户密码通过getUserToken方法获取
      username,
      reconnectPeriod: 1000, // 1000毫秒，两次重新连接之间的间隔
      connectTimeout: 30 * 1000, // 1000毫秒，两次重新连接之间的间隔
      resubscribe: true, // 如果连接断开并重新连接，则会再次自动订阅已订阅的主题（默认true）
      appid: appId
    }
  },
  /**
   * 客户端获取appToken代码示例如下：
   */
  getAppToken() {
    var that = this;
    var api = `${restApiUrl}/openapi/rm/app/token`;
    // 配置连接的用户名和密码
    var params = {
      appClientId,
      appClientSecret
    };
    // 注意：可以对params加密等处理
    wx.request({
      url: api,
      data: params,
      method: "POST",
      success(res) {
        let appToken = res.data.body.access_token;
        console.log("appToken", appToken);
        // 根据appToken获取userToken
        that.getUserToken(appToken);
      },
      fail() {
        wx.showModal({
          content: "fail"
        });
      }
    });
  },

  /**
   * 客户端获取userToken(password)代码示例如下：
   */
  getUserToken(appToken) {
    var that = this;
    var api = `${restApiUrl}/openapi/rm/user/token`;
    // 配置连接的用户名和密码
    var params = {
      username: username,
      expires_in: 86400, // 过期时间，单位为秒，默认为3天，如需调整，可提工单调整
      cid: `${deviceId}@${appId}`
    };
    // 注意：可以对params加密等处理
    wx.request({
      url: api,
      data: params,
      method: "POST",
      header: {
        Authorization: appToken
      },
      success(res) {
        let userToken = res.data.body.access_token;
        console.log("userToken", userToken);
        that.data.options.password = userToken;
        wx.showModal({
          content: `userToken: ${userToken}`
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
