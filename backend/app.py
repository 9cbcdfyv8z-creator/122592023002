# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

def init_db():
    conn = sqlite3.connect("book.db")
    cur = conn.cursor()
    cur.execute('''
    CREATE TABLE IF NOT EXISTS user(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        pwd TEXT NOT NULL
    )
    ''')
    cur.execute('''
    CREATE TABLE IF NOT EXISTS book(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        author TEXT NOT NULL
    )
    ''')
    cur.execute("INSERT OR IGNORE INTO user(username,pwd) VALUES (?,?)", ("admin", "123456"))
    conn.commit()
    conn.close()

init_db()

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("pwd"):
        return jsonify({"code": 400, "msg": "username and password required"})
    conn = sqlite3.connect("book.db")
    row = conn.execute("SELECT * FROM user WHERE username=? AND pwd=?", (data["username"], data["pwd"])).fetchone()
    conn.close()
    if row:
        return jsonify({"code": 200, "msg": "login success"})
    return jsonify({"code": 401, "msg": "invalid credentials"})

@app.route("/api/book", methods=["GET"])
def get_book():
    conn = sqlite3.connect("book.db")
    res = conn.execute("SELECT id,name,author FROM book").fetchall()
    conn.close()
    book_list = [{"id": i[0], "name": i[1], "author": i[2]} for i in res]
    return jsonify({"code": 200, "data": book_list})

@app.route("/api/book", methods=["POST"])
def add_book():
    data = request.get_json()
    if not data or not data.get("name") or not data.get("author"):
        return jsonify({"code": 400, "msg": "book name and author required"})
    conn = sqlite3.connect("book.db")
    conn.execute("INSERT INTO book(name,author) VALUES (?,?)", (data["name"], data["author"]))
    conn.commit()
    conn.close()
    return jsonify({"code": 200, "msg": "add book success"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)