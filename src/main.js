import Vue from 'vue'
import App from './App'

Vue.config.productionTip = false
App.mpType = 'app'

// 配置axios
import axios from 'axios'
//拦截器
// 添加请求拦截器
axios.interceptors.request.use(function (config) {
  wx.showLoading({
    title:'正在加载中...',
    mask:true
  })
  // 在发送请求之前做些什么
  if(wx.getStorageSync('token')){
    config.headers.Authorization = wx.getStorageSync('token')
  }
  return config;
}, function (error) {
  // 对请求错误做些什么
  return Promise.reject(error);
});
// axios 的适配器，可以用来替换掉我们底层的axios的实现
axios.defaults.adapter = function(config) {
  return new Promise((resolve, reject) => {
    // 通过适配器，把axios默认的使用xhr发送请求，换成使用wx.request发送请求
    wx.request({
      url: config.url,
      method: config.method,
      header:config.headers,
      data: config.params ? config.params : config.data, //这种写法是为了兼容GET/POST
      success: function(res) {
        resolve(res)
      },
      fail: function(err) {
        reject(err)
      },
      complete:function(){
        wx.hideLoading()
      }
    })
  })
}
axios.defaults.baseURL = 'https://www.zhengzhicheng.cn/'
Vue.prototype.$axios = axios

const app = new Vue(App)
app.$mount()
