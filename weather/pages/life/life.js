// pages/life/life.js
var app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '生活指数',
    })
    let lifeindex = wx.getStorageSync('life');//取出weather.js里存入life的生活指数数据
    console.log("生活指数" + lifeindex);
    console.log("生活指数" + lifeindex[0].des);
    this.setData({
      lifeindex: lifeindex//渲染到wxml里
    })
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})