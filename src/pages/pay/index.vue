<template>
  <view>
    <!-- 1.0 收获地址 -->
    <view @click="chooseAddress" class="address">
      <view class="address-info" v-if="addressInfo">
        <view class="address-info-name-phone">
          <view>
            <text>收货人：{{addressInfo.userName}}</text>
          </view>
          <view style="display:flex;align-items: center;">
            <text style="margin-right:36rpx;">{{addressInfo.telNumber}}</text>
            <view class="iconfont-tap icon-jiantouyou"></view>
          </view>
        </view>
        <view class="address-info-detail-info">
          <text>收货地址：{{addressInfo.detailAddress}}</text>
        </view>
      </view>
      <view class="address-add" v-else>
        <text>+ 新增地址</text>
      </view>
      <view class="address-pic">
        <image src="/static/img/cart_border@2x.png" />
      </view>
    </view>
    <!-- 2.0 购买的商品列表 -->
    <view class="order-list">
      <block v-for="item in goodsList" :key="item.goods_id">
        <view class="product-item">
          <navigator class="product-left">
            <image :src="item.goods_small_logo" />
          </navigator>
          <view class="product-right">
            <navigator class="product-name">
              {{item.goods_name}}
            </navigator>
            <view class="product-right-price">
              <text class="product-right-price-symbol">￥</text>
              <text class="product-right-price-integer">{{item.goods_price}}</text>
              <text class="product-right-price-decimal">.00</text>
            </view>
            <view class="product-right-num">x{{item.goods_number}}</view>
          </view>
        </view>
      </block>
    </view>
    <!-- 3.0 总价格和运费 -->
    <view class="order-total">
      <view class="order-total-item">
        <view>商品金额</view>
        <view class="order-total-item-price">￥{{goodsAmount}}</view>
      </view>
      <view class="order-total-item">
        <view>运 费</view>
        <view class="order-total-item-price">+￥0.00</view>
      </view>
      <!-- 4.0 登录 / 下单 / 支付  -->
      <block v-if="!token">
        <button open-type="getUserInfo" @getuserinfo="wxLogin" class="wxLogin">点击登录后下单支付</button>
      </block>
      <block wx:else>
        <view @click="goToOrderAndPay" class="wxPay">微信支付</view>
      </block>
    </view>
    <!-- 5.0 toast组件 -->
    <toast transition="fade" :message='message' img="/static/img/error.png" :visible.sync="visible"></toast>
  </view>
</template>

<script>
import { getLocalGoods } from '@/utils/goodsStorageTool.js'
import toast from 'mpvue-toast'
export default {
  data() {
    return {
      ids: null, //要下单的ids
      addressInfo: null, //收获地址
      goodsList: [], //商品列表
      goodsAmount:0, //商品的总价格
      visible:false,
      token:null, //登录成功之后，后台给我们颁发的通行证
      message:"必须先授权，才能进行后续操作!"
    }
  },
  components: {
    toast
  },
  onLoad(options) {
    this.ids = options.ids

    //发送请求给后台获取商品信息
    this.getGoodsListData()

    //获取本地的address，如果有就直接显示
    if (wx.getStorageSync('address')) {
      this.addressInfo = wx.getStorageSync('address')
    }

    //判断是否登录过，如果登录过，就直接显示微信支付
    if (wx.getStorageSync('token')) {
      this.token = wx.getStorageSync('token')
    }
  },
  methods: {
    //选择收获地址
    chooseAddress() {
      wx.chooseAddress({
        success: res => {
          console.log(res)

          // 赋值给 addressInfo
          this.addressInfo = res
          this.addressInfo.detailAddress =
            res.provinceName + res.cityName + res.countyName + res.detailInfo

          // 存储到小程序本地
          wx.setStorageSync('address', this.addressInfo)
        },
        fail: err => {
          //如果用户拒绝了，在这里是没法再次弹出授权窗口的
          wx.showModal({
            title: '提示', //提示的标题,
            content: '你需要去我的 > 设置里面开启授权，获取地址信息', //提示的内容,
            showCancel: false, //是否显示取消按钮,
            confirmText: '确定', //确定按钮的文字，默认为取消，最多 4 个字符,
            confirmColor: '#3CC51F' //确定按钮的文字颜色
          })
        }
      })
    },
    //获取商品列表数据
    async getGoodsListData() {
      //1.获取本地存储的商品id
      const localGoods = getLocalGoods()

      //2.发送请求，获取服务器返回的数据
      const result = await this.$axios.get(
        `api/public/v1/goods/goodslist?goods_ids=${this.ids}`
      )

      let goodsAmount = 0
      result.data.message.forEach(goods => {
        goods.goods_number = localGoods[goods.goods_id]
        goodsAmount += goods.goods_number * goods.goods_price
      })

      this.goodsAmount = goodsAmount
      this.goodsList = result.data.message
    },
    //小程序第三方登录，获取授权用户的相关信息
    wxLogin(){
      //登录
      wx.login({
        success: res1 => {
          //获取用户信息
          wx.getUserInfo({
            withCredentials: true,//带上登录态信息
            success: res2 => {
              //1.存储userInfo到本地，将来在我的里面使用
              wx.setStorageSync('userInfo',res2.userInfo)

              //2.调用自家服务器，完成真正的第三方登录
              this.login(res1,res2)
            },
            fail: err => {
              //因为 getUserInfo 必须要获取到，如果拒绝了，他下次还会弹出来
              // console.log("用户取消了授权...",err)
              this.visible = true
            }
          });
        },
        fail: () => {
          console.log('wx login fail')
        }
      })
    },
    //调用自家服务器，完成登录操作
    async login(res1,res2){
      const result = await this.$axios.post('api/public/v1/users/wxlogin',{
        code:res1.code,
        encryptedData:res2.encryptedData,
        iv:res2.iv,
        rawData:res2.rawData,
        signature:res2.signature
      })

      if(result.data.meta.status === 200){
        this.token = result.data.message.token

        //存储到本地
        wx.setStorageSync('token',result.data.message.token)
      }
    },
    //下单及支付
    async goToOrderAndPay(){
      if(!this.addressInfo){
        this.message = "必须选择收货地址"
        this.visible = true
        return
      }

      //下单时候，要提交的参数对象
      const params = {}
      params.order_price = this.goodsAmount //订单价格 = 商品价格 + 运费
      params.consignee_addr = this.addressInfo.detailAddress //详细地址
      const tempArray = []
      this.goodsList.forEach(goods=>{
        const order_goods = {}
        order_goods.goods_id = goods.goods_id
        order_goods.goods_number = goods.goods_number
        order_goods.goods_price = goods.goods_price

        tempArray.push(order_goods)
      })
      params.goods = tempArray

      // 发送请求给后台
      /**
      const result = await this.$axios.post('api/public/v1/my/orders/create',params)

      if(result.data.meta.status === 200){
        this.pay(result.data.message.order_number)
      }
       */
      this.pay("HMDD20180818000000000130")
    },
    //支付
    async pay(order_number){
      const result = await this.$axios.post('api/public/v1/my/orders/req_unifiedorder',{order_number})

      if(result.data.meta.status === 200 ) {
        //唤起小程序中的微信支付
        wx.requestPayment({
          timeStamp:result.data.message.pay.timeStamp,
          nonceStr:result.data.message.pay.nonceStr,
          package:result.data.message.pay.package,
          paySign:result.data.message.pay.paySign,
          signType:result.data.message.pay.signType,
          success:res=>{
            this.$axios.post('api/public/v1/my/orders/chkOrder',{order_number}).then(res2=>{
              if(res2.data.meta.status === 200){
                wx.navigateTo({ url: '/pages/orders/main' });
              }
            })
          },
          fail:err=>{
            this.message = "用户取消了支付，即将跳转到订单列表页面！"
            this.visible = true
            setTimeout(() => {
              wx.navigateTo({ url: '/pages/orders/main' });
            }, 2000);
          }
        })
      }
    }
  }
}
</script>

