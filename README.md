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

## 许可证
本项目采用MIT许可证。

版权所有 (c) 2024 Cookie获取器

特此免费授予任何获得本软件副本和相关文档文件（"软件"）的人不受限制地处理本软件的权利，包括但不限于使用、复制、修改、合并、发布、分发、再许可和/或销售本软件副本的权利，以及允许获得本软件的人这样做，但须符合以下条件：

上述版权声明和本许可声明应包含在本软件的所有副本或主要部分中。

本软件按"原样"提供，不提供任何形式的明示或暗示的保证，包括但不限于对适销性、特定用途的适用性和非侵权性的保证。在任何情况下，作者或版权持有人均不对任何索赔、损害或其他责任负责，无论是在合同诉讼、侵权行为还是其他方面，产生于本软件或与本软件的使用或其他交易有关。


