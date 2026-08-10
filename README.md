# WhatIP · Network Intelligence

一个无需后端、打开即用的公网 IP 与网络环境查询工具。

## 功能

- 自动识别当前公网 IPv4 / IPv6
- 查询任意标准 IPv4 与 IPv6 地址
- 展示国家、城市、时区、坐标、运营商、ASN 与网段
- 启发式识别住宅宽带、移动网络、企业网络和数据中心
- OpenStreetMap 近似位置地图
- Scamalytics、Whoer、BGP Toolkit 深度检测入口
- 本地查询历史、IP 收藏、JSON 报告导出与一键复制
- 操作系统、浏览器、语言、屏幕和网络环境检测
- 深色 / 浅色主题与完整移动端适配
- URL 查询参数分享，例如 `?ip=8.8.8.8`

## 使用

项目是纯静态网站，无需安装依赖。直接打开 `index.html`，或启用 GitHub Pages 即可部署。

数据由 [ipapi.co](https://ipapi.co/) 提供，地图由 [OpenStreetMap](https://www.openstreetmap.org/) 提供。IP 地理位置和网络画像均为估算结果，不应用于精确定位或高风险决策。

## 隐私

查询历史和收藏仅保存在浏览器的 `localStorage` 中，不会上传到本项目的服务器。

## License

MIT
