"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

export default function AdminDashboard() {
    const token = localStorage.getItem("token");
    const [stat, setStat] = useState({ user: 0, book: 0, borrow: 0, category: 0 });

    const loadStat = async () => {
        const headers = { Authorization: `Bearer ${token}` };
        const userRes = await axios.get("http://127.0.0.1:5000/api/admin/user/list?page=1&size=9999", { headers });
        const bookRes = await axios.get("http://127.0.0.1:5000/api/book/list?page=1&size=9999", { headers });
        const borrowRes = await axios.get("http://127.0.0.1:5000/api/admin/borrow/list", { headers });
        const cateRes = await axios.get("http://127.0.0.1:5000/api/category/tree", { headers });
        setStat({
            user: userRes.data.data.total,
            book: bookRes.data.data.total,
            borrow: borrowRes.data.data.length,
            category: cateRes.data.data.length
        });
    };

    useEffect(() => {
        if (!token) return alert("未登录，请先登录");
        loadStat();
    }, [token]);

    return (
        <div>
            <h2 className="text-3xl font-bold mb-8">管理后台仪表盘</h2>
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-6 mb-12">
                <div className="bg-white p-6 rounded-lg card-shadow text-center">
                    <p className="text-4xl font-bold text-blue-600">{stat.user}</p>
                    <p className="text-gray-500 mt-2">注册用户总数</p>
                </div>
                <div className="bg-white p-6 rounded-lg card-shadow text-center">
                    <p className="text-4xl font-bold text-green-600">{stat.book}</p>
                    <p className="text-gray-500 mt-2">馆藏图书总数</p>
                </div>
                <div className="bg-white p-6 rounded-lg card-shadow text-center">
                    <p className="text-4xl font-bold text-amber-600">{stat.borrow}</p>
                    <p className="text-gray-500 mt-2">全部借阅记录</p>
                </div>
                <div className="bg-white p-6 rounded-lg card-shadow text-center">
                    <p className="text-4xl font-bold text-rose-600">{stat.category}</p>
                    <p className="text-gray-500 mt-2">图书分类数量</p>
                </div>
            </div>
            {/* 功能导航 */}
            <h3 className="text-xl font-bold mb-6">后台管理功能</h3>
            <div className="grid grid-cols-3 gap-6">
                <Link href="/admin/user" className="bg-white p-6 rounded-lg card-shadow text-center hover:bg-blue-50">
                    <div className="text-5xl mb-3">👥</div>
                    <h4 className="font-medium text-lg">用户管理</h4>
                </Link>
                <Link href="/admin/book" className="bg-white p-6 rounded-lg card-shadow text-center hover:bg-blue-50">
                    <div className="text-5xl mb-3">📚</div>
                    <h4 className="font-medium text-lg">图书管理</h4>
                </Link>
                <Link href="/admin/category" className="bg-white p-6 rounded-lg card-shadow text-center hover:bg-blue-50">
                    <div className="text-5xl mb-3">📂</div>
                    <h4 className="font-medium text-lg">分类管理</h4>
                </Link>
                <Link href="/admin/borrow" className="bg-white p-6 rounded-lg card-shadow text-center hover:bg-blue-50">
                    <div className="text-5xl mb-3">📖</div>
                    <h4 className="font-medium text-lg">借阅审批</h4>
                </Link>
                <Link href="/admin/comment" className="bg-white p-6 rounded-lg card-shadow text-center hover:bg-blue-50">
                    <div className="text-5xl mb-3">💬</div>
                    <h4 className="font-medium text-lg">评论管理</h4>
                </Link>
            </div>
        </div>
    );
}