import { close_api, delay, send, startService } from "./utils/utils.js";

async function qrcode() {

  // 启动服务
  let api = startService()
  await delay(2000)
  let qrcode = ""
  try {
    // 二维码
    let result = await send(`/login/qr/key`, "GET", {})
    if (result.status === 1) {
      console.log("下面是二维码链接，请复制到浏览器打开扫描并确定登录")
      qrcode = result.data.qrcode
      // console.log(result.data.qrcode)
      // console.log(result.data.qrcode_img)
      const img_base64 = result.data.qrcode_img;
      const chunkSize = 1000;
      for (let i = 0; i < img_base64.length; i += chunkSize) {
        console.log(img_base64.slice(i, i + chunkSize));
      }
    } else {
      console.log("响应内容")
      console.dir(result, { depth: null })
      throw new Error("请求失败！请检查")
    }

    console.log()
    console.log("正在等待，请扫描二维码并确定登录")
    if (qrcode == "") {
      throw new Error("二维码异常")
    }
    // 登录
    let logined = false
    for (let i = 0; i < 50; i++) {
      const timestrap = Date.now();
      const res = await send(`/login/qr/check?key=${qrcode}&timestrap=${timestrap}`, "GET", {})
      const status = res?.data?.status
      switch (status) {
        case 0:
          console.log("二维码已过期")
          break

        case 1:
          // console.log("未扫描二维码")
          break

        case 2:
          // console.log("二维码未确认，请点击确认登录")
          break
        case 4:
          logined = true
          console.log("登录成功！")
          console.log("第一行是token,第二行是userid")
          console.log(res.data.token)
          console.log(res.data.userid)
          break;
        default:
          console.log("请求出错。")
          console.dir(res, { depth: null })
      }
      if (logined) {
        break
      }
      await delay(2000)
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

qrcode()
