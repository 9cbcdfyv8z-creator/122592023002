"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Login() {
    const router = useRouter();
    // 默认初始为空，打开页面就是空白输入框
    const [username, setUsername] = useState("");
    const [pwd, setPwd] = useState("");
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);

    // 页面加载时，仅勾选过记住我的场景才读取本地缓存回填
    useEffect(() => {
        const savedRemember = localStorage.getItem("login_remember") === "true";
        setRemember(savedRemember);
        if (savedRemember) {
            setUsername(localStorage.getItem("saved_username") ?? "");
            setPwd(localStorage.getItem("saved_pwd") ?? "");
        }
    }, []);

    const loginSubmit = async () => {
        setLoading(true);
        try {
            const res = await axios.post("http://127.0.0.1:5000/api/login", { username, pwd });
            if (res.data.code === 200) {
                localStorage.setItem("token", res.data.data.token);
                // 根据记住我勾选状态决定是否持久化账号密码
                if (remember) {
                    localStorage.setItem("login_remember", "true");
                    localStorage.setItem("saved_username", username);
                    localStorage.setItem("saved_pwd", pwd);
                } else {
                    // 没勾选就清空历史保存的登录凭据
                    localStorage.removeItem("login_remember");
                    localStorage.removeItem("saved_username");
                    localStorage.removeItem("saved_pwd");
                }
                alert("登录成功");
                router.push("/");
            } else {
                alert(res.data.msg);
            }
        } catch (err) {
            alert("后端服务未启动，请先运行backend的python app.py");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50 m-0">
            <div className="w-full max-w-5xl flex rounded-2xl overflow-hidden shadow-xl bg-white">
                {/* 左侧蓝色宣传区块 */}
                <div className="w-1/2 bg-gradient-to-br from-blue-400 to-blue-600 text-white p-16 flex flex-col justify-center">
                    <h1 className="text-5xl font-bold mb-6">图书管理系统</h1>
                    <p className="text-lg opacity-90 mb-10">—— 探索知识的海洋，发现阅读的无限可能 ——</p>
                    <div className="text-9xl opacity-60">📚</div>
                </div>
                {/* 右侧登录表单区块 */}
                <div className="w-1/2 p-16 flex flex-col justify-center">
                    <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">欢迎回来</h2>
                    <p className="text-gray-500 text-center mb-10">登录您的账号，继续您的阅读之旅</p>
                    <div className="space-y-5">
                        <input
                            autoComplete="username"
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
                            placeholder="用户名"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            autoComplete="current-password"
                            type="password"
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
                            placeholder="密码"
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
                        />
                        <div className="flex justify-between items-center text-sm">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                                记住我
                            </label>
                            <span className="text-blue-500 cursor-pointer">忘记密码？</span>
                        </div>
                        <button
                            onClick={loginSubmit}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-400 to-blue-600 text-white py-3 rounded-lg font-medium text-lg disabled:opacity-60"
                        >
                            {loading ? "登录中" : "登录"}
                        </button>
                        <p className="text-center text-gray-500 mt-6">
                            还没有账号？
                            <Link href="/register" className="text-blue-500 ml-1">立即注册</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}