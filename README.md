# 酷狗签到

GitHub Actions 实现 `酷狗概念VIP` 自动签到
每天领取总计 `两天酷狗概念VIP`

## 使用说明

1. Fork 这个仓库

1. 添加你的 `账号` 和 `密码` 到 Secret `USERNAME` `PASSWORD` (账号需要是用户名或`kgopen`+酷狗ID，手机号可能会有验证)

1. 在 Actions 运行 `login` 成功后复制 `token` 和 `userid`

1. 添加 `token` 和 `userid` 到 Secret `TOKEN` `USERID`

1. 启用 Actions `run` 和 `listen`, 每天北京时间 00:01 自动签到

API 源代码来自 [MakcRe/KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi) ~~图省事直接搬来~~
