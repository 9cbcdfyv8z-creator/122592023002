"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

type BookRow = [
    number, string, string, number | null, string | null, number, string | null, string | null, number, number, number, string | null, number
];

export default function HotRankPage() {
    const [hotBookList, setHotBookList] = useState<BookRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHotBooks = async () => {
            try {
                const res = await axios.get("http://127.0.0.1:5000/api/recommend/hot");
                setHotBookList(res.data.data);
            } catch (err) {
                alert("获取热门榜单失败，请检查后端服务");
            } finally {
                setLoading(false);
            }
        };
        fetchHotBooks();
    }, []);

    if (loading) return <div className="text-center mt-20 text-xl">榜单加载中...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-blue-50 text-blue-600 mb-6">
                ← 返回首页
            </Link>
            <h1 className="text-3xl font-bold text-center mb-10">🔥 热门图书榜单</h1>

            {hotBookList.length === 0 ? (
                <p className="text-center text-gray-500 text-lg">暂无图书数据</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {hotBookList.map((book) => (
                        <Link key={book[0]} href={`/book/${book[0]}`} className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all">
                            {/* 新增封面渲染区域 */}
                            <div className="h-40 bg-slate-100 rounded mb-4 overflow-hidden">
                                <img
                                    src={book[6]}
                                    alt={book[1]}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = "none";
                                        target.parentElement!.innerHTML = `<div class="h-full flex items-center justify-center text-4xl">📖</div>`;
                                    }}
                                />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">{book[1]}</h2>
                            <p className="text-gray-500 mb-1">作者：{book[2]}</p>
                            <p className="text-orange-500 mb-1">借阅次数：{book[9]}</p>
                            <p className="text-blue-500 mb-1">综合评分：{book[8]}</p>
                            <p className="text-gray-400 text-sm">馆藏库存：{book[5]}</p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}