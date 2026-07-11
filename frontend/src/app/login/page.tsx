"use client";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [pwd, setPwd] = useState("");
    const router = useRouter();

    const handleLogin = async () => {
        try {
            const res = await axios.post("http://127.0.0.1:5000/api/login", {
                username,
                pwd,
            });
            if (res.data.code === 200) {
                alert("登录成功，跳转图书管理页");
                router.push("/book");
            } else {
                alert("账号或密码错误");
            }
        } catch (err) {
            alert("后端服务未启动，请先运行backend/app.py");
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-5 border rounded-lg shadow">
            <h2 className="text-xl mb-4 text-center">图书系统登录</h2>
            <div className="mb-3">
                <label>用户名</label>
                <input
                    className="w-full border p-2 mt-1"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                />
            </div>
            <div className="mb-4">
                <label>登录密码</label>
                <input
                    type="password"
                    className="w-full border p-2 mt-1"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    placeholder="123456"
                />
            </div>
            <button
                onClick={handleLogin}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded"
            >
                登录
            </button>
        </div>
    );
}