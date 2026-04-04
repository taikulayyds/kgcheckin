import { execSync } from "child_process";
import { close_api, delay, send, startService } from "./utils/utils.js";
import { printBlue, printGreen, printMagenta, printRed, printYellow } from "./utils/colorOut.js";

async function qrcode() {
  // 启动服务
  const api = startService()
  await delay(2000)
  let qrcodeKey = ""
  const USERINFO = process.env.USERINFO
  const APPEND_USER = process.env.APPEND_USER
  const userinfo = (USERINFO && APPEND_USER === "是") ? JSON.parse(USERINFO) : []
  const args = process.argv.slice(2);
  const number = parseInt(process.env.NUMBER || args[0] || "1")
  const pat = process.env.PAT

  try {
    for (let loopCount = 0; loopCount < number; loopCount++) {
      // 1. 获取二维码Key & Base64图片
      const result = await send(`/login/qr/key?timestrap=${Date.now()}`, "GET", {})
      if (result.status === 1) {
        qrcodeKey = result.data.qrcode
        const imgBase64 = result.data.qrcode_img;

        printMagenta("👉 优先用原生链接扫码，避开Base64截断问题！");
        printMagenta(`二维码原生校验Key链接前缀可用: ${qrcodeKey}`);
        // 纯完整单行输出Base64，无任何切割
        console.log(imgBase64);
      } else {
        printRed("获取二维码响应异常")
        console.dir(result, { depth: null })
        throw new Error("获取二维码接口请求出错")
      }

      printMagenta("正在等待，请扫描二维码并确认登录...")
      // 2. 轮询校验二维码状态【修复关键：接口路径改回正确 /login/qr/check】
      for (let pollIdx = 0; pollIdx < 25; pollIdx++) {
        const timestrap = Date.now();
        const res = await send(`/login/qr/check?key=${qrcodeKey}&timestrap=${timestrap}`, "GET", {})
        const status = res?.data?.status

        switch (status) {
          case 0:
            printYellow("二维码已过期，请重新生成")
            break
          case 1:
            // 未扫描，静默等待
            break
          case 2:
            printYellow("二维码已扫码，请在APP内点击确认登录")
            break
          case 4:
            let userAlreadyExist = false
            printGreen("✅ 登录成功！")
            if (APPEND_USER === "是") {
              for (let item of userinfo) {
                if (item.userid === res.data.userid) {
                  userAlreadyExist = true
                  printYellow(`userid: ${item.userid} 账号已存在，仅更新Token`)
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
            printRed("二维码校验请求未知错误")
            console.dir(res, { depth: null })
        }

        if (status === 4 || status === 0) break
        if (pollIdx === 24) {
          printRed("❌ 扫码确认等待超时")
          break
        }
        await delay(5000)
      }
    }

    // 写入GitHub Secret 逻辑不变
    if (userinfo.length) {
      const userinfoJSON = JSON.stringify(userinfo)
      if (pat) {
        try {
          execSync(`gh secret set USERINFO -b'${userinfoJSON}' --repo ${process.env.GITHUB_REPOSITORY}`);
          printGreen("✅ Secret USERINFO 更新成功")
        } catch (error) {
          printRed("自动写入Secret失败，请手动复制配置：")
          printRed(userinfoJSON)
        }
      } else {
        printGreen("📋 登录用户信息，手动填入Secret USERINFO：")
        printBlue(userinfoJSON)
      }
    }
  } catch (err) {
    printRed("运行捕获全局异常：" + err.message)
  } finally {
    close_api(api)
  }

  if (api?.killed) {
    process.exit(0)
  }
}

qrcode()
