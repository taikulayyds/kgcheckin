import { execSync } from "child_process";
import { close_api, delay, send, startService } from "./utils/utils.js";
import { printBlue, printGreen, printMagenta, printRed, printYellow } from "./utils/colorOut.js";

async function qrcode() {
  const api = startService();
  await delay(2000);
  let qrcodeKey = "";

  const USERINFO = process.env.USERINFO;
  const APPEND_USER = process.env.APPEND_USER;
  const userinfo = (USERINFO && APPEND_USER === "是") ? JSON.parse(USERINFO) : [];
  const args = process.argv.slice(2);
  const number = parseInt(process.env.NUMBER || args[0] || "1");
  const pat = process.env.PAT;

  try {
    for (let loopCount = 0; loopCount < number; loopCount++) {
      // 1. 获取完整二维码Key & 完整原生Base64
      const result = await send(`/login/qr/key?timestrap=${Date.now()}`, "GET", {});
      if (result.status === 1) {
        qrcodeKey = result.data.qrcode;
        const fullPureBase64 = result.data.qrcode_img;

        printMagenta("✅ 已获取完整二维码资源");
        printMagenta("👉 复制下面【整行无断行完整内容】生成图片，不要分段截取！");
        // 只单行完整输出，绝不切割，保证编码完整收尾
        console.log(fullPureBase64);
      } else {
        printRed("获取二维码接口异常");
        console.dir(result, { depth: null });
        throw new Error("获取二维码失败");
      }

      printMagenta("⏳ 请打开完整Base64图片，APP扫码并确认登录...");
      // 2. 修复核心：还原正确校验接口 /login/qr/check
      for (let pollIdx = 0; pollIdx < 25; pollIdx++) {
        const ts = Date.now();
        const res = await send(`/login/qr/check?key=${qrcodeKey}&timestrap=${ts}`, "GET", {});
        const status = res?.data?.status ?? -1;

        switch (status) {
          case 0:
            printYellow("⌛ 二维码过期，请重新运行生成");
            break;
          case 1:
            break;
          case 2:
            printYellow("📱 已扫码，请APP内点击确认授权");
            break;
          case 4:
            let exist = false;
            printGreen("🎉 登录鉴权成功！");
            if (APPEND_USER === "是") {
              for (let item of userinfo) {
                if (item.userid === res.data.userid) {
                  exist = true;
                  printYellow(`账号${item.userid}已存在，更新Token`);
                  item.token = res.data.token;
                }
              }
            }
            if (!exist) userinfo.push({ userid: res.data.userid, token: res.data.token });
            break;
          default:
            printRed("校验请求未知错误");
            console.dir(res, { depth: null });
        }

        if (status === 4 || status === 0) break;
        if (pollIdx === 24) {
          printRed("⏰ 扫码确认等待超时");
          break;
        }
        await delay(5000);
      }
    }

    // 写入GitHub Secret逻辑
    if (userinfo.length) {
      const saveJson = JSON.stringify(userinfo);
      if (pat) {
        try {
          execSync(`gh secret set USERINFO -b'${saveJson}' --repo ${process.env.GITHUB_REPOSITORY}`);
          printGreen("✅ Secret USERINFO 自动写入成功");
        } catch {
          printRed("自动写入失败，手动复制：");
          printRed(saveJson);
        }
      } else {
        printGreen("📋 登录信息，填入Secret USERINFO：");
        printBlue(saveJson);
      }
    }
  } catch (err) {
    printRed("全局运行报错：" + err.message);
  } finally {
    close_api(api);
  }

  if (api?.killed) process.exit(0);
}

qrcode();
