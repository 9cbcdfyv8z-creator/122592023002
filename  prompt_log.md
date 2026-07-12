# prompt_shturl
# 图书借阅管理系统前后端开发交互日志
## 一、基础页面搭建阶段
1. 搭建Next.js App Router前端整体页面架构，完成首页仪表盘、图书浏览列表、个人中心、管理员后台多页面路由布局，使用TypeScript+Tailwind CSS实现页面样式。
2. 对接Flask后端全部REST接口，实现图书分页、分类筛选、搜索、排序基础展示功能；初期代码大量使用`any`类型，`useEffect`内直接调用异步请求触发ESLint渲染警告，`localStorage`直接在Effect读取引发SSR服务端报错。

## 二、跨域与收藏接口问题修复
3. 浏览器DELETE收藏接口触发CORS预检报错，后端`app.py`完善CORS配置，放行OPTIONS、DELETE请求与Authorization鉴权头，新增兼容路由`/api/collect/del/{bid}`，匹配前端删除请求地址，解决收藏操作失败弹窗问题。
4. 前端收藏取消请求路径错误使用`/api/collect/cancel/{bid}`，修改为后端支持的`/api/collect/del/{bid}`，操作完成后强制刷新收藏ID列表，解决切换页面收藏按钮状态重置问题。

## 三、首页接口报错与跳转优化
5. 首页发起不存在接口`/api/recommend/personal`，触发跨域预检拦截，将请求替换为后端已实现的`/api/recommend/usercf`协同过滤推荐接口，消除控制台CORS报错。
6. 首页图书卡片、个人中心收藏卡片存在Link嵌套层级问题，封面区域无法点击跳转详情，统一使用完整外层Link包裹封面+书名，保证卡片任意区域均可跳转。

## 四、路由跳转失效核心问题处理
7. 图书列表页多层嵌套`<Link>`组件，导致点击查看详情仅浏览器地址栏URL变化，页面不切换动态路由`/book/[id]`；重构页面跳转逻辑，移除多层Link嵌套，改用`useRouter`编程式button跳转，删除前端`.next`缓存文件夹重启项目，修复动态路由渲染失效问题。

## 五、TS类型规范与React警告全局修复
8. 统一全页面token读取逻辑：删除所有读取localStorage的useEffect，改用`useState(()=>{})`惰性初始化，彻底消除SSR环境`window/localStorage is not defined`报错。
9. 所有接口异步加载函数使用`(async ()=>{})()` IIFE自执行函数包裹后放入useEffect，消除ESLint `Effect内同步调用setState会引发连锁渲染`警告。
10. 移除全局`type XXX = any`模糊类型，明确定义`BookItem`、`BookRow`、`CategoryItem`、`BorrowItem`、`UserInfo`等强类型，使用`Record<number,string>`规范状态映射，解决TS `Unexpected any`索引警告。

## 六、图书详情页面功能完善
11. 完善`src/app/book/[id]/page.tsx`动态详情页：增加图书封面图片`onError`加载失败兜底渲染书本图标；新增自定义借阅天数选择框；同步实时收藏状态；实现星级打分、文字评论发布、历史评论列表渲染完整模块。

## 七、借阅功能接口请求方式修复
12. 个人中心归还图书接口使用POST请求，后端仅支持PUT方法，修改axios请求method为put，匹配`/api/borrow/return/{bid}`接口规范，解决405 Method Not Allowed报错。
13. 管理员借阅审批页面完善状态映射表格，修复表格ID数字显示问题，增加逾期/即将到期筛选功能，实现借阅申请通过/驳回操作。

## 八、管理员后台页面优化
14. 管理员仪表盘、用户管理、图书管理、分类管理、评论管理页面统一适配惰性token、IIFE异步写法、强类型约束，无控制台警告；实现后台数据统计、增删改查、评论删除全功能。

## 九、全流程功能联调测试
15. 完整测试全部业务流程：图书分类筛选、关键词搜索、多维度排序、分页切换；收藏/取消收藏实时状态同步；借阅申请提交、管理员审批、图书归还；评论发布、查看；管理员后台数据管理；页面图片容错、路由跳转、接口鉴权全部正常，控制台无报错、无TS警告、无跨域拦截。