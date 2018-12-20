// pages/weather/weather.js
var app = getApp()
var day = ["今天", "明天", "后天"];
Page({

  /**
   * 页面的初始数据
   */
  data: {
    day: day,
    fontFamily: 'Bitstream Vera Serif Bold',
  },

  /**
   * 生命周期函数--监听页面加载
   * 1.设置页面标题
   * 2.获取经纬度数据并更新界面天气
   */
  onLoad: function (options) {
    //console.log('onLoad') 

    //设置页面标题
    wx.setNavigationBarTitle({
      title: '傻羊天气'
    })

    //获取经纬度
    var that = this 
    that.getLocation();
    that.loadFontFace();//加载字体
  },

  /**
   * 微信自带API获取经纬度
   * 1.微信获取的坐标为 WGS84 坐标系，是一种大地坐标系，也是目前广泛使用的 GPS 全球卫星定位系统使用的坐标系。
   * 2.百度对外接口的坐标系为 BD09 坐标系，并不是 GPS 采集的真实经纬度，
   * 3.在使用百度地图 JavaScript API 服务前，需先将非百度坐标通过坐标转换接口转换成百度坐标。否则会有约两三个街道的定位误差。
   */
  getLocation: function() {
    var that = this
    wx.getLocation({
      type: 'wgs84',
      success: function (res) {
        var latitude = res.latitude //纬度
        var longitude = res.longitude //经度
        console.log("lat:" + latitude + " lon:" + longitude);
        //that.getCity(latitude, longitude);//获取城市信息（不准确）
        that.locationCorrent(latitude, longitude);//把微信坐标转化为百度坐标
      }
    })
  },

  /**
   * 把微信坐标 WGS84 转化为百度坐标 BD09,校准定位误差
   * 文档：http://lbsyun.baidu.com/index.php?title=webapi/guide/changeposition
   * 接口功能：http://api.map.baidu.com/geoconv/v1/?coords=114.21892734521,29.575429778924&from=1&to=5&ak=你的密钥 //GET请求
   * 其中coords是经纬度
   * 转化WGS84坐标时from=1
   * 转化为BD09坐标时to=5
   */
  locationCorrent: function (latitude, longitude) {
    var that = this
    var url = "https://api.map.baidu.com/geoconv/v1/"//百度API提供的经纬度转换接口
    //访问页面所需要的参数
    var params = {
      from: 1,
      to: 5,
      coords: longitude + "," + latitude,//经度lon + 纬度lat
      ak: "S1vy268ChWoKLGP78AU5RmtnWs4xLyVn"//注意：百度浏览器端的AK
    }
    //微信访问url，进行经纬度转换
    wx.request({
      url: url,
      data: params,
      success: function (res) {
        console.log("坐标系转换");
        console.log(res);
        var baidulat = res.data.result[0].y;
        var baidulon = res.data.result[0].x;
        that.getCity(baidulat, baidulon);//把经纬度转换城城市
      }
    })
  },

  /**
   * 根据经纬度获取城市信息（城市、区、街道）
   */
  getCity: function (latitude, longitude) {
    var that = this;
    var url = "https://api.map.baidu.com/geocoder/v2/"; 
    var params = {
      ak: "S1vy268ChWoKLGP78AU5RmtnWs4xLyVn", //百度微信小程序端的AK
      output: "json",
      location: latitude + "," + longitude
    }
    //访问url获取数据
    wx.request({
      url: url, 
      data: params,
      success: function (res) {
        console.log("根据经纬度获取城市信息");
        console.log(res);
        var city = res.data.result.addressComponent.city;
        var district = res.data.result.addressComponent.district; 
        var street = res.data.result.addressComponent.street;

        var descCity = city.substring(0, city.length - 1);//得到城市名，因为是“北京市”，去掉最后一个字符“市”
        //给wxml里的城市、区、街道赋值
        that.setData({
          city: descCity,
          district: district, 
          street: street,
        })
        that.getWeahter(descCity);//获取天气信息
      },
      fail: function (res) { }, 
      complete: function (res) { },
    })
  },

  /**
   * 根据城市名获取天气信息
   */
  getWeahter: function (city) {
    var that = this
    var url = "https://api.map.baidu.com/telematics/v3/weather" //访问百度API微信小程序端获取天气
    var params = {
      location: city,
      output: "json",
      ak: "l6MF7lsA3DcGVn4Nz0oC6DORlA47y5I9"//百度微信小程序ak
    }

    //访问url获取数据
    wx.request({
      url: url,
      data: params,
      success: function (res) {
        console.log(res);
        //今日天气信息
        var date = res.data.date;//日期2018-12-19
        var lifeindex = res.data.results[0].index;//生活指数
        var pm25 = res.data.results[0].pm25;//PM2.5
        var curdata = res.data.results[0].weather_data[0].date;//实时的日期和温度
        var curdate = curdata.substring(0, curdata.indexOf('('));//取出日期
        var curtemp = curdata.substring(curdata.indexOf('：') + 1, curdata.length - 1);//取出温度(注意是中文冒号)
        //console.log(curdata + ", " + curdate + ", " + curtemp);
        var pic1 = res.data.results[0].weather_data[0].dayPictureUrl;
        var pic2 = res.data.results[0].weather_data[0].nightPictureUrl;
        var temp = res.data.results[0].weather_data[0].temperature; //温度范围
        var high = temp.substring(0, temp.indexOf('~'));//高温
        var low = temp.substring(temp.indexOf('~') + 1, temp.length);//低温
        var weather = res.data.results[0].weather_data[0].weather;//天气情况
        var wind = res.data.results[0].weather_data[0].wind;//风  
        var dir = wind.substring(0, wind.indexOf('风') + 1);//取出风向
        var sc = wind.substring(wind.indexOf('风') + 1, wind.length);//取出风力
        var cast = res.data.results[0].weather_data;//近几天天气预报
        var forecast = cast.slice(1, cast.length);//近几天天气预报过滤掉今天
        var qlty;//空气质量，根据pm25计算
        //console.log(Math.floor(pm25 / 50) + ", " + pm25);
        switch (Math.floor(pm25 / 50)){
          case 0: qlty = "优"; break;
          case 1: qlty = "良"; break;
          case 2: qlty = "轻度污染"; break;
          case 3: qlty = "中度污染"; break;
          case 4: qlty = "重度污染"; break;
          case 5: qlty = "严重污染"; break;
          default: qlty = "咩~傻羊不知道"; break;
        }
        switch (weather) {
          case "晴": pic1 =  "../../res/img/qing.png"; break;
          case "晴转多云": pic1 = "../../res/img/duoyun.png"; break;
          case "多云": pic1 = "../../res/img/duoyun.png"; break;
          case "阴": pic1 = "../../res/img/yin.png"; break;
          case "阵雨": pic1 = "../../res/img/zhenyu.png"; break;
          case "雷阵雨": pic1 = "../../res/img/leizhenyu.png"; break;
          case "雷阵雨伴有冰雹": pic1 = "../../res/img/leizhenyubingbao.png"; break;
          case "雨夹雪": pic1 = "../../res/img/yujiaxue.png"; break;
          case "小雨": pic1 = "../../res/img/xiaoyu.png"; break;
          case "中雨": pic1 = "../../res/img/zhongyu.png"; break;
          case "大雨": pic1 = "../../res/img/dayu.png"; break;
          case "暴雨": pic1 = "../../res/img/baoyu.png"; break;
          case "大暴雨": pic1 = "../../res/img/dabaoyu.png"; break;
          case "特大暴雨": pic1 = "../../res/img/tedabaoyu.png"; break;
          case "阵雪": pic1 = "../../res/img/zhenxue.png"; break;
          case "小雪": pic1 = "../../res/img/xiaoxue.png"; break;
          case "中雪": pic1 = "../../res/img/zhongxue.png"; break;
          case "大雪": pic1 = "../../res/img/daxue.png"; break;
          case "暴雪": pic1 = "../../res/img/baoxue.png"; break;
          case "雾": pic1 = "../../res/img/wu.png"; break;
          case "冻雨": pic1 = "../../res/img/xiaoyu.png"; break;//
          case "沙尘暴": pic1 = "../../res/img/shachenbao.png"; break;
          case "小雨转中雨": pic1 = "../../res/img/zhongyu.png"; break;//
          case "中雨转大雨": pic1 = "../../res/img/dayu.png"; break;//
          case "大雨转暴雨": pic1 = "../../res/img/baoyu.png"; break;//
          case "暴雨转大暴雨": pic1 = "../../res/img/dabaoyu.png"; break;//
          case "大暴雨转特大暴雨": pic1 = "../../res/img/tedabaoyu.png"; break;//
          case "小雪转中雪": pic1 = "../../res/img/zhongxue.png"; break;//
          case "中雪转大雪": pic1 = "../../res/img/daxue.png"; break;//
          case "大雪转暴雪": pic1 = "../../res/img/baoxue.png"; break;//
          case "浮尘": pic1 = "../../res/img/shachenbao.png"; break;//
          case "扬沙": pic1 = "../../res/img/shachenbao.png"; break;//
          case "强沙尘暴": pic1 = "../../res/img/shachenbao.png"; break;//
          case "霾": pic1 = "../../res/img/wu.png"; break;//
          default: pic1 = "../../res/img/yin.png"; break;
       } 
        for (var j = 0; j < forecast.length; j++) {
          switch (forecast[j].weather) {
            case "晴": forecast[j].pic1 = "../../res/img/qing.png"; break;
            case "晴转多云": forecast[j].pic1 = "../../res/img/duoyun.png"; break;
            case "多云": forecast[j].pic1 = "../../res/img/duoyun.png"; break;
            case "阴": forecast[j].pic1 = "../../res/img/yin.png"; break;
            case "阵雨": forecast[j].pic1 = "../../res/img/zhenyu.png"; break;
            case "雷阵雨": forecast[j].pic1 = "../../res/img/leizhenyu.png"; break;
            case "雷阵雨伴有冰雹": forecast[j].pic1 = "../../res/img/leizhenyubingbao.png"; break;
            case "雨夹雪": forecast[j].pic1 = "../../res/img/yujiaxue.png"; break;
            case "小雨": forecast[j].pic1 = "../../res/img/xiaoyu.png"; break;
            case "中雨": forecast[j].pic1 = "../../res/img/zhongyu.png"; break;
            case "大雨": forecast[j].pic1 = "../../res/img/dayu.png"; break;
            case "暴雨": forecast[j].pic1 = "../../res/img/baoyu.png"; break;
            case "大暴雨": forecast[j].pic1 = "../../res/img/dabaoyu.png"; break;
            case "特大暴雨": forecast[j].pic1 = "../../res/img/tedabaoyu.png"; break;
            case "阵雪": forecast[j].pic1 = "../../res/img/zhenxue.png"; break;
            case "小雪": forecast[j].pic1 = "../../res/img/xiaoxue.png"; break;
            case "中雪": forecast[j].pic1 = "../../res/img/zhongxue.png"; break;
            case "大雪": forecast[j].pic1 = "../../res/img/daxue.png"; break;
            case "暴雪": forecast[j].pic1 = "../../res/img/baoxue.png"; break;
            case "雾": forecast[j].pic1 = "../../res/img/wu.png"; break;
            case "冻雨": forecast[j].pic1 = "../../res/img/xiaoyu.png"; break;//
            case "沙尘暴": forecast[j].pic1 = "../../res/img/shachenbao.png"; break;
            case "小雨转中雨": forecast[j].pic1 = "../../res/img/zhongyu.png"; break;//
            case "中雨转大雨": forecast[j].pic1 = "../../res/img/dayu.png"; break;//
            case "大雨转暴雨": forecast[j].pic1 = "../../res/img/baoyu.png"; break;//
            case "暴雨转大暴雨": forecast[j].pic1 = "../../res/img/dabaoyu.png"; break;//
            case "大暴雨转特大暴雨": forecast[j].pic1 = "../../res/img/tedabaoyu.png"; break;//
            case "小雪转中雪": forecast[j].pic1 = "../../res/img/zhongxue.png"; break;//
            case "中雪转大雪": forecast[j].pic1 = "../../res/img/daxue.png"; break;//
            case "大雪转暴雪": forecast[j].pic1 = "../../res/img/baoxue.png"; break;//
            case "浮尘": forecast[j].pic1 = "../../res/img/shachenbao.png"; break;//
            case "扬沙": forecast[j].pic1 = "../../res/img/shachenbao.png"; break;//
            case "强沙尘暴": forecast[j].pic1 = "../../res/img/shachenbao.png"; break;//
            case "霾": forecast[j].pic1 = "../../res/img/wu.png"; break;//
            default: forecast[j].pic1 = "../../res/img/yin.png"; break;
          } 
          var high = forecast[j].temperature.substring(0, forecast[j].temperature.indexOf('~'));//高温
          var low = forecast[j].temperature.substring(forecast[j].temperature.indexOf('~') + 1, forecast[j].temperature.length - 1);//低温
          forecast[j].temperature = low + "/" + high + "°C";
        } 
        //forecast.pic1 = changeImg();
    
        //更新wxml的数据
        that.setData({
          curtemp: curtemp,   //实时温度
          date: curdate,       //日期
          type: weather,      //天气情况
          pic1: pic1,
          pm25: pm25,
          qlty: qlty,
          dir: dir,
          sc: sc,
          temp: low + "~" + high + "°C",
          forecast: forecast
        })
        //将变量存到临时数据存储器中（生活指数在下一个页面）
        wx.setStorage({
          key: 'life', //标签名
          data: 'lifeindex', //数据
        })  
      },
      fail: function (res) { },
      complete: function (res) { },
    })
  },

  /**
   * 加载外部字体
   * 文档：https://developers.weixin.qq.com/miniprogram/dev/api/media/font/wx.loadFontFace.html
   */
  loadFontFace() {
    const self = this
    wx.loadFontFace({
      family: this.data.fontFamily, //字体名字
      source: 'url("https://sungd.github.io/Pacifico.ttf")', //网络字体
      success(res) {
        console.log(res.status)
        self.setData({ loaded: true })
      },
      fail: function (res) {
        console.log(res.status)
      },
      complete: function (res) {
        console.log(res.status)
      }
    });
  },
  //获取天气信息（用和风天气）
  // getWeahter: function (city) {
  //   var that = this
  //   var url = "https://free-api.heweather.com/s6/weather" 
  //   var url2 = "https://free-api.heweather.com/s6/air" 
  //   var parameters = {
  //     location: city,
  //     key: "d630e6a456204e26be38859bcb83e3fe"//"27a8e3ba095341f9881a45203f102978"
  //   }
  //   wx.request({
  //     url: url,
  //     data: parameters, success: function (res) {
  //       var tmp = res.data.HeWeather6[0].now.tmp;//温度
  //       var txt = res.data.HeWeather6[0].now.cond_txt;//天气状况
  //       var code = res.data.HeWeather6[0].now.cond_code; 
  //       var dir = res.data.HeWeather6[0].now.wind_dir; 
  //       var sc = res.data.HeWeather6[0].now.wind_sc;
  //       var hum = res.data.HeWeather6[0].now.hum; 
  //       var fl = res.data.HeWeather6[0].now.fl;
  //       var daily_forecast = res.data.HeWeather6[0].daily_forecast;   
  //       //根据天气状况换图片
  //       var urlImg; 
  //       switch (txt) {
  //         case '晴': urlImg =  "../../res/img/w0.png"; break;
  //         case '阴': urlImg = "../../res/img/w0.png"; break;
  //       }    
  //       that.setData({
  //         tmp: tmp, 
  //         txt: txt, 
  //         code: code, 
  //         dir: dir, 
  //         sc: sc, 
  //         hum: hum, 
  //         fl: fl,
  //         daily_forecast: daily_forecast,
  //         pic1: urlImg
  //       })
  //     },
  //     fail: function (res) { }, 
  //     complete: function (res) { },
  //   })
  //   wx.request({
  //     url: url2,
  //     data: parameters, 
  //     success: function (res) {
  //       var qlty = res.data.HeWeather6[0].air_now_city.qlty; 
  //       var pm25 = res.data.HeWeather6[0].air_now_city.pm25;
  //       // var air_forecast = res.data.HeWeather6[0].air_forecast
  //       that.setData({
  //         qlty: qlty,
  //         pm25: pm25
  //         // air_forecast: air_forecast
  //       })
  //     },
  //     fail: function (res) { }, 
  //     complete: function (res) { },
  //   })
  // },
/*-----------------------------------------------------------------------------------------*/
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})