"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type BookItem = {
    [key: number]: string | number
};
type CategoryItem = {
    id: number;
    name: string;
    children?: CategoryItem[]
};

export default function BookListPage() {
    const router = useRouter();
    const [bookList, setBookList] = useState<BookItem[]>([]);
    const [cateTree, setCateTree] = useState<CategoryItem[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectCate, setSelectCate] = useState("");
    const [sortType, setSortType] = useState("default");
    const [searchKey, setSearchKey] = useState("");
    // 保存最终提交搜索的关键词（只有点击搜索/回车才更新）
    const [finalSearch, setFinalSearch] = useState("");
    const [token] = useState<string>(() => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem("token") ?? "";
    });
    const [collectedIds, setCollectedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    // 加载分类树
    const loadCategory = async () => {
        const res = await axios.get("http://127.0.0.1:5000/api/category/tree");
        setCateTree(res.data.data);
    };

    // 加载图书列表（使用提交后的finalSearch）
    const loadBooks = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", String(page));
            params.append("size", "12");
            if (selectCate) params.append("category_id", selectCate);
            if (sortType) params.append("sort", sortType);
            if (finalSearch.trim()) params.append("keyword", finalSearch.trim());

            const res = await axios.get(`http://127.0.0.1:5000/api/book/list?${params.toString()}`);
            setBookList(res.data.data.list);
            setTotal(res.data.data.total);
        } catch (err) {
            console.error("加载图书失败", err);
        } finally {
            setLoading(false);
        }
    };

    // 刷新收藏ID
    const refreshCollectIds = async () => {
        if (!token) return;
        try {
            const res = await axios.get("http://127.0.0.1:5000/api/collect/my", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const ids: number[] = res.data.data.map((item: { [k: number]: number }) => item[0]);
            setCollectedIds(ids);
        } catch (e) {
            console.error("刷新收藏列表失败", e);
        }
    };

    // 页面初次加载获取分类
    useEffect(() => {
        (async () => await loadCategory())();
    }, []);

    // 分页、分类、排序、搜索关键词变更时刷新列表
    useEffect(() => {
        (async () => await loadBooks())();
    }, [page, selectCate, sortType, finalSearch]);

    // 登录token变化刷新收藏
    useEffect(() => {
        (async () => await refreshCollectIds())();
    }, [token]);

    // 收藏/取消收藏
    const handleCollect = async (bid: number) => {
        if (!token) return alert("请先登录");
        const isCollected = collectedIds.includes(bid);
        try {
            if (isCollected) {
                await axios.delete(`http://127.0.0.1:5000/api/collect/del/${bid}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("已取消收藏");
            } else {
                await axios.post(`http://127.0.0.1:5000/api/collect/add/${bid}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("收藏成功");
            }
            await refreshCollectIds();
        } catch (err) {
            alert("收藏操作失败");
            console.error(err);
        }
    };

    // 搜索按钮/回车触发函数（核心修复）
    const doSearch = () => {
        // 重置到第一页
        setPage(1);
        // 将输入框内容赋值给最终搜索关键词，触发useEffect重新请求
        setFinalSearch(searchKey);
    };

    return (
        <div>
            {/* 搜索区域 */}
            <div className="mb-8 flex gap-3 items-center">
                <input
                    placeholder="搜索书名、作者或关键词"
                    className="flex-1 border rounded-full px-6 py-3 outline-blue-400"
                    value={searchKey}
                    // 仅更新输入框临时值，不请求接口
                    onChange={(e) => setSearchKey(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") doSearch();
                    }}
                />
                <button
                    onClick={doSearch}
                    disabled={loading}
                    className="bg-blue-500 text-white px-6 py-3 rounded-full whitespace-nowrap disabled:opacity-60"
                >
                    {loading ? "加载中..." : "搜索"}
                </button>
            </div>

            <div className="flex gap-6">
                {/* 左侧分类栏 */}
                <div className="w-1/5 bg-white rounded-lg p-4 card-shadow h-fit">
                    <h3 className="font-bold text-lg mb-4">图书分类</h3>
                    <div
                        className="mb-3 cursor-pointer text-blue-600"
                        onClick={() => {
                            setSelectCate("");
                            setPage(1);
                        }}
                    >
                        全部分类
                    </div>
                    {cateTree.map((cate) => (
                        <div key={cate.id} className="my-2">
                            <div
                                className={`cursor-pointer ${selectCate === String(cate.id) ? "text-blue-600 font-medium" : ""}`}
                                onClick={() => {
                                    setSelectCate(String(cate.id));
                                    setPage(1);
                                }}
                            >
                                📁 {cate.name}
                            </div>
                            {cate.children?.map((child) => (
                                <div
                                    key={child.id}
                                    className="ml-4 my-1 text-sm cursor-pointer text-gray-600"
                                    onClick={() => {
                                        setSelectCate(String(child.id));
                                        setPage(1);
                                    }}
                                >
                                    {child.name}
                                </div>
                            ))}
                        </div>
                    ))}
                    <button
                        className="mt-4 text-sm text-blue-500"
                        onClick={() => {
                            setSelectCate("");
                            setPage(1);
                        }}
                    >
                        重置分类
                    </button>
                </div>

                {/* 右侧图书列表 */}
                <div className="w-4/5">
                    <div className="flex justify-between items-center mb-6">
                        <span>图书 共{total}本</span>
                        <div className="flex gap-4 text-sm">
                            <span onClick={() => { setSortType("hot"); setPage(1); }} className={`cursor-pointer ${sortType === "hot" ? "text-blue-600 font-medium" : "text-gray-500"}`}>借阅最多</span>
                            <span onClick={() => { setSortType("score"); setPage(1); }} className={`cursor-pointer ${sortType === "score" ? "text-blue-600 font-medium" : "text-gray-500"}`}>评分最高</span>
                            <span onClick={() => { setSortType("new"); setPage(1); }} className={`cursor-pointer ${sortType === "new" ? "text-blue-600 font-medium" : "text-gray-500"}`}>最新上架</span>
                            <span onClick={() => { setSortType("collect"); setPage(1); }} className={`cursor-pointer ${sortType === "collect" ? "text-blue-600 font-medium" : "text-gray-500"}`}>收藏最多</span>
                        </div>
                    </div>

                    {/* 图书网格 */}
                    <div className="grid grid-cols-4 gap-5">
                        {bookList.map((book) => {
                            const bookId = Number(book[0]);
                            return (
                                <div key={bookId} className="bg-white rounded-lg p-4 card-shadow book-card relative">
                                    <div className="h-44 bg-slate-100 rounded mb-3 overflow-hidden">
                                        <img
                                            src={String(book[6])}
                                            alt={String(book[1])}
                                            className="w-full h-full object-cover"
                                            draggable={false}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = "none";
                                                target.parentElement!.innerHTML = `<div class="h-full w-full flex items-center justify-center text-5xl">📖</div>`;
                                            }}
                                        />
                                    </div>
                                    <h3 className="font-medium">{book[1]}</h3>
                                    <p className="text-sm text-gray-500">{book[2]}</p>
                                    <div className="text-xs text-gray-400 mt-1">已借阅 {book[9]} 次</div>
                                    <div className="flex gap-2 mt-4 relative z-20">
                                        <button
                                            onClick={() => router.push(`/book/${bookId}`)}
                                            className="flex-1 bg-blue-500 text-white py-1.5 rounded text-sm"
                                        >
                                            查看详情
                                        </button>
                                        <button
                                            onClick={() => handleCollect(bookId)}
                                            className="flex-1 bg-amber-500 text-white py-1.5 rounded text-sm"
                                        >
                                            {collectedIds.includes(bookId) ? "取消收藏" : "收藏"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 分页 */}
                    <div className="flex justify-center gap-4 mt-10">
                        <button
                            disabled={page <= 1 || loading}
                            onClick={() => setPage(page - 1)}
                            className="px-4 py-2 border rounded disabled:opacity-40"
                        >
                            上一页
                        </button>
                        <span className="px-4 py-2">第{page}页</span>
                        <button
                            disabled={page * 12 >= total || loading}
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