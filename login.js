import { close_api, delay, send, startService } from "./utils/utils.js";

async function login() {

  let username = process.env.USERNAME
  let password = process.env.PASSWORD

  if (!username || !password) {
    throw new Error("参数错误！请检查")
  }
  // 启动服务
  let api = startService()
  await delay(2000)

  try {
    // 登陆请求
    let result = await send(`/login?username=${username}&password=${password}`, "GET", {})
    if (result.status === 1) {
      console.log("登陆成功！")
      console.log("第一行是token,第二行是userid")
      console.log(result.data.token)
      console.log(result.data.userid)
    } else if (result.data == "请验证") {
      throw new Error("哎呀，触发验证了，修改一下账号再登陆吧")
    }
    else {
      throw new Error("登陆失败！请检查")
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
