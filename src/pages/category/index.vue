<template>
  <view class="category">
    <!-- 左边的滚动视图 -->
    <scroll-view :style="{'height':(windowHeight-10)+'px'}" @click="selectedCategory" scroll-y class="category-left">
      <block v-for="(item,index) in categories" :key="item.cat_id">
        <view :data-index="index" class="category-left-item" :class="{'category-left-item-active':selectedIndex === index}">
          <text :data-index="index">{{item.cat_name}}</text>
        </view>
      </block>
    </scroll-view>
    <!-- 右边的滚动视图 -->
    <scroll-view :style="{'height':(windowHeight-10)+'px'}" v-if="categories[selectedIndex]!=undefined" scroll-y class="category-right">
      <block v-for="item in categories[selectedIndex].children" :key="item.cat_id">
        <view class="category-right-wrapper">
          <!-- 二级分类 -->
          <view class="category-right-head">{{item.cat_name}}</view>
          <!-- 三级分类 -->
          <view class="category-right-body">
            <block v-for="(subitem,index2) in item.children" :key="index2">
              <view class="category-right-body-item">
                <image :src="subitem.cat_icon" />
                <text>{{subitem.cat_name}}</text>
              </view>
            </block>
          </view>
        </view>
      </block>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      categories: [],
      windowHeight:0,
      selectedIndex: 0 //选中的索引
    }
  },
  onLoad() {
    //获取系统信息
    this.windowHeight = wx.getSystemInfoSync().windowHeight

    this.getCategoriesData()
  },
  methods: {
    async getCategoriesData() {
      const result = await this.$axios.get('api/public/v1/categories')
      result.data.message.forEach(category => {
        category.children.forEach(subcategory => {
          //判断是否有三级分类，一定要判断，否则出不来
          if (subcategory.children) {
            subcategory.children.forEach(thirdCategory => {
              if (thirdCategory) {
                thirdCategory.cat_icon = `${this.$axios.defaults.baseURL}${
                  thirdCategory.cat_icon
                }`
              }
            })
          }
        })
      })
      this.categories = result.data.message
    },
    selectedCategory(e) {
      this.selectedIndex = e.target.dataset.index
    }
  }
}
</script>

<style lang="less" scoped>
.category {
  display: flex;
  margin-top: 10px;
  &-left {
    width: 200rpx;
    display: flex;
    flex-direction: column;
    background-color: #f4f4f4;
    &-item {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 24rpx;
      color: #000000;
      width: 200rpx;
      height: 100rpx;
      &-active {
        background-color: #ffffff;
        position: relative;
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 10rpx;
          width: 5px;
          height: 80rpx;
          background-color: #ff2d4a;
        }
      }
    }
  }
  &-right {
    background-color: white;
    flex: 1;
    &-wrapper {
      display: flex;
      flex-direction: column;
    }
    &-head {
      height: 80rpx;
      text-align: center;
      font-size: 24rpx;
      &::before {
        content: '/';
        color: #eeeeee;
        margin-right: 20rpx;
      }
      &::after {
        content: '/';
        color: #eeeeee;
        margin-left: 20rpx;
      }
    }
    &-body{
      display:flex;
      flex-wrap: wrap;
      &-item{
        width:33.3333333%;
        height:200rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        text{
          font-size: 24rpx;
          margin-top:10rpx;
        }
        image {
          width: 100rpx;
          height: 80rpx;
        }
      }
    }
  }
}
</style>
