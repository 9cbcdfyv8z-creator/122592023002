"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

type BookRow = [
    number, string, string, number | null, string | null, number, string | null, string | null, number, number, number, string | null, number
];

export default function Home() {
    const [stats, setStats] = useState({
        book_total: 0,
        category_total: 0,
        borrow_total: 0,
        user_total: 0,
    });
    // 新增热门、推荐图书状态
    const [hotBooks, setHotBooks] = useState<BookRow[]>([]);
    const [recommendBooks, setRecommendBooks] = useState<BookRow[]>([]);
    const [token] = useState<string>(() => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem("token") ?? "";
    });

    // 加载首页全部数据
    useEffect(() => {
        const loadHomeData = async () => {
            try {
                // 统计数据
                const statRes = await axios.get("http://127.0.0.1:5000/api/dashboard/stats");
                setStats(statRes.data.data);

                // 热门图书
                const hotRes = await axios.get("http://127.0.0.1:5000/api/recommend/hot");
                setHotBooks(hotRes.data.data.slice(0, 4));

                // 个性化推荐：无数据自动兜底热门图书
                if (token) {
                    try {
                        // 仅此处修改：将不存在的personal替换为usercf接口
                        const recRes = await axios.get("http://127.0.0.1:5000/api/recommend/usercf", {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (recRes.data.data.length > 0) {
                            setRecommendBooks(recRes.data.data);
                        } else {
                            setRecommendBooks(hotRes.data.data.slice(4, 8));
                        }
                    } catch (err) {
                        setRecommendBooks(hotRes.data.data.slice(4, 8));
                    }
                } else {
                    // 未登录直接展示热门兜底
                    setRecommendBooks(hotRes.data.data.slice(4, 8));
                }
            } catch (err) {
                console.error("首页数据加载失败", err);
            }
        };
        (async () => await loadHomeData())();
    }, [token]);

    // 图书卡片通用组件（完整包裹Link，封面可点击跳转）
    const BookCard = ({ book }: { book: BookRow }) => (
        <Link href={`/book/${book[0]}`} className="bg-white rounded-xl shadow p-4 block">
            <div className="h-36 bg-slate-100 rounded mb-3 overflow-hidden">
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
            <h3 className="font-bold">{book[1]}</h3>
            <p className="text-sm text-gray-500">{book[2]}</p>
        </Link>
    );

    return (
        <div className="py-10 max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold text-blue-600 text-center">图书借阅管理系统</h1>
            <p className="text-gray-500 text-center mt-2 mb-10">探索知识的海洋，发现阅读的乐趣</p>

            {/* 功能按钮 */}
            <div className="flex justify-center gap-5 mb-12">
                <Link
                    href="/book"
                    className="px-8 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
                >
                    浏览图书
                </Link>
                <Link
                    href="/rank"
                    className="px-8 py-3 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-50 transition"
                >
                    热门榜单
                </Link>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-5 mb-12">
                <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                    <div className="text-5xl font-bold text-blue-600">{stats.user_total}</div>
                    <div className="text-gray-500 mt-2">注册用户</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                    <div className="text-5xl font-bold text-green-600">{stats.book_total}</div>
                    <div className="text-gray-500 mt-2">馆藏图书</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                    <div className="text-5xl font-bold text-amber-600">{stats.borrow_total}</div>
                    <div className="text-gray-500 mt-2">借阅次数</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                    <div className="text-5xl font-bold text-red-600">{stats.category_total}</div>
                    <div className="text-gray-500 mt-2">图书分类</div>
                </div>
            </div>

            {/* 热门图书区域 */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">热门图书</h2>
                <Link href="/rank" className="text-blue-500 hover:underline">查看全部 &gt;</Link>
            </div>
            {hotBooks.length === 0 ? (
                <p className="text-gray-400 mb-8">暂无热门图书</p>
            ) : (
                <div className="grid grid-cols-4 gap-5 mb-12">
                    {hotBooks.map(book => <BookCard key={book[0]} book={book} />)}
                </div>
            )}

            {/* 为你推荐区域 */}
            <h2 className="text-2xl font-bold mt-10 mb-4">为您推荐</h2>
            <p className="text-gray-400 mb-4">根据您的阅读喜好，为您精选的图书</p>
            {recommendBooks.length === 0 ? (
                <p className="text-gray-400">暂无推荐图书，请先浏览图书</p>
            ) : (
                <div className="grid grid-cols-4 gap-5">
                    {recommendBooks.map(book => <BookCard key={book[0]} book={book} />)}
                </div>
            )}
        </div>
    );
}