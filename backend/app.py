# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import jwt
from datetime import datetime, timedelta
import random
import string

# 兼容Python3.10 无datetime.UTC问题
UTC = datetime.utcnow().tzinfo

app = Flask(__name__)
# 完整修复CORS，放行所有域名，本地+线上前端都能访问
CORS(
    app,
    supports_credentials=True,
    origins=["http://localhost:3000",
        "https://lucent-sundae-f538d6.netlify.app",
        "https://illustrious-kulfi-a69a0c.netlify.app"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"]
)
SECRET_KEY = "book-system-2026-secret"

# ====================== 数据库初始化（全部业务表） ======================
def init_db():
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        # 1. 用户表
        cur.execute('''
        CREATE TABLE IF NOT EXISTS user(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            pwd TEXT NOT NULL,
            nickname TEXT,
            email TEXT UNIQUE,
            avatar TEXT,
            role TEXT DEFAULT 'user',
            status INTEGER DEFAULT 1,
            create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        # 兼容历史旧库，补上缺失字段
        try:
            cur.execute("ALTER TABLE user ADD COLUMN role TEXT DEFAULT 'user'")
        except sqlite3.OperationalError:
            pass
        try:
            cur.execute("ALTER TABLE user ADD COLUMN status INTEGER DEFAULT 1")
        except sqlite3.OperationalError:
            pass
        # 预置admin账号
        cur.execute("INSERT OR IGNORE INTO user(username,pwd,nickname,role,status) VALUES (?,?,?,?,?)", ("admin", "123456", "admin", "admin", 1))

        # 2. 图书分类表（树形结构 parent_id）
        cur.execute('''
        CREATE TABLE IF NOT EXISTS category(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cat_name TEXT NOT NULL,
            parent_id INTEGER DEFAULT 0,
            sort INTEGER DEFAULT 0
        )
        ''')
        # 初始化分类
        category_list = [
            (1, "科技", 0, 1),
            (2, "文学", 0, 2),
            (3, "经济管理", 0, 3),
            (4, "历史", 0, 4),
            (5, "编程语言", 1, 1),
            (6, "小说", 2, 1)
        ]
        for cid, name, pid, sort in category_list:
            cur.execute("INSERT OR IGNORE INTO category(id,cat_name,parent_id,sort) VALUES (?,?,?,?)", (cid, name, pid, sort))

        # 3. 图书表
        cur.execute('''
        CREATE TABLE IF NOT EXISTS book(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            author TEXT NOT NULL,
            category_id INTEGER,
            publisher TEXT,
            stock INTEGER DEFAULT 15,
            cover_url TEXT,
            desc TEXT,
            score REAL DEFAULT 0,
            borrow_count INTEGER DEFAULT 0,
            collect_count INTEGER DEFAULT 0,
            publish_time DATE,
            status INTEGER DEFAULT 1,
            FOREIGN KEY(category_id) REFERENCES category(id)
        )
        ''')

        # 4. 收藏表
        cur.execute('''
        CREATE TABLE IF NOT EXISTS collection(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            book_id INTEGER,
            create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES user(id),
            FOREIGN KEY(book_id) REFERENCES book(id),
            UNIQUE(user_id,book_id)
        )
        ''')

        # 5. 借阅表 status:0待审批 1借出 2驳回 3归还 4逾期未还
        cur.execute('''
        CREATE TABLE IF NOT EXISTS borrow(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            book_id INTEGER,
            apply_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            borrow_days INTEGER DEFAULT 14,
            start_date DATE,
            due_date DATE,
            return_date DATE,
            status INTEGER DEFAULT 0,
            remark TEXT,
            FOREIGN KEY(user_id) REFERENCES user(id),
            FOREIGN KEY(book_id) REFERENCES book(id)
        )
        ''')

        # 6. 评论表
        cur.execute('''
        CREATE TABLE IF NOT EXISTS comment(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            book_id INTEGER,
            content TEXT NOT NULL,
            score INTEGER,
            create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_del INTEGER DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES user(id),
            FOREIGN KEY(book_id) REFERENCES book(id)
        )
        ''')

        # 7. 推荐缓存表 rec_type:userCF/itemCF/content/hot/new/similar/mix
        cur.execute('''
        CREATE TABLE IF NOT EXISTS recommend(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            book_id INTEGER,
            rec_type TEXT,
            weight REAL,
            FOREIGN KEY(user_id) REFERENCES user(id),
            FOREIGN KEY(book_id) REFERENCES book(id)
        )
        ''')
        conn.commit()

# ====================== 工具函数 ======================
def get_token_user():
    """解析token获取当前登录用户"""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except Exception:
        return None

def is_admin():
    user = get_token_user()
    return user and user.get("role") == "admin"

# ======================首页仪表盘统计接口======================
@app.route("/api/dashboard/stats", methods=["GET"])
def dashboard_stats():
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        book_total = cur.execute("SELECT COUNT(*) FROM book").fetchone()[0]
        category_total = cur.execute("SELECT COUNT(*) FROM category").fetchone()[0]
        borrow_total = cur.execute("SELECT COUNT(*) FROM borrow").fetchone()[0]
        user_total = cur.execute("SELECT COUNT(*) FROM user").fetchone()[0]
    return jsonify({
        "code": 200,
        "data": {
            "book_total": book_total,
            "category_total": category_total,
            "borrow_total": borrow_total,
            "user_total": user_total
        }
    })

# ====================== 1. 用户模块接口 ======================
# 登录
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data.get("username") or not data.get("pwd"):
        return jsonify({"code":400,"msg":"账号密码不能为空"})
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        user = cur.execute("SELECT id,username,role,status FROM user WHERE username=? AND pwd=?",
                            (data["username"], data["pwd"])).fetchone()
    if not user:
        return jsonify({"code":401,"msg":"账号密码错误"})
    if user[3] == 0:
        return jsonify({"code":403,"msg":"账号已封禁"})
    payload = {"uid":user[0], "username":user[1], "role":user[2], "exp":datetime.utcnow()+timedelta(days=7)}
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return jsonify({"code":200,"msg":"登录成功","data":{"token":token,"user":user}})

# 注册（核心修复，解决误报已存在、数据库锁定）
@app.route("/api/register", methods=["OPTIONS", "POST"])
def register():
    if request.method == "OPTIONS":
        return jsonify({"code": 200})
    try:
        data = request.get_json()
        username = data.get("username", "").strip()
        pwd = data.get("pwd", "").strip()
        email = data.get("email", "").strip()

        if not username or not pwd:
            return jsonify({"code": 400, "msg": "用户名和密码不能为空"})

        # 邮箱为空自动生成唯一随机邮箱，规避UNIQUE约束
        if not email:
            rand_suffix = ''.join(random.sample(string.ascii_letters + string.digits, 12))
            email = f"{rand_suffix}@auto-temp.com"

        # 连接超时10秒，缓解锁死
        conn = sqlite3.connect("book.db", timeout=10)
        cur = conn.cursor()

        # 只校验用户名唯一，不再校验邮箱
        cur.execute("SELECT id FROM user WHERE username = ?", (username,))
        if cur.fetchone():
            conn.close()
            return jsonify({"code": 400, "msg": "该用户名已存在，请更换"})

        cur.execute("""
            INSERT INTO user (username, pwd, email, nickname, role, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (username, pwd, email, username, "user", 1))
        conn.commit()
        conn.close()
        return jsonify({"code": 200, "msg": "注册成功"})

    except sqlite3.IntegrityError:
        return jsonify({"code": 400, "msg": "用户名重复，请重新填写"})
    except sqlite3.OperationalError:
        return jsonify({"code": 500, "msg": "数据库被锁定，请关闭所有后端终端，重新启动后端"})
    except Exception as e:
        return jsonify({"code": 500, "msg": f"服务器错误：{str(e)}"})

# 获取个人信息
@app.route("/api/user/profile", methods=["GET"])
def get_profile():
    user = get_token_user()
    if not user:
        return jsonify({"code":401,"msg":"未登录"})
    uid = user["uid"]
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        row = cur.execute("SELECT id,username,nickname,email,avatar,role FROM user WHERE id=?", (uid,)).fetchone()
    data = {
        "id": row[0],
        "username": row[1],
        "nickname": row[2],
        "email": row[3],
        "avatar": row[4],
        "role": row[5]
    }
    return jsonify({"code":200,"data":data})

# 修改个人信息
@app.route("/api/user/profile", methods=["PUT"])
def update_profile():
    user = get_token_user()
    if not user:
        return jsonify({"code":401,"msg":"未登录"})
    uid = user["uid"]
    data = request.get_json()
    nickname = data.get("nickname","")
    email = data.get("email","")
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        cur.execute("UPDATE user SET nickname=?,email=? WHERE id=?", (nickname, email, uid))
        conn.commit()
    return jsonify({"code":200,"msg":"修改成功"})

# 修改密码
@app.route("/api/user/pwd", methods=["PUT"])
def change_pwd():
    user = get_token_user()
    if not user:
        return jsonify({"code":401,"msg":"未登录"})
    uid = user["uid"]
    data = request.get_json()
    old_pwd = data.get("old_pwd")
    new_pwd = data.get("new_pwd")
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        db_pwd = cur.execute("SELECT pwd FROM user WHERE id=?", (uid,)).fetchone()[0]
        if db_pwd != old_pwd:
            return jsonify({"code":400,"msg":"原密码错误"})
        cur.execute("UPDATE user SET pwd=? WHERE id=?", (new_pwd, uid))
        conn.commit()
    return jsonify({"code":200,"msg":"密码修改成功"})

# ====================== 2. 管理员-用户管理接口 ======================
# 用户分页查询
@app.route("/api/admin/user/list", methods=["GET"])
def admin_user_list():
    if not is_admin():
        return jsonify({"code":403,"msg":"无管理员权限"})
    page = int(request.args.get("page",1))
    size = int(request.args.get("size",10))
    offset = (page-1)*size
    keyword = request.args.get("keyword","")
    like_param = f'%{keyword}%'
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        total = cur.execute("SELECT COUNT(*) FROM user WHERE username LIKE ?", (like_param,)).fetchone()[0]
        rows = cur.execute("SELECT * FROM user WHERE username LIKE ? LIMIT ?,?", (like_param, offset, size)).fetchall()
    return jsonify({"code":200,"data":{"list":rows,"total":total,"page":page,"size":size}})

# 新增用户
@app.route("/api/admin/user/add", methods=["POST"])
def admin_user_add():
    if not is_admin():
        return jsonify({"code":403,"msg":"无管理员权限"})
    data = request.get_json()
    try:
        with sqlite3.connect("book.db", timeout=5.0) as conn:
            cur = conn.cursor()
            cur.execute("INSERT INTO user(username,pwd,nickname,role,status) VALUES (?,?,?,?,?)",
                         (data["username"],data["pwd"],data["nickname"],data["role"],data["status"]))
            conn.commit()
        return jsonify({"code":200,"msg":"新增用户成功"})
    except Exception:
        return jsonify({"code":400,"msg":"用户名重复"})

# 修改用户
@app.route("/api/admin/user/edit/<int:uid>", methods=["PUT"])
def admin_user_edit(uid):
    if not is_admin():
        return jsonify({"code":403,"msg":"无管理员权限"})
    data = request.get_json()
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        cur.execute("UPDATE user SET nickname=?,role=?,status=? WHERE id=?",
                     (data["nickname"],data["role"],data["status"],uid))
        conn.commit()
    return jsonify({"code":200,"msg":"修改成功"})

# 单条删除用户
@app.route("/api/admin/user/del/<int:uid>", methods=["OPTIONS","DELETE"])
def admin_user_delete_single(uid):
    if not is_admin():
        return jsonify({"code":403,"msg":"无管理员权限"})
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        borrow_count = cur.execute("SELECT COUNT(*) FROM borrow WHERE user_id=?", (uid,)).fetchone()[0]
        if borrow_count > 0:
            return jsonify({"code":400,"msg":"该用户存在关联借阅数据无法删除"})
        cur.execute("DELETE FROM user WHERE id=?", (uid,))
        conn.commit()
    return jsonify({"code":200,"msg":"删除成功"})

# 批量删除用户
@app.route("/api/admin/user/del", methods=["DELETE"])
def admin_user_del():
    if not is_admin():
        return jsonify({"code":403,"msg":"无管理员权限"})
    ids = request.get_json().get("ids",[])
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        for uid in ids:
            cnt = cur.execute("SELECT COUNT(*) FROM borrow WHERE user_id=?", (uid,)).fetchone()[0]
            if cnt == 0:
                cur.execute("DELETE FROM user WHERE id=?", (uid,))
        conn.commit()
    return jsonify({"code":200,"msg":"删除完成"})

# ====================== 3. 图书分类接口 ======================
# 获取分类树
@app.route("/api/category/tree", methods=["GET"])
def category_tree():
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        all_cat = cur.execute("SELECT * FROM category ORDER BY sort").fetchall()
    tree = []
    def build(pid):
        res = []
        for item in all_cat:
            cid, name, parent, sort = item
            if parent == pid:
                children = build(cid)
                res.append({"id":cid,"name":name,"children":children})
        return res
    tree = build(0)
    return jsonify({"code":200,"data":tree})

# 分类CRUD
@app.route("/api/category/add", methods=["POST"])
def cat_add():
    data = request.get_json()
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        cur.execute("INSERT INTO category(cat_name,parent_id,sort) VALUES (?,?,?)",
                     (data["name"],data["parent_id"],data["sort"]))
        conn.commit()
    return jsonify({"code":200,"msg":"添加分类成功"})

@app.route("/api/category/edit/<int:cid>", methods=["PUT"])
def cat_edit(cid):
    data = request.get_json()
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        cur.execute("UPDATE category SET cat_name=?,parent_id=?,sort=? WHERE id=?",
                     (data["name"],data["parent_id"],data["sort"],cid))
        conn.commit()
    return jsonify({"code":200,"msg":"修改分类成功"})

@app.route("/api/category/del/<int:cid>", methods=["DELETE"])
def cat_del(cid):
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM category WHERE id=?", (cid,))
        conn.commit()
    return jsonify({"code":200,"msg":"删除分类成功"})

# 分类图书统计
@app.route("/api/category/count", methods=["GET"])
def cat_count():
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        res = cur.execute('''
            SELECT c.cat_name, COUNT(b.id) cnt FROM category c
            LEFT JOIN book b ON c.id = b.category_id
            GROUP BY c.id ORDER BY cnt DESC
        ''').fetchall()
    return jsonify({"code":200,"data":res})

# ====================== 4. 图书管理接口 ======================
# 图书分页列表
@app.route("/api/book/list", methods=["GET"])
def book_list():
    page = int(request.args.get("page",1))
    size = int(request.args.get("size",10))
    cid = request.args.get("category_id","")
    sort = request.args.get("sort","default")
    keyword = request.args.get("keyword","").strip()
    offset = (page-1)*size
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        where_arr = []
        params = []
        if cid:
            where_arr.append("category_id=?")
            params.append(cid)
        if keyword:
            where_arr.append("(name LIKE ? OR author LIKE ?)")
            params.append(f"%{keyword}%")
            params.append(f"%{keyword}%")
        where_sql = ""
        if len(where_arr) > 0:
            where_sql = "WHERE " + " AND ".join(where_arr)
        order = "id DESC"
        if sort == "hot": order = "borrow_count DESC"
        if sort == "new": order = "publish_time DESC"
        if sort == "score": order = "score DESC"
        if sort == "collect": order = "collect_count DESC"
        total_sql = f"SELECT COUNT(*) FROM book {where_sql}"
        total = cur.execute(total_sql, params).fetchone()[0]
        params.extend([offset, size])
        data_sql = f"SELECT * FROM book {where_sql} ORDER BY {order} LIMIT ?,?"
        list_data = cur.execute(data_sql, params).fetchall()
    return jsonify({"code":200,"data":{"list":list_data,"total":total}})

# 单本图书详情
@app.route("/api/book/<int:bid>", methods=["GET"])
def book_detail(bid):
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        book = cur.execute("SELECT * FROM book WHERE id=?", (bid,)).fetchone()
    return jsonify({"code":200,"data":book})

# 管理员图书新增/编辑/删除
@app.route("/api/admin/book/add", methods=["POST"])
def book_add():
    if not is_admin(): return jsonify({"code":403,"msg":"无权限"})
    data = request.get_json()
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        cur.execute('''
        INSERT INTO book(name,author,category_id,publisher,stock,cover_url,desc,publish_time)
        VALUES (?,?,?,?,?,?,?,?)
        ''', (data["name"],data["author"],data["category_id"],data["publisher"],
              data["stock"],data["cover_url"],data["desc"],data["publishing_time"]))
        conn.commit()
    return jsonify({"code":200,"msg":"新增图书成功"})

@app.route("/api/admin/book/edit/<int:bid>", methods=["PUT"])
def book_edit(bid):
    if not is_admin(): return jsonify({"code":403,"msg":"无权限"})
    data = request.get_json()
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        cur.execute('''
        UPDATE book SET name=?,author=?,category_id=?,publisher=?,stock=?,cover_url=?,desc=?,publish_time=?,status=?
        WHERE id=?
        ''', (data["name"],data["author"],data["category_id"],data["publisher"],
              data["stock"],data["cover_url"],data["desc"],data["publishing_time"],data["status"],bid))
        conn.commit()
    return jsonify({"code":200,"msg":"修改图书成功"})

@app.route("/api/admin/book/del/<int:bid>", methods=["DELETE"])
def book_del(bid):
    if not is_admin(): return jsonify({"code":403,"msg":"无权限"})
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM book WHERE id=?", (bid,))
        conn.commit()
    return jsonify({"code":200,"msg":"删除图书成功"})

# ====================== 5. 收藏模块接口 ======================
@app.route("/api/collect/add/<int:bid>", methods=["POST"])
def collect_add(bid):
    user = get_token_user()
    if not user: return jsonify({"code":401,"msg":"未登录"})
    uid = user["uid"]
    try:
        with sqlite3.connect("book.db", timeout=5.0) as conn:
            cur = conn.cursor()
            cur.execute("INSERT INTO collection(user_id,book_id) VALUES (?,?)", (uid, bid))
            cur.execute("UPDATE book SET collect_count=collect_count+1 WHERE id=?", (bid,))
            conn.commit()
        return jsonify({"code":200,"msg":"收藏成功"})
    except Exception:
        return jsonify({"code":400,"msg":"已收藏"})

@app.route("/api/collect/cancel/<int:bid>", methods=["DELETE"])
def collect_cancel(bid):
    user = get_token_user()
    if not user: return jsonify({"code":401,"msg":"未登录"})
    uid = user["uid"]
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM collection WHERE user_id=? AND book_id=?", (uid,bid))
        cur.execute("UPDATE book SET collect_count=collect_count-1 WHERE id=?", (bid,))
        conn.commit()
    return jsonify({"code":200,"msg":"取消收藏"})

# 兼容前端 /api/collect/del/{bid}
@app.route("/api/collect/del/<int:bid>", methods=["DELETE"])
def collect_del_alias(bid):
    return collect_cancel(bid)

# 查询是否收藏
@app.route("/api/collect/check/<int:bid>", methods=["GET"])
def collect_check(bid):
    user = get_token_user()
    if not user: return jsonify({"code":200,"data":False})
    uid = user["uid"]
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        res = cur.execute("SELECT id FROM collection WHERE user_id=? AND book_id=?", (uid,bid)).fetchone()
    return jsonify({"code":200,"data": bool(res)})

# 我的收藏列表
@app.route("/api/collect/my", methods=["GET"])
def my_collect():
    user = get_token_user()
    if not user: return jsonify({"code":401,"msg":"未登录"})
    uid = user["uid"]
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        list_data = cur.execute('''
        SELECT b.* FROM collection c LEFT JOIN book b ON c.book_id = b.id WHERE c.user_id=?
        ''', (uid,)).fetchall()
    return jsonify({"code":200,"data":list_data})

# ====================== 6. 借阅模块接口 ======================
# 用户发起借阅申请
@app.route("/api/borrow/apply/<int:bid>", methods=["POST"])
def borrow_apply(bid):
    user = get_token_user()
    if not user: return jsonify({"code":401,"msg":"未登录"})
    uid = user["uid"]
    data = request.get_json()
    days = data.get("days",14)
    today = datetime.now().strftime("%Y-%m-%d")
    due = (datetime.now()+timedelta(days=days)).strftime("%Y-%m-%d")
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        stock = cur.execute("SELECT stock FROM book WHERE id=?", (bid,)).fetchone()[0]
        if stock <=0:
            return jsonify({"code":400,"msg":"库存不足"})
        cur.execute('''
        INSERT INTO borrow(user_id,book_id,borrow_days,due_date,start_date)
        VALUES (?,?,?,?,?)
        ''', (uid,bid,days,due,today))
        conn.commit()
    return jsonify({"code":200,"msg":"借阅申请提交，等待管理员审核"})

# 管理员审批/驳回
@app.route("/api/admin/borrow/audit/<int:borrow_id>", methods=["PUT"])
def borrow_audit(borrow_id):
    if not is_admin(): return jsonify({"code":403,"msg":"无权限"})
    data = request.get_json()
    status = data["status"]
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        borrow_info = cur.execute("SELECT book_id FROM borrow WHERE id=?", (borrow_id,)).fetchone()
        bid = borrow_info[0]
        if status == 1:
            cur.execute("UPDATE book SET stock=stock-1, borrow_count=borrow_count+1 WHERE id=?", (bid,))
        cur.execute("UPDATE borrow SET status=? WHERE id=?", (status, borrow_id))
        conn.commit()
    return jsonify({"code":200,"msg":"审批完成"})

# 用户归还图书
@app.route("/api/borrow/return/<int:borrow_id>", methods=["PUT"])
def borrow_return(borrow_id):
    user = get_token_user()
    if not user: return jsonify({"code":401,"msg":"未登录"})
    uid = user["uid"]
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        borrow = cur.execute("SELECT book_id,status FROM borrow WHERE id=? AND user_id=?", (borrow_id,uid)).fetchone()
        if not borrow or borrow[1] !=1:
            return jsonify({"code":400,"msg":"无法归还"})
        bid = borrow[0]
        cur.execute("UPDATE borrow SET return_date=CURRENT_DATE,status=3 WHERE id=?", (borrow_id,))
        cur.execute("UPDATE book SET stock=stock+1 WHERE id=?", (bid,))
        conn.commit()
    return jsonify({"code":200,"msg":"归还成功"})

# 续借
@app.route("/api/borrow/renew/<int:borrow_id>", methods=["PUT"])
def borrow_renew(borrow_id):
    user = get_token_user()
    if not user: return jsonify({"code":401,"msg":"未登录"})
    uid = user["uid"]
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        borrow = cur.execute("SELECT due_date,borrow_days,status FROM borrow WHERE id=? AND user_id=?", (borrow_id,uid)).fetchone()
        if not borrow or borrow[2] !=1:
            return jsonify({"code":400,"msg":"不可续借"})
        old_due = datetime.strptime(borrow[0], "%Y-%m-%d")
        new_due = old_due + timedelta(days=borrow[1])
        cur.execute("UPDATE borrow SET due_date=? WHERE id=?", (new_due.strftime("%Y-%m-%d"), borrow_id))
        conn.commit()
    return jsonify({"code":200,"msg":"续借成功"})

# 我的借阅记录
@app.route("/api/borrow/my", methods=["GET"])
def my_borrow():
    user = get_token_user()
    if not user: return jsonify({"code":401,"msg":"未登录"})
    uid = user["uid"]
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        list_data = cur.execute('''
        SELECT br.*,b.name,b.author FROM borrow br LEFT JOIN book b ON br.book_id=b.id WHERE br.user_id=?
        ''', (uid,)).fetchall()
    return jsonify({"code":200,"data":list_data})

# 管理员借阅列表
@app.route("/api/admin/borrow/list", methods=["GET"])
def admin_borrow_list():
    if not is_admin(): return jsonify({"code":403,"msg":"无权限"})
    filter_type = request.args.get("filter","all")
    today = datetime.now().strftime("%Y-%m-%d")
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        sql = '''
        SELECT br.*,u.username,b.name FROM borrow br
        LEFT JOIN user u ON br.user_id=u.id
        LEFT JOIN book b ON br.book_id=b.id
        '''
        if filter_type == "overdue":
            sql += f" WHERE br.status=1 AND br.due_date < '{today}'"
        elif filter_type == "soon":
            soon = (datetime.now()+timedelta(days=3)).strftime("%Y-%m-%d")
            sql += f" WHERE br.status=1 AND br.due_date BETWEEN '{today}' AND '{soon}'"
        res = cur.execute(sql).fetchall()
    return jsonify({"code":200,"data":res})

# ====================== 7. 评论模块接口 ======================
# 发表评论
@app.route("/api/comment/add/<int:bid>", methods=["POST"])
def comment_add(bid):
    user = get_token_user()
    if not user: return jsonify({"code":401,"msg":"未登录"})
    uid = user["uid"]
    data = request.get_json()
    content = data["content"]
    score = int(data.get("score",5))
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        cur.execute("INSERT INTO comment(user_id,book_id,content,score) VALUES (?,?,?,?)",
                     (uid,bid,content,score))
        all_score = cur.execute("SELECT AVG(score) FROM comment WHERE book_id=?", (bid,)).fetchone()[0]
        if all_score is not None:
            cur.execute("UPDATE book SET score=? WHERE id=?", (round(all_score,1), bid))
        conn.commit()
    return jsonify({"code":200,"msg":"评论发布成功"})

# 删除本人评论
@app.route("/api/comment/del/<int:cid>", methods=["DELETE"])
def comment_del(cid):
    user = get_token_user()
    if not user: return jsonify({"code":401,"msg":"未登录"})
    uid = user["uid"]
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM comment WHERE id=? AND user_id=?", (cid,uid))
        conn.commit()
    return jsonify({"code":200,"msg":"删除评论成功"})

# 管理员删除评论
@app.route("/api/admin/comment/del/<int:cid>", methods=["DELETE"])
def admin_comment_del(cid):
    if not is_admin(): return jsonify({"code":403,"msg":"无权限"})
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM comment WHERE id=?", (cid,))
        conn.commit()
    return jsonify({"code":200,"msg":"管理员删除评论成功"})

# 图书评论列表
@app.route("/api/book/comment/<int:bid>", methods=["GET"])
def book_comment(bid):
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        res = cur.execute('''
        SELECT c.*,u.username FROM comment c LEFT JOIN user u ON c.user_id=u.id
        WHERE c.book_id=? AND c.is_del=0 ORDER BY c.create_time DESC
        ''', (bid,)).fetchall()
    return jsonify({"code":200,"data":res})

# 管理员全部评论
@app.route("/api/admin/comment/list", methods=["GET"])
def admin_comment_list():
    if not is_admin(): return jsonify({"code":403,"msg":"无权限"})
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        res = cur.execute('''
        SELECT c.*,u.username,b.name FROM comment c
        LEFT JOIN user u ON c.user_id=u.id
        LEFT JOIN book b ON c.book_id=b.id
        ORDER BY c.create_time DESC
        ''').fetchall()
    return jsonify({"code":200,"data":res})

# ====================== 8. 七大推荐接口 ======================
# 1.热门图书推荐
@app.route("/api/recommend/hot", methods=["GET"])
def rec_hot():
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        res = cur.execute("SELECT * FROM book ORDER BY borrow_count DESC LIMIT 8").fetchall()
    return jsonify({"code":200,"data":res})

# 2.新书推荐
@app.route("/api/recommend/new", methods=["GET"])
def rec_new():
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        res = cur.execute("SELECT * FROM book ORDER BY publish_time DESC LIMIT 8").fetchall()
    return jsonify({"code":200,"data":res})

# 3.物品协同过滤 ItemCF
@app.route("/api/recommend/itemcf/<int:bid>", methods=["GET"])
def rec_itemcf(bid):
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        cat_id = cur.execute("SELECT category_id FROM book WHERE id=?", (bid,)).fetchone()[0]
        res = cur.execute("SELECT * FROM book WHERE category_id=? AND id!=? ORDER BY borrow_count DESC LIMIT 6", (cat_id,bid)).fetchall()
    return jsonify({"code":200,"data":res})

# 4.用户协同过滤 UserCF
@app.route("/api/recommend/usercf", methods=["GET"])
def rec_usercf():
    user = get_token_user()
    if not user: return jsonify({"code":200,"data":[]})
    uid = user["uid"]
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        my_book_rows = cur.execute("SELECT DISTINCT book_id FROM borrow WHERE user_id=?", (uid,)).fetchall()
        my_book_ids = [row[0] for row in my_book_rows]
        if not my_book_ids:
            return jsonify({"code":200,"data":[]})
        placeholders = ",".join(["?"] * len(my_book_ids))
        other_uid_rows = cur.execute(f"SELECT DISTINCT user_id FROM borrow WHERE book_id IN ({placeholders}) AND user_id != ?", (*my_book_ids, uid)).fetchall()
        other_uids = [row[0] for row in other_uid_rows]
        if not other_uids:
            return jsonify({"code":200,"data":[]})
        uid_placeholders = ",".join(["?"] * len(other_uids))
        bid_placeholders = ",".join(["?"] * len(my_book_ids))
        rec_book = cur.execute(f'''
        SELECT DISTINCT b.* FROM borrow br LEFT JOIN book b ON br.book_id=b.id
        WHERE br.user_id IN ({uid_placeholders}) AND br.book_id NOT IN ({bid_placeholders})
        LIMIT 6
        ''', (*other_uids, *my_book_ids)).fetchall()
    return jsonify({"code":200,"data":rec_book})

# 5.内容推荐
@app.route("/api/recommend/content", methods=["GET"])
def rec_content():
    user = get_token_user()
    if not user: return jsonify({"code":200,"data":[]})
    uid = user["uid"]
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        my_cat_rows = cur.execute('''
        SELECT DISTINCT b.category_id FROM borrow br LEFT JOIN book b ON br.book_id=b.id WHERE br.user_id=?
        ''', (uid,)).fetchall()
        if not my_cat_rows:
            return jsonify({"code":200,"data":[]})
        my_cat_ids = [row[0] for row in my_cat_rows]
        cat_placeholders = ",".join(["?"] * len(my_cat_ids))
        res = cur.execute(f"SELECT * FROM book WHERE category_id IN ({cat_placeholders}) ORDER BY score DESC LIMIT 6", my_cat_ids).fetchall()
    return jsonify({"code":200,"data":res})

# 6.相似图书推荐
@app.route("/api/recommend/similar/<int:bid>", methods=["GET"])
def rec_similar(bid):
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        cat_id = cur.execute("SELECT category_id FROM book WHERE id=?", (bid,)).fetchone()[0]
        res = cur.execute("SELECT * FROM book WHERE category_id=? AND id!=? LIMIT 6", (cat_id,bid)).fetchall()
    return jsonify({"code":200,"data":res})

# 7.混合推荐
@app.route("/api/recommend/mix", methods=["GET"])
def rec_mix():
    user = get_token_user()
    uid = user["uid"] if user else None
    with sqlite3.connect("book.db", timeout=5.0) as conn:
        cur = conn.cursor()
        hot = cur.execute("SELECT * FROM book ORDER BY borrow_count DESC LIMIT 4").fetchall()
        content = []
        if uid is not None:
            my_cat_rows = cur.execute('''
            SELECT DISTINCT b.category_id FROM borrow br LEFT JOIN book b ON br.book_id=b.id WHERE br.user_id=?
            ''', (uid,)).fetchall()
            if my_cat_rows:
                my_cat_ids = [row[0] for row in my_cat_rows]
                cat_placeholders = ",".join(["?"] * len(my_cat_ids))
                content = cur.execute(f"SELECT * FROM book WHERE category_id IN ({cat_placeholders}) LIMIT 4", my_cat_ids).fetchall()
        mix_map = {}
        for item in hot + content:
            mix_map[item[0]] = item
        mix = list(mix_map.values())[:8]
    return jsonify({"code":200,"data":mix})

# ====================== 程序入口（仅本地调试时初始化数据库，线上Web启动不会执行init_db） ======================
if __name__ == "__main__":
    # 只有手动运行python app.py才会初始化数据库，PythonAnywhere Web托管启动不会执行这里
    init_db()
    app.run(debug=True, use_reloader=False, port=5000)