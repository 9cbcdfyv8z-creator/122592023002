"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Login() {
    const router = useRouter();
    const [username, setUsername] = useState("admin");
    const [pwd, setPwd] = useState("123456");
    const [remember, setRemember] = useState(false);

    const handleLogin = async () => {
        const res = await axios.post("http://127.0.0.1:5000/api/login", { username, pwd });
        if (res.data.code === 200) {
            localStorage.setItem("token", res.data.data.token);
            alert("登录成功");
            router.push("/");
        } else {
            alert(res.data.msg);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-5xl flex rounded-xl overflow-hidden card-shadow">
                {/* 左侧蓝色宣传区 */}
                <div className="w-1/2 bg-gradient-to-br from-blue-400 to-blue-600 text-white p-16 flex flex-col justify-center">
                    <h1 className="text-5xl font-bold mb-6">图书管理系统</h1>
                    <p className="text-lg opacity-90 mb-10">—— 探索知识的海洋，发现阅读的无限可能 ——</p>
                    <div className="opacity-60 text-9xl">📚</div>
                </div>
                {/* 右侧登录表单 */}
                <div className="w-1/2 bg-white p-16 flex flex-col justify-center">
                    <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">欢迎回来</h2>
                    <p className="text-gray-500 text-center mb-10">登录您的账号，继续您的阅读之旅</p>

                    <div className="space-y-5">
                        <input
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
                            placeholder="用户名"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
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
                            onClick={handleLogin}
                            className="w-full bg-gradient-to-r from-blue-400 to-blue-600 text-white py-3 rounded-lg font-medium text-lg"
                        >
                            登录
                        </button>
                        <p className="text-center text-gray-500 mt-6">
                            还没有账号？
                            <Link href="/register" className="text-blue-500 ml-1">立即注册</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}