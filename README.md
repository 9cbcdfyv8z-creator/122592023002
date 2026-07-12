# 📚 图书馆管理系统

## 项目介绍
一个基于 Next.js + Flask 的图书管理系统，支持图书浏览、搜索、收藏、借阅申请、后台审批等功能。

## 技术栈
- **前端**：Next.js 16, TypeScript, Tailwind CSS, Axios
- **后端**：Flask, SQLAlchemy, JWT 认证
- **数据库**：MySQL
- **部署**：Vercel (前端), Render (后端)

## 功能列表
### 用户端
- 🔐 登录/注册
- 📖 图书列表（支持分类、排序、搜索）
- ⭐ 图书收藏/取消收藏
- 📋 个人中心（资料、收藏、借阅记录）
- 📊 热门榜单

### 管理员端
- 👥 用户管理
- 📚 图书管理（增删改查）
- 📂 分类管理
- 📖 借阅审批
- 💬 评论管理

## 本地启动教程
### 后端启动
1. 进入backend目录，执行`pip install -r requirements.txt`安装依赖
2. 运行`python app.py`，后端启动在`http://127.0.0.1:5000`

### 前端启动
1. 进入frontend目录，执行`npm install`安装依赖
2. 删除旧的`.next`缓存文件夹，执行`npm run dev`
3. 浏览器访问`http://localhost:3000`

## 开发踩坑记录
1. 配置flask-cors放开OPTIONS预检、DELETE请求，解决收藏接口CORS跨域拦截问题
2. 规范`src/app/book/[id]/page.tsx`动态路由目录，修复仅地址栏变化页面不刷新的路由冲突问题
3. 完善TS类型定义，移除大量any，通过IIFE封装异步请求消除React Effect的渲染告警
4. 给图书封面添加onError兜底，图片失效自动展示书本占位图标
