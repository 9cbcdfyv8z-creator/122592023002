"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

type UserInfo = {
    id: number;
    username: string;
    nickname: string | null;
    email: string | null;
    avatar: string | null;
    role: string;
} | null;

const statusMap = {
    0: "待审批",
    1: "借阅中",
    2: "已驳回",
    3: "已归还",
    4: "逾期未还"
};

export default function Profile() {
    const [tab, setTab] = useState("info");
    const [user, setUser] = useState<UserInfo>(null);
    const [collectList, setCollectList] = useState<any[]>([]);
    const [borrowList, setBorrowList] = useState<any[]>([]);
    const [token, setToken] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem("token") ?? "";
        setToken(savedToken);
    }, []);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }
        const fetchProfile = async () => {
            try {
                const res = await axios.get("http://127.0.0.1:5000/api/user/profile", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(res.data.data);
            } catch (err) {
                console.error("获取个人资料失败", err);
                alert("个人信息加载失败，请重新登录");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [token]);

    useEffect(() => {
        if (!token) return;
        const fetchCollect = async () => {
            try {
                const res = await axios.get("http://127.0.0.1:5000/api/collect/my", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCollectList(res.data.data);
            } catch (e) {
                console.error("收藏列表加载失败", e);
            }
        };
        fetchCollect();
    }, [token]);

    useEffect(() => {
        if (!token) return;
        const fetchBorrow = async () => {
            try {
                const res = await axios.get("http://127.0.0.1:5000/api/borrow/my", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBorrowList(res.data.data);
            } catch (e) {
                console.error("借阅记录加载失败", e);
            }
        };
        fetchBorrow();
    }, [token]);

    // 关键改动：post改为put修复405报错
    const returnBook = async (borrowId: number) => {
        if (!confirm("确认归还这本图书？")) return;
        try {
            await axios.put(`http://127.0.0.1:5000/api/borrow/return/${borrowId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("归还成功！");
            const res = await axios.get("http://127.0.0.1:5000/api/borrow/my", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBorrowList(res.data.data);
        } catch (err) {
            console.error(err);
            alert("归还失败，请检查后端接口请求方式");
        }
    };

    if (loading) return <div className="text-center mt-20 text-xl">加载个人资料中...</div>;
    if (!token) return <div className="text-center mt-20 text-xl">请登录后访问个人中心</div>;
    if (!user) return <div className="text-center mt-20 text-xl">暂无用户数据</div>;

    return (
        <div className="max-w-5xl mx-auto p-5">
            <div className="flex gap-4 mb-6 border-b pb-3">
                <button
                    onClick={() => setTab("info")}
                    className={`px-4 py-2 rounded-lg ${tab === "info" ? "bg-blue-500 text-white" : "border border-gray-300"}`}
                >
                    个人资料
                </button>
                <button
                    onClick={() => setTab("collect")}
                    className={`px-4 py-2 rounded-lg ${tab === "collect" ? "bg-blue-500 text-white" : "border border-gray-300"}`}
                >
                    我的收藏
                </button>
                <button
                    onClick={() => setTab("borrow")}
                    className={`px-4 py-2 rounded-lg ${tab === "borrow" ? "bg-blue-500 text-white" : "border border-gray-300"}`}
                >
                    我的借阅
                </button>
            </div>

            {tab === "info" && (
                <div className="space-y-5 mt-4">
                    <div className="flex items-center gap-3">
                        <label className="w-20 text-right">用户名：</label>
                        <input
                            className="border px-3 py-2 w-80 bg-gray-100"
                            value={user.username}
                            disabled
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="w-20 text-right">昵称：</label>
                        <input
                            className="border px-3 py-2 w-80"
                            value={user.nickname ?? ""}
                            readOnly
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="w-20 text-right">邮箱：</label>
                        <input
                            className="border px-3 py-2 w-80"
                            value={user.email ?? ""}
                            readOnly
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="w-20 text-right">账号角色：</label>
                        <span className="text-lg">
                            {user.role === "admin" ? "管理员" : "普通用户"}
                        </span>
                    </div>
                </div>
            )}

            {tab === "collect" && (
                <div className="mt-4">
                    {collectList.length === 0 ? (
                        <p className="text-gray-500 mt-4">暂无收藏图书</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            {collectList.map((book) => (
                                <Link key={book[0]} href={`/book/${book[0]}`} className="border rounded-lg p-4 shadow-sm block">
                                    <div className="h-40 bg-slate-100 rounded mb-3 overflow-hidden">
                                        <img
                                            src={book[6]}
                                            alt={book[1]}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = "none";
                                                target.parentElement!.innerHTML = `<div class="h-full flex items-center justify-center text-5xl">📖</div>`;
                                            }}
                                        />
                                    </div>
                                    <h3 className="font-bold text-lg">{book[1]}</h3>
                                    <p className="text-gray-500">作者：{book[2]}</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === "borrow" && (
                <div className="mt-4">
                    {borrowList.length === 0 ? (
                        <p className="text-gray-500 mt-4">暂无借阅记录</p>
                    ) : (
                        <table className="w-full border-collapse bg-white shadow">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border p-3">借阅ID</th>
                                    <th className="border p-3">图书名称</th>
                                    <th className="border p-3">申请日期</th>
                                    <th className="border p-3">应还日期</th>
                                    <th className="border p-3">归还日期</th>
                                    <th className="border p-3">审批状态</th>
                                    <th className="border p-3">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {borrowList.map(row => (
                                    <tr key={row[0]}>
                                        <td className="border p-3 text-center">{row[0]}</td>
                                        <td className="border p-3 text-center">{row[4]}</td>
                                        <td className="border p-3 text-center">{row[5]}</td>
                                        <td className="border p-3 text-center">{row[6]}</td>
                                        <td className="border p-3 text-center">{row[7] ?? "-"}</td>
                                        <td className="border p-3 text-center">{statusMap[row[8]]}</td>
                                        <td className="border p-3 text-center">
                                            {row[8] === 1 && (
                                                <button onClick={() => returnBook(row[0])} className="bg-green-500 text-white px-3 py-1 rounded">归还图书</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    <p className="mt-4 text-sm text-gray-500">提示：管理员审批结果实时刷新，借阅中状态可归还图书</p>
                </div>
            )}
        </div>
    );
}