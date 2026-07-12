"use client";
import { useEffect, useState } from "react";
import axios from "axios";

type UserInfo = {
    id: number;
    username: string;
    nickname: string | null;
    email: string | null;
    avatar: string | null;
    role: string;
} | null;

export default function Profile() {
    const [tab, setTab] = useState("info");
    const [user, setUser] = useState<UserInfo>(null);
    const [collectList, setCollectList] = useState<any[]>([]);
    const [token, setToken] = useState<string>("");
    const [loading, setLoading] = useState(true);

    // 仅客户端读取token，规避SSR localStorage报错
    useEffect(() => {
        const savedToken = localStorage.getItem("token") ?? "";
        setToken(savedToken);
    }, []);

    // 请求个人资料
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

    // 请求我的收藏
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

    // 加载/空状态兜底
    if (loading) return <div className="text-center mt-20 text-xl">加载个人资料中...</div>;
    if (!token) return <div className="text-center mt-20 text-xl">请登录后访问个人中心</div>;
    if (!user) return <div className="text-center mt-20 text-xl">暂无用户数据</div>;

    return (
        <div className="max-w-5xl mx-auto p-5">
            {/* 标签切换 */}
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
            </div>

            {/* 个人资料面板 */}
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

            {/* 我的收藏面板 */}
            {tab === "collect" && (
                <div className="mt-4">
                    {collectList.length === 0 ? (
                        <p className="text-gray-500 mt-4">暂无收藏图书</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            {collectList.map((book) => (
                                <div key={book[0]} className="border rounded-lg p-4 shadow-sm">
                                    <h3 className="font-bold text-lg">{book[1]}</h3>
                                    <p className="text-gray-500">作者：{book[2]}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}