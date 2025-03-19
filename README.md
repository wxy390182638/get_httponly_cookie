# Cookie获取器 Chrome扩展

## 项目介绍
这是一个用于获取网站HTTP-only Cookie的Chrome浏览器扩展。由于HTTP-only Cookie设计为不能通过JavaScript直接访问以提高安全性，本扩展利用Chrome扩展API来安全地获取这些Cookie信息。

## 功能特点
- 获取当前网站的所有Cookie（包括HTTP-only Cookie）
- 支持按域名筛选Cookie
- 提供简洁直观的用户界面
- 支持Cookie数据导出功能
- 严格遵循数据安全原则

## 安装说明
1. 下载本扩展的源代码或发布包
2. 打开Chrome浏览器，进入扩展管理页面（chrome://extensions/）
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择解压后的扩展目录即可完成安装

## 使用方法
1. 点击Chrome工具栏中的扩展图标打开弹出窗口
2. 在弹出窗口中可以看到当前网站的所有Cookie信息
3. 使用筛选功能查找特定Cookie
4. 点击导出按钮可以将Cookie数据保存为JSON文件

## 技术实现
- 使用Chrome Extension Manifest V3规范开发
- 采用Service Worker作为后台脚本
- 使用Chrome cookies API获取HTTP-only Cookie
- 通过Content Script实现与网页的交互
- 采用响应式设计，确保在不同分辨率下的良好体验

## 安全说明
本扩展仅用于开发测试目的，获取的Cookie信息仅在本地使用，不会发送到任何第三方服务器。用户应当遵守相关法律法规，不得将本扩展用于非法用途。

## 部署到GitHub

1. 创建GitHub仓库
   - 登录GitHub账号
   - 点击右上角的"+"图标，选择"New repository"
   - 填写仓库名称和描述
   - 选择是否公开仓库
   - 点击"Create repository"

2. 初始化本地Git仓库
   - 打开命令行工具，进入项目目录
   - 执行 `git init` 初始化Git仓库
   - 执行 `git add .` 添加所有文件到暂存区
   - 执行 `git commit -m "初始提交"` 提交代码

3. 关联并推送到GitHub
   - 复制GitHub仓库的HTTPS或SSH地址
   - 执行 `git remote add origin <仓库地址>` 添加远程仓库
   - 执行 `git branch -M main` 将主分支重命名为main
   - 执行 `git push -u origin main` 推送代码到GitHub

4. 后续更新
   - 修改代码后执行 `git add .` 添加更改
   - 执行 `git commit -m "更新说明"` 提交更改
   - 执行 `git push` 推送到GitHub

5. 发布版本
   - 在GitHub仓库页面点击"Releases"
   - 点击"Create a new release"
   - 填写版本号、标题和说明
   - 上传打包好的扩展文件
   - 点击"Publish release"发布


