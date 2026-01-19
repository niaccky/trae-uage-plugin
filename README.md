# Trae Usage Plugin

这是一个用于在 VS Code 中查看 Trae AI 额度使用情况的插件。它可以帮助你实时监控 Token 使用量，并提供按模型分类的详细统计。

## ✨ 功能特性

- 📊 **可视化仪表盘**：直观展示当前使用量和剩余额度（进度条显示）。
- 📈 **模型用量细分**：详细列出每个 AI 模型（如 GPT-4, Claude 3.5 Sonnet 等）的具体消耗情况。
- 💾 **自动保存**：Cookie 会安全地保存在 VS Code 的本地存储中，下次打开无需重复输入。
- 🎨 **美观的 UI**：适配 VS Code 原生主题，支持深色/浅色模式，提供折叠式的配置面板。
- 🔒 **隐私安全**：Cookie 仅用于直接向 Trae API 发起请求，不会经过任何第三方服务器。

## 🚀 使用指南

### 1. 启动插件
你可以通过以下两种方式打开使用面板：
- **状态栏**：点击 VS Code 底部状态栏右侧的 `trae usage` 按钮。
- **命令面板**：按下 `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows)，输入 `Show Usage` 并选择 `Trae Usage Plugin: Show Usage`。

### 2. 获取 Cookie
为了获取你的使用数据，你需要提供 Trae 账号的 Cookie。请按照以下步骤操作：

1. 在浏览器中访问 [Trae 官网](https://www.trae.ai) 并确保已登录。
2. 打开开发者工具：
   - Mac: `Cmd + Option + I`
   - Windows: `F12` 或 `Ctrl + Shift + I`
3. 切换到 **Network** (网络) 标签页。
4. 刷新页面。
5. 在请求列表中找到任意一个 API 请求（建议筛选 `Fetch/XHR`，找 `GetUserToken` 或其他请求）。
6. 在右侧的 **Request Headers** (请求头) 区域中找到 `cookie` 字段。
7. 复制 `cookie` 对应的一长串值。

### 3. 配置与查看
1. 将复制的 Cookie 粘贴到插件面板的 "Configuration" 输入框中。
2. 点击 **Get Usage Data** 按钮。
3. 🎉 成功获取后，面板将展示详细的使用情况。
   - 如果 Cookie 有效，配置面板会自动折叠。
   - 如果遇到错误，面板会自动展开以便你更新 Cookie。

## ⚠️ 注意事项
- 本插件非官方出品，仅供个人使用。
- **请保护好你的 Cookie**，不要将其分享给他人或截图发到公共场所。
- Cookie 可能会随时间过期，如果遇到获取失败的情况，请重新按照步骤 2 获取最新的 Cookie。

---
Enjoy coding with Trae! 🚀
