# 酷狗签到

GitHub Actions 实现 `酷狗概念VIP` 自动签到
每天领取总计 `两天酷狗概念VIP`

目前只能手机号登录(目前一个手机号绑定了多个账号无法登录,见 [多账号登录问题](https://github.com/MakcRe/KuGouMusicApi/issues/51))
账号密码登录要验证，太垃圾

## 使用说明

1. Fork 这个仓库

1. 添加你的 `手机号` 到 Secret `PHONE`，运行 Actions `sent` 获取验证码

1. 添加收到的 `验证码` 到 Secret `CODE`

1. 在 Actions 运行 `login` 成功后复制 `token` 和 `userid`

1. 添加 `token` 和 `userid` 到 Secret `TOKEN` `USERID`

1. 启用 Actions `run` 和 `listen`, 每天北京时间 00:01 自动签到

API 源代码来自 [MakcRe/KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi) ~~图省事直接搬来~~
