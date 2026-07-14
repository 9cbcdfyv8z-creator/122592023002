# 📚 图书借阅管理系统
## 项目介绍
一套个人独立开发前后端分离图书借阅实训系统，区分普通用户前台与管理员后台，完整实现图书浏览、关键词搜索、分类筛选、收藏、借阅申请、借阅审批、用户/图书/分类/评论全量CRUD业务。项目已修复全部接口联调、页面渲染、跨域、数据库约束、URL匹配类BUG，本地可一键完整运行，同时完成线上部署，配套全套实训交付文档与演示素材，完全满足AI辅助编程工程化实训考核标准。

## 技术栈
### 开发技术
- **前端**：Next.js 14 App Router、TypeScript、Tailwind CSS、Axios
- **后端**：Python Flask、Flask-CORS、PyJWT（JWT身份鉴权）
- **数据库**：SQLite轻量本地数据库（无需额外安装数据库服务，项目内置book.db）

### 线上部署平台
- 前端静态部署：Netlify
- 后端服务部署：PythonAnywhere

## 线上部署访问地址
1. 前端线上演示地址：https://illustrious-kulfi-a69a0c.netlify.app/
2. 后端线上接口基础地址：https://jing111.pythonanywhere.com/api
### 线上环境说明
1. 前端已完成静态资源打包部署；
2. 后端长期在线运行，开放全部业务接口，支持JWT登录鉴权、全局跨域访问；
3. 前端打包时已配置线上接口环境变量，线上环境无需修改代码即可直接联调后端。

## 完整项目目录
```
122592023002/
├─ backend/               # Flask后端接口、数据库初始化脚本
│  ├─ app.py              # 全部业务接口、跨域配置、数据表创建
│  ├─ book.db             # SQLite数据库文件
│  └─ requirements.txt    # Python依赖清单
├─ frontend/              # Next.js前端项目
│  ├─ src/app/            # 所有页面路由文件
│  ├─ netlify.toml        # Netlify路由重定向配置（解决404）
│  └─ package.json        # 前端依赖配置
├─ docs/                  # 实训考核配套素材文件夹
│  ├─ api_screenshot/     # Postman接口测试截图
│  ├─ code_review/        # AI代码评审截图
│  ├─ demo_video/         # 项目完整操作演示录屏
│  └─ prompt_screenshot/  # AI问答对话截图
├─ prompt_log.md          # 全流程AI辅助开发文字日志
├─ api_doc.md             # 后端完整REST接口文档
├─ code_review.md         # AI全项目代码评审报告
├─ README.md              # 项目说明文档
└─ 个人实训总结.md        # 实训复盘报告
```

## 功能列表
### 用户前台功能
1. 账号登录、注册、个人信息修改、密码修改
2. 图书分页展示、多分类筛选、多维度排序、书名/作者模糊搜索
3. 图书收藏、取消收藏，按钮状态实时同步后端数据
4. 图书详情页、自定义借阅时长提交申请、星级评分+文字评论发布
5. 个人中心：查看收藏列表、我的借阅记录、归还已借图书

### 管理员后台功能
1. 用户管理：分页查询、关键词搜索、编辑用户昵称/角色/账号状态
2. 图书管理：图书新增、编辑、删除、封面图片展示
3. 分类管理：图书分类新增、修改、删除
4. 借阅审批：全部/逾期/即将到期多条件筛选、审批通过/驳回借阅申请
5. 全平台评论管理：展示评论ID、发布用户、所属图书、评分、内容、发布时间、删除违规评论
6. 数据仪表盘：图书/用户/分类/借阅总量可视化统计

## 本地启动教程
### 后端本地启动步骤
1. 终端进入backend文件夹
2. 安装Python依赖：
```bash
pip install flask flask-cors pyjwt
```
3. 启动后端服务：
```bash
python app.py
```
4. 本地后端访问地址：`http://127.0.0.1:5000`

