import { close_api, delay, send, startService } from "./utils/utils.js";

async function login() {

  let phone = process.env.PHONE

  if (!phone) {
    throw new Error("参数错误！请检查")
  }
  // 启动服务
  let api = startService()
  await delay(2000)

  console.log("开始发送验证码")
  try {
    // 验证码请求
    let result = await send(`/captcha/sent?mobile=${phone}`, "GET", {})
    if (result.status === 1) {
      console.log("发送成功")
    } else {
      throw new Error("发送失败！请检查")
    }
  } catch (error) {
    throw error
  } finally {
    close_api(api)
  }

  if (api.killed) {
    // 强制关闭进程
    // 必须强制关闭，不然action不会停止
    process.exit(0)
  }
}

login()
