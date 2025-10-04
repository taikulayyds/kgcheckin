import { close_api, delay, send, startService } from "./utils/utils.js";

async function qrcode() {

  // 启动服务
  let api = startService()
  await delay(2000)

  try {
    // 登录请求
    let result = await send(`/login/qr/key`, "GET", {})
    if (result.status === 1) {
      console.log("请求成功！")
      console.log("第一行是key,第二行是二维码链接")
      console.log(result.data.qrcode)
      console.log(result.data.qrcode_img)
    } else {
      console.log("响应内容")
      console.dir(result, { depth: null })
      throw new Error("请求失败！请检查")
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
