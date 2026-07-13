import sqlite3
# 5秒超时等待锁释放
with sqlite3.connect("book.db", timeout=5.0) as conn:
    cur = conn.cursor()
    # 把qqq换成你测试的用户名
    res = cur.execute("SELECT * FROM user WHERE username = 'qqq'").fetchall()
print("查询结果：", res)