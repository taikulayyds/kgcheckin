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
      const result = await send(`/login/qr/key?timestrap=${Date.now()}`, "GET", {});
      if (result.status === 1) {
        qrcodeKey = result.data.qrcode;
        // 只打印扫码直链提示，放弃残缺base64复制
        printMagenta(`✅ 获取二维码密钥成功: ${qrcodeKey}`);
        printMagenta(`👉 自行拼接平台官方扫码页打开扫码，不再复制base64！`);
      } else {
        printRed("获取二维码密钥失败");
        console.dir(result, { depth: null });
        throw new Error("获取密钥异常");
      }

      printMagenta("⏳ 等待APP扫码并确认登录...");
      // 校验接口永久修复正确地址 /login/qr/check
      for (let pollIdx = 0; pollIdx < 25; pollIdx++) {
        const ts = Date.now();
        const res = await send(`/login/qr/check?key=${qrcodeKey}&timestrap=${ts}`, "GET", {});
        const status = res?.data?.status ?? -1;

        switch (status) {
          case 0: printYellow("二维码过期"); break;
          case 1: break;
          case 2: printYellow("已扫码，请APP内确认授权"); break;
          case 4:
            let exist = false;
            printGreen("🎉 登录成功！");
            if (APPEND_USER === "是") {
              for (let item of userinfo) {
                if (item.userid === res.data.userid) {
                  exist = true;
                  item.token = res.data.token;
                }
              }
            }
            if (!exist) userinfo.push({ userid: res.data.userid, token: res.data.token });
            break;
          default: printRed("校验未知错误"); console.dir(res,{depth:null});
        }
        if (status === 4 || status === 0) break;
        if (pollIdx === 24) { printRed("等待超时"); break; }
        await delay(5000);
      }
    }

    if (userinfo.length) {
      const saveJson = JSON.stringify(userinfo);
      if (pat) {
        try { execSync(`gh secret set USERINFO -b'${saveJson}' --repo ${process.env.GITHUB_REPOSITORY}`); printGreen("Secret写入成功"); }
        catch { printRed("手动复制保存："+saveJson); }
      } else printBlue("登录用户信息："+saveJson);
    }
  } catch (err) {
    printRed("运行报错："+err.message);
  } finally {
    close_api(api);
  }
  if (api?.killed) process.exit(0);
}
qrcode();
