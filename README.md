# 家庭药箱

静态 HTML、CSS、JavaScript 网站。打开 `dist/index.html` 或通过静态服务器运行：

```sh
python3 -m http.server 4173 --directory dist
```

功能：四类百子柜、植物标本展示、抽屉动画、按药名搜索、模拟拍照 OCR、编辑与删除、本地保存、临期/过期筛选、JSON 备份导入导出、手机布局。

第二版：浅灰木框与灰绿抽屉、浅色植物展示窗；点击药品打开实体纸票式详情，包含吐纸、落纸动效、折痕、锯齿撕边和打印布局。小票可重新播放出纸动画或使用浏览器打印（亦可另存为 PDF）。系统设置减少动态效果时跳过动画。

小票纸张样式、打印动效与金属托盘素材参考并复用 [shengyuanshi/daily-receipt-opensource](https://github.com/shengyuanshi/daily-receipt-opensource)，保留 MIT 许可于 `dist/licenses/daily-receipt-MIT.txt`。没有接入或复制该项目的个人数据、API 配置或账号集成。

OCR 当前返回固定模拟数据，不解析上传照片。所有初始药品均为演示资料，用量默认待核对。数据使用当前浏览器 localStorage，未接入云同步或真实 OCR。照片在客户端压缩保存。原始植物素材来自用户本次对话提供的图像及其高清重制版本，采用 SVG 窗口展示局部植物。

后续真实 OCR 接入位置：`dist/app.js` 中的 `scan` 函数。识别结果仍应进入 `editForm` 由用户确认后保存。生产环境密钥应放在服务端，不可嵌入浏览器脚本。
