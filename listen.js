import { close_api, delay, send, startService } from "./utils/utils.js";

async function main() {
  const t = process.env.TOKEN
  const uid = process.env.USERID

  if (!t || !uid) {
    throw new Error("参数错误！请检查")
  }
  // 启动服务
  const api = startService()
  await delay(2000)

  const today = new Date();
  // 服务器时间比国内慢8小时
  today.setTime(today.getTime() + 8 * 60 * 60 * 1000)
  //日期
  let DD = String(today.getDate()).padStart(2, '0'); // 获取日
  let MM = String(today.getMonth() + 1).padStart(2, '0'); //获取月份，1 月为 0
  let yyyy = today.getFullYear(); // 获取年份
  let date = yyyy + '-' + MM + '-' + DD

  let headers = { 'cookie': 'token=' + t + '; userid=' + uid }
  try {
    // 开始听歌
    console.log(`开始听歌签到`)
    // 听歌获取vip
    let cr = await send("/youth/listen/song", "GET", headers)

    if (cr.status === 1) {
      console.log("听歌签到成功")
    } else {
      console.log("响应内容")
      console.dir(cr, { depth: null })
      throw new Error("听歌签到失败：" + cr.error_code)
    }

    let vip_details = await send("/user/vip/detail", "GET", headers)
    if (vip_details.status === 1) {
      console.log(`今天是：${date}`)
      console.log(`VIP到期时间：${vip_details.data.busi_vip[0].vip_end_time}`)
    } else {
      console.log("响应内容")
      console.dir(vip_details, { depth: null })
      throw new Error("获取失败")
    }
  } finally {
    close_api(api)
  }

  if (api.killed) {
    // 强制关闭进程
    // 必须强制关闭，不然action不会停止
    process.exit(0)
  }
}

main()