### 前端本地启动步骤
1. 终端进入frontend目录
2. 安装前端依赖：
```bash
npm install
```
3. 删除缓存文件夹`.next`，清除路由缓存避免页面不刷新
4. 配置本地接口环境变量并启动开发服务
- Windows PowerShell：
```powershell
$env:NEXT_PUBLIC_API_URL="http://127.0.0.1:5000"
npm run dev
```
- Windows CMD：
```cmd
set NEXT_PUBLIC_API_URL=http://127.0.0.1:5000 && npm run dev
```
5. 本地前端访问地址：`http://localhost:3000`

### 前端打包&线上Netlify部署流程
1. 进入frontend目录，执行依赖安装
```bash
npm install
```
2. 配置线上后端接口环境变量，打包生成静态文件
- Windows PowerShell：
```powershell
$env:NEXT_PUBLIC_API_URL="https://jing111.pythonanywhere.com/api"
npm run build
```
- Windows CMD：
```cmd
set NEXT_PUBLIC_API_URL=https://jing111.pythonanywhere.com/api && npm run build
```
3. 打包完成后根目录生成`out`静态产物文件夹，内置`netlify.toml`重定向配置
```toml
[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```
4. Netlify官方部署上传：进入站点Deploys页面，将`out`内全部文件拖拽至官方上传区域，等待自动发布即可上线

## 开发踩坑与完整BUG修复记录
1. **URL后缀斜杠匹配报错**
前端请求接口末尾携带多余斜杠，Flask严格匹配路由地址，服务器提示URL拼写错误；统一删除所有请求地址末尾`/`，规范全局接口路由。

2. **CORS OPTIONS跨域预检拦截**
DELETE、PUT请求浏览器自动发送OPTIONS预检请求，后端未单独处理导致跨域报错；全局CORS配置放行全部请求方式，收藏、删除接口单独处理OPTIONS请求并返回200状态码。

3. 注册页面空邮箱UNIQUE约束冲突
user表email字段设置唯一索引，多条空字符串记录会触发数据库唯一性报错；用户不填写邮箱时后端自动生成随机唯一临时邮箱，规避约束异常。

4. sqlite3.OperationalError: database is locked
多窗口同时运行后端、数据库连接未正常关闭导致文件锁死；数据库连接设置10秒超时，增加异常捕获并返回友好提示。

5. 借阅/评论列表数据错乱（用户、图书、时间只显示数字ID）
后端多表联查返回元组数组，前端数组下标书写错位；根据SQL查询字段顺序修正页面下标，正常展示用户名、图书名称、发布时间。

6. Next.js SSR localStorage is not defined
组件顶层直接读取localStorage，服务端无window对象报错；全部页面统一使用客户端状态惰性初始化token，仅浏览器客户端执行本地存储读取。

7. useEffect异步函数ESLint警告
Effect内部直接书写async函数触发语法警告；统一使用IIFE自执行异步函数`(async ()=>{})()`消除告警。

8. 图书详情多层Link嵌套路由冲突
图书卡片嵌套Link导致仅地址栏变更页面不刷新；移除嵌套Link，改用useRouter编程式跳转。

9. 图书搜索功能失效
后端list接口未添加关键词模糊查询WHERE条件，输入关键词无过滤效果；重构SQL实现书名、作者双字段匹配，前端拆分临时输入值与提交搜索值，仅回车/点击搜索按钮触发查询。

10. 图书封面图片加载失效
图片地址为空/失效时页面空白；全局图片增加onError兜底，加载失败展示书本占位图标。

## 实训考核配套交付材料
### 提交物清单
1. 项目公开GitHub源码仓库
2. 线上可访问前后端演示链接（
3. docs素材文件夹：Postman接口截图、AI代码评审截图、AI对话Prompt截图、完整项目演示录屏
4. 配套文档：
   - prompt_log.md：全流程AI开发提问日志
   - api_doc.md：后端完整REST接口文档
   - code_review.md：AI代码优化评审报告
   - 个人实训总结.md：超500字项目复盘总结
5. Git提交记录：多日期、规范语义化commit，验证独立开发过程