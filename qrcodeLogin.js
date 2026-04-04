import { execSync } from "child_process";
import { close_api, delay, send, startService } from "./utils/utils.js";
import { printBlue, printGreen, printMagenta, printRed, printYellow } from "./utils/colorOut.js";

async function qrcode() {

  // 启动服务
  const api = startService()
  await delay(2000)
  let qrcode = ""
  const USERINFO = process.env.USERINFO
  const APPEND_USER = process.env.APPEND_USER
  const userinfo = (USERINFO && APPEND_USER == "是") ? JSON.parse(USERINFO) : []
  const args = process.argv.slice(2);
  const number = parseInt(process.env.NUMBER || args[0] || "1")
  const pat = process.env.PAT
  
  try {
    for (let i = 0; i < number; i++) {
      // 获取二维码接口
      const result = await send(`/login/qr/key?timestrap=${Date.now()}`, "GET", {})
      if (result.status === 1) {
        qrcode = result.data.qrcode
        const img_base64 = result.data.qrcode_img;
        
        printMagenta("二维码链接如下, 请在浏览器打开使用APP扫描并确认登录")
        console.log(img_base64);
      } else {
        printRed("响应内容")
        console.dir(result, { depth: null })
        throw new Error("请求出错")
      }
      
      printMagenta("正在等待，请扫描二维码并确定登录")
      // 轮询检测扫码状态
      for (let loopIdx = 0; loopIdx < 25; loopIdx++) {
        const timestrap = Date.now();
        const res = await send(`/login/qr/key/check?key=${qrcode}&timestrap=${timestrap}`, "GET", {})
        const status = res?.data?.status
        
        switch (status) {
          case 0:
            printYellow("二维码已过期")
            break
          case 1:
            break
          case 2:
            break
          case 4:
            let userAlreadyExist = false
            printGreen("登录成功！")
            if (APPEND_USER == "是") {
              for (let item of userinfo) {
                if (item.userid == res.data.userid) {
                  userAlreadyExist = true
                  printYellow(`userid: ${item.userid} 此账号已存在, 仅更新登录信息`)
                  item.token = res.data.token
                }
              }
            }
            if (!userAlreadyExist) {
              userinfo.push({
                userid: res.data.userid,
                token: res.data.token
              })
            }
            break;
          default:
            printRed("请求出错")
            console.dir(res, { depth: null })
        }
        
        if (status === 4 || status === 0) {
          break
        }
        if (loopIdx === 24) {
          printRed("等待超时\n")
          break
        }
        await delay(5000)
      }
    }

    if (userinfo.length) {
      const userinfoJSON = JSON.stringify(userinfo)
      if (pat) {
        try {
          execSync(`gh secret set USERINFO -b'${userinfoJSON}' --repo ${process.env.GITHUB_REPOSITORY}`);
          printGreen("secret <USERINFO> 更改成功")
        } catch (error) {
          printRed("自动写入出错，登录信息如下，请手动添加到secret USERINFO")
          printRed(userinfoJSON)
        }
      } else {
        printGreen("登录信息如下，把它添加到secret USERINFO 即可")
        printBlue(userinfoJSON)
      }
    }
  } finally {
    close_api(api)
  }

  if (api.killed) {
    process.exit(0)
  }
}

qrcode()
