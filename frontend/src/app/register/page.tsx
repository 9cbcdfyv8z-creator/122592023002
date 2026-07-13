"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Register() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        username: "",
        pwd: "",
        rePwd: "",
        email: ""
    });

    const submitReg = async () => {
        // 加载中禁止重复提交
        if (loading) return;
        if (!form.username || !form.pwd) {
            alert("用户名和密码不能为空");
            return;
        }
        if (form.pwd !== form.rePwd) {
            alert("两次输入密码不一致");
            return;
        }
        try {
            setLoading(true);
            const res = await axios.post("http://127.0.0.1:5000/api/register", {
                username: form.username,
                pwd: form.pwd,
                email: form.email
            });
            if (res.data.code === 200) {
                alert("注册成功，请登录");
                router.push("/login");
            } else {
                alert(res.data.msg);
            }
        } catch (err: any) {
            // 捕获后端500数据库锁定异常
            if (err?.response?.data?.msg) {
                alert(err.response.data.msg);
            } else {
                alert("数据库繁忙，请关闭后端全部终端，重新启动后重试");
            }
        } finally {
            // 无论成功失败都解除加载锁定，按钮恢复可用
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-5xl flex rounded-xl overflow-hidden card-shadow">
                <div className="w-1/2 bg-gradient-to-br from-blue-400 to-blue-600 text-white p-16 flex flex-col justify-center">
                    <h1 className="text-5xl font-bold mb-6">新用户注册</h1>
                    <p className="text-lg opacity-90 mb-10">注册账号，开启你的图书借阅之旅</p>
                    <div className="opacity-60 text-9xl">📚</div>
                </div>
                <div className="w-1/2 bg-white p-16 flex flex-col justify-center">
                    <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">创建账号</h2>
                    <p className="text-gray-500 text-center mb-10">填写信息完成注册</p>
                    <div className="space-y-5">
                        <input
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
                            placeholder="用户名"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                        />
                        <input
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
                            placeholder="邮箱"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        <input
                            type="password"
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
                            placeholder="密码"
                            value={form.pwd}
                            onChange={(e) => setForm({ ...form, pwd: e.target.value })}
                        />
                        <input
                            type="password"
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
                            placeholder="确认密码"
                            value={form.rePwd}
                            onChange={(e) => setForm({ ...form, rePwd: e.target.value })}
                        />
                        <button
                            onClick={submitReg}
                            disabled={loading}
                            className={`w-full bg-gradient-to-r from-blue-400 to-blue-600 text-white py-3 rounded-lg font-medium text-lg ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                            {loading ? "注册中..." : "立即注册"}
                        </button>
                        <p className="text-center text-gray-500 mt-6">
                            已有账号？
                            <Link href="/login" className="text-blue-500 ml-1">前往登录</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}