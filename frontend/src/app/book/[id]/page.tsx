"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

type BookItem = any;
type CategoryItem = any;

export default function BookListPage() {
    const [bookList, setBookList] = useState<BookItem[]>([]);
    const [cateTree, setCateTree] = useState<CategoryItem[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectCate, setSelectCate] = useState("");
    const [sortType, setSortType] = useState("default");
    const [searchKey, setSearchKey] = useState("");
    const [token, setToken] = useState<string>("");
    const [collectedIds, setCollectedIds] = useState<number[]>([]);

    // 修复SSR localStorage报错
    useEffect(() => {
        if (typeof window !== "undefined") {
            setToken(localStorage.getItem("token") ?? "");
        }
    }, []);

    // 加载分类
    const loadCategory = async () => {
        const res = await axios.get("http://127.0.0.1:5000/api/category/tree");
        setCateTree(res.data.data);
    };

    // 加载图书（追加searchKey参数）
    const loadBooks = async () => {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("size", "12");
        if (selectCate) params.append("category_id", selectCate);
        if (sortType) params.append("sort", sortType);
        if (searchKey.trim()) params.append("keyword", searchKey.trim());
        const res = await axios.get(`http://127.0.0.1:5000/api/book/list?${params.toString()}`);
        setBookList(res.data.data.list);
        setTotal(res.data.data.total);
    };

    // 获取本人收藏列表
    const fetchMyCollect = async () => {
        if (!token) return;
        try {
            const res = await axios.get("http://127.0.0.1:5000/api/collect/my", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const ids = res.data.data.map((item: any) => item.book_id) as number[];
            setCollectedIds(ids);
        } catch (e) {
            console.error("读取收藏列表失败", e);
        }
    };

    useEffect(() => {
        loadCategory();
    }, []);

    // 依赖加入searchKey，回车修改page会触发搜索
    useEffect(() => {
        loadBooks();
    }, [page, selectCate, sortType, searchKey]);

    useEffect(() => {
        fetchMyCollect();
    }, [token]);

    // 收藏/取消收藏切换
    const handleCollect = async (bid: number) => {
        if (!token) return alert("请先登录");
        const isCollected = collectedIds.includes(bid);
        try {
            if (isCollected) {
                await axios.delete(`http://127.0.0.1:5000/api/collect/del/${bid}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCollectedIds(prev => prev.filter(id => id !== bid));
                alert("已取消收藏");
            } else {
                await axios.post(`http://127.0.0.1:5000/api/collect/add/${bid}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCollectedIds(prev => [...prev, bid]);
                alert("收藏成功");
            }
            loadBooks();
        } catch (err) {
            alert("收藏操作失败");
        }
    };

    return (
        <div>
            <div className="mb-8">
                <input
                    placeholder="搜索书名、作者或关键词"
                    className="w-full border rounded-full px-6 py-3 outline-blue-400"
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                    onKeyDown={(e) => {
                        // 按下回车重置页码，触发搜索
                        if (e.key === "Enter") setPage(1);
                    }}
                />
            </div>
            <div className="flex gap-6">
                {/* 左侧分类栏 */}
                <div className="w-1/5 bg-white rounded-lg p-4 card-shadow h-fit">
                    <h3 className="font-bold text-lg mb-4">图书分类</h3>
                    <div
                        className="mb-3 cursor-pointer text-blue-600"
                        onClick={() => setSelectCate("")}
                    >
                        全部分类
                    </div>
                    {cateTree.map((cate) => (
                        <div key={cate.id} className="my-2">
                            <div
                                className={`cursor-pointer ${selectCate == cate.id ? "text-blue-600 font-medium" : ""}`}
                                onClick={() => setSelectCate(cate.id)}
                            >
                                📁 {cate.name}
                            </div>
                            {cate.children.map((child: any) => (
                                <div
                                    key={child.id}
                                    className="ml-4 my-1 text-sm cursor-pointer text-gray-600"
                                    onClick={() => setSelectCate(child.id)}
                                >
                                    {child.name}
                                </div>
                            ))}
                        </div>
                    ))}
                    <button
                        className="mt-4 text-sm text-blue-500"
                        onClick={() => setSelectCate("")}
                    >
                        重置分类
                    </button>
                </div>
                {/* 右侧图书区域 */}
                <div className="w-4/5">
                    <div className="flex justify-between items-center mb-6">
                        <span>图书 共{total}本</span>
                        <div className="flex gap-4 text-sm">
                            <span onClick={() => setSortType("hot")} className={`cursor-pointer ${sortType === "hot" ? "text-blue-600 font-medium" : "text-gray-500"}`}>借阅最多</span>
                            <span onClick={() => setSortType("score")} className={`cursor-pointer ${sortType === "score" ? "text-blue-600 font-medium" : "text-gray-500"}`}>评分最高</span>
                            <span onClick={() => setSortType("new")} className={`cursor-pointer ${sortType === "new" ? "text-blue-600 font-medium" : "text-gray-500"}`}>最新上架</span>
                            <span onClick={() => setSortType("collect")} className={`cursor-pointer ${sortType === "collect" ? "text-blue-600 font-medium" : "text-gray-500"}`}>收藏最多</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-5">
                        {bookList.map((book) => (
                            <div key={book[0]} className="bg-white rounded-lg p-4 card-shadow book-card">
                                <Link href={`/book/${book[0]}`}>
                                    <div className="h-44 bg-slate-100 rounded mb-3 overflow-hidden">
                                        <img
                                            src={book[6]}
                                            alt={book[1]}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = "none";
                                                target.parentElement!.innerHTML = `<div class="h-full w-full flex items-center justify-center text-5xl">📖</div>`;
                                            }}
                                        />
                                    </div>
                                </Link>
                                <Link href={`/book/${book[0]}`}>
                                    <h3 className="font-medium">{book[1]}</h3>
                                </Link>
                                <p className="text-sm text-gray-500">{book[2]}</p>
                                <div className="text-xs text-gray-400 mt-1">已借阅 {book[9]} 次</div>
                                <div className="flex gap-2 mt-4">
                                    <Link href={`/book/${book[0]}`} className="flex-1 text-center bg-blue-500 text-white py-1.5 rounded text-sm">
                                        查看详情
                                    </Link>
                                    <button
                                        onClick={() => handleCollect(book[0])}
                                        className="flex-1 bg-amber-500 text-white py-1.5 rounded text-sm"
                                    >
                                        {collectedIds.includes(book[0]) ? "取消收藏" : "收藏"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* 分页 */}
                    <div className="flex justify-center gap-4 mt-10">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                            className="px-4 py-2 border rounded disabled:opacity-40"
                        >
                            上一页
                        </button>
                        <span className="px-4 py-2">第{page}页</span>
                        <button
                            disabled={page * 12 >= total}
                            onClick={() => setPage(page + 1)}
                            className="px-4 py-2 border rounded disabled:opacity-40"
                        >
                            下一页
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}