<style scoped lang="less">
.address {
  height: 222rpx;
  background-color: #fff;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  &-info {
    display: flex;
    height: 160rpx;
    flex: 1;
    flex-direction: column;
    justify-content: space-around;
    font-size: 32rpx;
    &-name-phone {
      display: flex;
      justify-content: space-between;
      padding: 0rpx 30rpx;
    }
    &-detail-info {
      padding: 0rpx 30rpx;
    }
  }
  &-add {
    width: 360rpx;
    height: 88rpx;
    line-height: 88rpx;
    text-align: center;
    margin: 100px auto;
    color: #999;
    background-color: #f4f4f4;
  }
  &-pic {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 750rpx;
    height: 15rpx;
    image {
      width: 100%;
      height: 100%;
    }
  }
}
.iconfont-tap {
  font-family: 'iconfont' !important;
  font-size: 32rpx;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  min-width: 88rpx;
  min-height: 88rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}
.icon-jiantouyou {
  position: absolute;
  top: 32rpx;
  right: 0;
}
.icon-jiantouyou:before {
  font-size: 24rpx;
  color: #999;
  line-height: 1;
  width: 15rpx;
  height: 25rpx;
}
.order-list {
  background-color: #fff;
}
.product-item {
  display: flex;
  padding: 30rpx 20rpx;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    left: 20rpx;
    right: 0;
    bottom: 0;
    border-bottom: 1rpx solid #ddd;
  }
  .product-left {
    width: 200rpx;
    height: 200rpx;
    background-color: #eee;
    margin-right: 26rpx;
    image {
      width: 100%;
      height: 100%;
    }
  }
  .product-right {
    width: 480rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    .product-name {
      height: 84rpx;
      font-size: 30rpx;
      line-height: 1.4;
      /* 多行文字隐藏省略号 */
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    &-price {
      color: #ff2d4a;
      &-symbol,
      &-decimal {
        font-size: 28rpx;
      }
      &-integer {
        font-size: 44rpx;
      }
    }
    &-num {
      position: absolute;
      right: 0;
      bottom: 0;
      letter-spacing: 2rpx;
      color: #999;
    }
  }
}
.order-total {
  background-color: #fff;
  margin-top: 20rpx;
  height: 300rpx;
  &-item {
    height: 80rpx;
    display: flex;
    align-items: center;
    padding: 0rpx 30rpx;
    justify-content: space-between;
    &-price {
      color: #ff2d4a;
    }
  }
}
.wxLogin {
  margin-top: 10rpx;
  width: 720rpx;
}
.wxPay {
  margin-top: 10rpx;
  margin-left: 15rpx;
  width: 720rpx;
  background-color: #00c000;
  display: flex;
  height: 80rpx;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 32rpx;
  border-radius: 5rpx;
}
</style>
