import { printBlue, printGreen, printMagenta, printRed, printYellow } from "./utils/colorOut.js";
import { close_api, delay, send, startService } from "./utils/utils.js";

async function main() {

  const USERINFO = process.env.USERINFO
  if (!USERINFO) {
    throw new Error("未配置")
  }
  const userinfo = JSON.parse(USERINFO)

  // 启动服务
  const api = startService()
  await delay(2000)

  const today = new Date();
  // 服务器时间比国内慢8小时
  today.setTime(today.getTime() + 8 * 60 * 60 * 1000)
  //日期
  const DD = String(today.getDate()).padStart(2, '0'); // 获取日
  const MM = String(today.getMonth() + 1).padStart(2, '0'); //获取月份，1 月为 0
  const yyyy = today.getFullYear(); // 获取年份
  const date = yyyy + '-' + MM + '-' + DD

  const errorMsg = {}
  try {
    // 开始签到
    for (const user of userinfo) {
      const headers = { 'cookie': 'token=' + user.token + '; userid=' + user.userid }
      // console.log(headers)
      const userDetail = await send(`/user/detail?timestrap=${Date.now()}`, "GET", headers)
      if (userDetail?.data?.nickname == null) {
        printRed(`token过期或账号不存在, userid: ${user.userid}`)
        continue
      }
      printMagenta(`账号 ${userDetail?.data?.nickname} 开始领取VIP...`)

      // 开始听歌
      printYellow(`开始听歌领取VIP...`)
      // 听歌获取vip
      const listen = await send(`/youth/listen/song?timestrap=${Date.now()}`, "GET", headers)

      if (listen.status === 1 || listen.error_code === 130012) {
        printGreen("听歌领取成功")
      } else {
        errorMsg[userDetail?.data?.nickname + " listen"] = listen
        printRed("听歌领取失败")
      }

      printYellow("开始领取VIP...")
      for (let i = 1; i <= 8; i++) {
        // ad获取vip
        const ad = await send(`/youth/day/vip?timestrap=${Date.now()}`, "GET", headers)
        // 签到出现问题
        // errorMsg[`${userDetail?.data?.nickname} ad${i}`] = ad
        if (ad.status === 1) {
          printGreen(`第${i}次领取成功`)
          const upgrade = await send(`/youth/day/vip/upgrade?timestrap=${Date.now()}`, "GET", headers)
          if (upgrade.status === 1 || upgrade.error_code === 297002 || upgrade.error_code === 297000) {
            printGreen(`第${i}次升级成功`)
          } else {
            printRed(`第${i}次升级失败`)
            errorMsg[userDetail?.data?.nickname + " upgrade" + i] = upgrade
          }
          break
        } else if(ad.error_code === 131001) {
          printGreen("今日已领取过VIP，尝试升级...")
          const upgrade = await send(`/youth/day/vip/upgrade?timestrap=${Date.now()}`, "GET", headers)
          if (upgrade.status === 1 || upgrade.error_code === 297002 || upgrade.error_code === 297000) {
            printGreen(`已升级成概念VIP`)
          } else {
            printRed(`升级失败`)
            errorMsg[userDetail?.data?.nickname + " upgrade"] = upgrade
          }
          break
        } else {
          printRed(`第${i}次领取失败`)
          console.dir(ad, { depth: null })
          // errorMsg[userDetail?.data?.nickname + " ad"] = ad
          break
        }
      }
      const vip_details = await send(`/user/vip/detail?timestrap=${Date.now()}`, "GET", headers)
      if (vip_details.status === 1) {
        printBlue(`今天是：${date}`)
        let tvipEndTime = null;
        let svipEndTime = null;
        if (vip_details.data.busi_vip && Array.isArray(vip_details.data.busi_vip)) {
          for (const vipItem of vip_details.data.busi_vip) {
            if (vipItem.product_type === 'tvip') {
              tvipEndTime = vipItem.vip_end_time;
            } else if (vipItem.product_type === 'svip') {
              svipEndTime = vipItem.vip_end_time;
            }
          }
        }
        if (tvipEndTime) {
          printBlue(`畅听VIP到期时间：${tvipEndTime}`)
        } else {
          printBlue(`未找到畅听VIP到期时间`)
        }
        if (svipEndTime) {
          printBlue(`概念VIP到期时间：${svipEndTime}`)
        } else {
          printBlue(`未找到概念VIP到期时间`)
        }
        if (!tvipEndTime && !svipEndTime) {
          printBlue(`未找到到期时间`)
        }
      } else {
        printRed("获取失败\n")
        errorMsg[userDetail?.data?.nickname + " vip_details"] = vip_details
      }
    }
  } finally {
    close_api(api)
  }
  if (Object.keys(errorMsg).length > 0) {
    printRed("异常信息如下:")
    console.dir(errorMsg, { depth: null })
    throw new Error("领取异常")
  }

  if (api.killed) {
    process.exit(0)
  }
}

main()
