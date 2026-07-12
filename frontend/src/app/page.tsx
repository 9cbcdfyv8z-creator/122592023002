"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

type Book = any;
export default function Home() {
    const [hotList, setHotList] = useState<Book[]>([]);
    const [mixRec, setMixRec] = useState<Book[]>([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        // 热门推荐
        axios.get("http://127.0.0.1:5000/api/recommend/hot").then(res => setHotList(res.data.data));
        // 混合个性化推荐
        axios.get("http://127.0.0.1:5000/api/recommend/mix", { headers }).then(res => setMixRec(res.data.data));
    }, []);

    return (
        <div>
            <div className="text-center py-12">
                <h1 className="text-4xl font-bold text-blue-600 mb-3">图书借阅管理系统</h1>
                <p className="text-gray-500 mb-8">探索知识的海洋，发现阅读的乐趣</p>
                <div className="flex gap-4 justify-center">
                    <Link href="/book" className="bg-blue-500 text-white px-6 py-2 rounded-full">浏览图书</Link>
                    <Link href="/rank" className="border border-blue-500 text-blue-500 px-6 py-2 rounded-full">热门榜单</Link>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-6 mb-12">
                <div className="bg-white p-6 rounded-lg card-shadow text-center">
                    <p className="text-3xl font-bold text-blue-600">50</p>
                    <p className="text-gray-500">馆藏图书</p>
                </div>
                <div className="bg-white p-6 rounded-lg card-shadow text-center">
                    <p className="text-3xl font-bold text-green-600">10</p>
                    <p className="text-gray-500">图书分类</p>
                </div>
                <div className="bg-white p-6 rounded-lg card-shadow text-center">
                    <p className="text-3xl font-bold text-amber-600">31</p>
                    <p className="text-gray-500">借阅次数</p>
                </div>
                <div className="bg-white p-6 rounded-lg card-shadow text-center">
                    <p className="text-3xl font-bold text-rose-600">3</p>
                    <p className="text-gray-500">注册用户</p>
                </div>
            </div>

            {/* 热门图书 */}
            <section className="mb-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">热门图书</h2>
                    <Link href="/book" className="text-blue-500">查看全部 ></Link>
                </div>
                <div className="grid grid-cols-4 gap-6">
                    {hotList.map(book => (
                        <Link href={`/book/${book[0]}`} key={book[0]} className="bg-white rounded-lg p-4 card-shadow book-card">
                            <div className="h-40 bg-slate-100 rounded mb-3 flex items-center justify-center text-5xl">📖</div>
                            <h3 className="font-medium">{book[1]}</h3>
                            <p className="text-sm text-gray-500">{book[2]}</p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 个性化推荐 */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">为您推荐</h2>
                    <span className="text-sm text-gray-400">根据您的阅读喜好，为您精选的图书</span>
                </div>
                <div className="grid grid-cols-4 gap-6">
                    {mixRec.map(book => (
                        <Link href={`/book/${book[0]}`} key={book[0]} className="bg-white rounded-lg p-4 card-shadow book-card">
                            <div className="h-40 bg-slate-100 rounded mb-3 flex items-center justify-center text-5xl">📖</div>
                            <h3 className="font-medium">{book[1]}</h3>
                            <p className="text-sm text-gray-500">{book[2]}</p>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}