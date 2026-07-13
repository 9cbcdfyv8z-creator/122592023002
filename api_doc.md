# api_doc.md
# 图书借阅管理系统 - 后端API接口完整文档
## 基础通用信息
1. 后端基础地址：`http://127.0.0.1:5000`
2. 鉴权规则
   登录成功获取token，需要身份校验的接口，请求头携带：`Authorization: Bearer {token}`
3. 统一返回JSON格式
```json
{
  "code": 状态码,
  "data": 业务返回数据,
  "msg": 操作提示文字
}
```
4. 状态码定义
- 200：操作成功
- 400：参数错误 / 业务限制（如用户存在借阅无法删除）
- 401：未登录、token失效
- 403：登录账号无管理员权限

## 一、用户公共模块（无需管理员）
### 1. 用户登录
请求地址：`POST /api/login`
请求体：
```json
{
  "username": "admin",
  "pwd": "123456"
}
```
返回：token字符串、用户基础信息(uid/用户名/角色)

### 2. 用户注册
请求地址：`POST /api/register`
请求体：
```json
{
  "username": "test01",
  "pwd": "123456",
  "email": "test@shturl."
}
```

### 3. 获取个人信息（需登录）
请求地址：`GET /api/user/profile`
请求头携带token
返回：id、username、nickname、email、avatar、role

### 4. 修改个人资料（需登录）
请求地址：`PUT /api/user/profile`
请求体：
```json
{
  "nickname": "测试昵称",
  "email": "new@shturl."
}
```

### 5. 修改登录密码（需登录）
请求地址：`PUT /api/user/pwd`
请求体：
```json
{
  "old_pwd": "原密码",
  "new_pwd": "新密码"
}
```

## 二、管理员-用户管理模块（仅admin可访问）
### 1. 用户分页列表
请求地址：`GET /api/admin/user/list`
Query参数：
- page：页码，默认1
- size：每页条数，默认10
- keyword：用户名模糊搜索关键词

### 2. 新增后台用户
请求地址：`POST /api/admin/user/add`
请求体：
```json
{
  "username": "user02",
  "pwd": "123456",
  "nickname": "普通用户",
  "role": "user",
  "status": 1
}
```

### 3. 编辑用户信息
请求地址：`PUT /api/admin/user/edit/<int:uid>`
请求体：
```json
{
  "nickname": "修改昵称",
  "role": "admin",
  "status": 1
}
```

## 三、图书分类模块
### 1. 获取树形分类
请求地址：`GET /api/category/tree`
返回嵌套父子分类数组（id、name、children）

### 2. 新增分类
请求地址：`POST /api/category/add`
请求体：
```json
{
  "name": "计算机",
  "parent_id": 0,
  "sort": 1
}
```

### 3. 编辑分类
请求地址：`PUT /api/category/edit/<int:cid>`

### 4. 删除分类
请求地址：`DELETE /api/category/del/<int:cid>`

### 5. 各分类图书数量统计
请求地址：`GET /api/category/count`

## 四、图书模块
### 1. 图书分页列表（前台核心接口）
请求地址：`GET /api/book/list`
Query参数：
- page：页码
- size：每页数量
- category_id：分类id（可选）
- sort：排序规则 hot/new/score/collect/default
- keyword：书名、作者模糊搜索关键词（后端双字段匹配）

### 2. 单本图书详情
请求地址：`GET /api/book/<int:bid>`

### 3. 管理员新增图书
请求地址：`POST /api/admin/book/add`

### 4. 管理员编辑图书
请求地址：`PUT /api/admin/book/edit/<int:bid>`

### 5. 管理员删除图书
请求地址：`DELETE /api/admin/book/del/<int:bid>`

## 五、收藏模块（需登录）
### 1. 收藏图书
请求地址：`POST /api/collect/add/<int:bid>`

### 2. 取消收藏（兼容前端路由，解决url斜杠报错）
请求地址：`DELETE /api/collect/del/<int:bid>`

### 3. 校验图书是否已收藏
请求地址：`GET /api/collect/check/<int:bid>`

### 4. 获取我的收藏列表
请求地址：`GET /api/collect/my`

## 六、借阅模块（需登录）
### 1. 提交借阅申请
请求地址：`POST /api/borrow/apply/<int:bid>`
请求体：`{"days":14}`

### 2. 用户归还图书（PUT请求）
请求地址：`PUT /api/borrow/return/<int:borrow_id>`
仅状态为「借阅中」可执行归还操作

### 3. 图书续借
请求地址：`PUT /api/borrow/renew/<int:borrow_id>`

### 4. 我的个人借阅记录
请求地址：`GET /api/borrow/my`
自动联查图书名称、作者信息

### 5. 管理员全量借阅列表
请求地址：`GET /api/admin/borrow/list`
Query参数 filter：all / overdue / soon
自动联查用户名、图书名称

### 6. 审批借阅申请（通过/驳回）
请求地址：`PUT /api/admin/borrow/audit/<int:borrow_id>`
请求体：
```json
{
  "status": 1 // 1=通过 2=驳回
}
```

## 七、评论模块（需登录）
### 1. 发布图书评论
请求地址：`POST /api/comment/add/<int:bid>`
请求体：
```json
{
  "content": "好书推荐",
  "score": 5
}
```

### 2. 删除本人评论
请求地址：`DELETE /api/comment/del/<int:cid>`

### 3. 管理员删除任意评论
请求地址：`DELETE /api/admin/comment/del/<int:cid>`

### 4. 获取单本书评论
请求地址：`GET /api/book/comment/<int:bid>`

### 5. 管理员查看全部评论
请求地址：`GET /api/admin/comment/list`

## 八、图书推荐接口（无需登录）
1. 热门借阅：`GET /api/recommend/hot`
2. 新书推荐：`GET /api/recommend/new`
3. 同类相似推荐：`GET /api/recommend/itemcf/<int:bid>`
4. 用户协同推荐：`GET /api/recommend/usercf`
5. 偏好分类推荐：`GET /api/recommend/content`
6. 同分类相似图书：`GET /api/recommend/similar/<int:bid>`
7. 混合综合推荐：`GET /api/recommend/mix`

## 九、管理员首页数据仪表盘
请求地址：`GET /api/dashboard/stats`
返回图书总数、分类总数、借阅总数、用户总数