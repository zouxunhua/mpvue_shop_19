const KEY = "goods"

/**
 * 暴露出去的，获取本地已经存储的商品信息
 */
export const getLocalGoods = () => {
  return wx.getStorageSync(KEY) || {}
}

/**
 * 按需导出一个 添加商品的方法
 * @param {} goods {goods_id:129,goods_number:1}
 *                 {goods_id:395,goods_number:1}
 *                 {goods_id:129,goods_number:1}
 *
 * 最终存储到Storage的样子  {"129":2,"395":1}
 *
 */
export const addLocalGoods = (goods) => {
  // localGoods === {} / {"129":3,"395":3}
  const localGoods = getLocalGoods() //第一次 {}

  if(localGoods[goods.goods_id]){//代表goods.goods_id已经在本地有了
    localGoods[goods.goods_id] = localGoods[goods.goods_id] + goods.goods_number
  }else{
    localGoods[goods.goods_id] = goods.goods_number
  }

  //保存回本地
  wx.setStorageSync(KEY, localGoods)
}

/* 按需导出一个 修改商品的方法
* @param {} goods {goods_id:129,goods_number:1}
*
* 最终存储到Storage的样子  {"129":1,"395":1}
*
*/
export const updateLocalGoods = (goods) =>{
  //1.获取到本地保存的商品信息
  const localGoods = getLocalGoods()

  //2.更新本地商品的数量
  localGoods[goods.goods_id] = goods.goods_number

  //保存回本地
  wx.setStorageSync(KEY, localGoods)
}

/* 按需导出一个 删除商品的方法
* @param {} goods_id 129
*
* 最终存储到Storage的样子  {"129":1,"395":1}
*
*/
export const deleteLocalGoodsByGoodsId = goods_id => {
   //1.获取到本地保存的商品信息
   const localGoods = getLocalGoods()

   delete localGoods[goods_id]

   //保存回本地
   wx.setStorageSync(KEY, localGoods)
}
