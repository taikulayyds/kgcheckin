import { close_api, delay, send, startService } from "./utils/utils.js";

async function login() {

  const phone = process.env.PHONE
  const code = process.env.CODE
  const key = process.env.KEY
  let qrLogin = true

  // 没有二维码则不使用二维码登录
  if (!key) {
    qrLogin = false
  }
  // 不使用二维码登录并且没有手机号或验证码
  if (!qrLogin && (!phone || !code)) {
    throw new Error("参数错误！请检查")
  }
  // 启动服务
  const api = startService()
  await delay(2000)

  try {
    if (qrLogin) {
      const res = await send(`/login/qr/check?key=${key}`, "GET", {})
      switch (res?.data?.status) {
        case 0:
          console.log("二维码已过期")
          break;

        case 1:
          console.log("未扫描二维码")
          break;

        case 2:
          console.log("二维码未确认，点击登录后重试")
          break;

        case 4:
          console.log("登录成功！")
          console.log("第一行是token,第二行是userid")
          console.log(res.data.token)
          console.log(res.data.userid)
          break;
        default:
          console.log("响应信息")
          console.dir(res, { depth: null })
          throw new Error("登录失败")
      }

    } else {
      // 手机号登录请求
      const result = await send(`/login/cellphone?mobile=${phone}&code=${code}`, "GET", {})
      if (result.status === 1) {
        console.log("登录成功！")
        console.log("第一行是token,第二行是userid")
        console.log(result.data.token)
        console.log(result.data.userid)
      } else if (result.error_code === 34175) {
        throw new Error("暂不支持多账号绑定手机登录")
      } else {
        console.log("响应内容")
        console.dir(result, { depth: null })
        throw new Error("登录失败！请检查")
      }
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

login()
