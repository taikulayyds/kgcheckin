import { close_api, delay, send, startService } from "./utils/utils.js";

async function login() {

  let phone = process.env.PHONE
  let code = process.env.CODE

  if (!phone || !code) {
    throw new Error("参数错误！请检查")
  }
  // 启动服务
  let api = startService()
  await delay(2000)

  try {
    // 登录请求
    let result = await send(`/login/cellphone?mobile=${phone}&code=${code}`, "GET", {})
    if (result.status === 1) {
      console.log("登录成功！")
      console.log("第一行是token,第二行是userid")
      console.log(result.data.token)
      console.log(result.data.userid)
    } else if (result.data == "请验证") {
      console.log("响应内容")
      console.dir(result, { depth: null })
      throw new Error("触发验证")
    }
    else {
      console.log("响应内容")
      console.dir(result, { depth: null })
      throw new Error("登录失败！请检查")
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
