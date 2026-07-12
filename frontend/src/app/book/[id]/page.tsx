"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

type Book = any;
type Comment = any;

export default function BookDetail() {
    const { id } = useParams();
    const bid = Number(id);
    // 修复SSR报错，客户端挂载后再获取token
    const [token, setToken] = useState<string>("");
    const [book, setBook] = useState<Book>(null);
    const [commentList, setCommentList] = useState<Comment[]>([]);
    const [borrowDays, setBorrowDays] = useState(14);
    const [commentText, setCommentText] = useState("");
    const [commentScore, setCommentScore] = useState(5);
    const [isCollected, setIsCollected] = useState(false);

    // 客户端初始化token
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (typeof window !== "undefined") {
            setToken(localStorage.getItem("token") ?? "");
        }
    }, []);

    // 加载图书详情
    const loadDetail = async () => {
        const res = await axios.get(`http://127.0.0.1:5000/api/book/${bid}`);
        setBook(res.data.data);
        // 判断收藏状态
        if (token) {
            const collectRes = await axios.get(`http://127.0.0.1:5000/api/collect/check/${bid}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsCollected(collectRes.data.data);
        }
        // 加载评论
        const cmtRes = await axios.get(`http://127.0.0.1:5000/api/book/comment/${bid}`);
        setCommentList(cmtRes.data.data);
    };

    useEffect(() => {
        if (bid && token) loadDetail();
    }, [bid, token]);

    // 借阅申请
    const applyBorrow = async () => {
        if (!token) return alert("请先登录");
        try {
            await axios.post(`http://127.0.0.1:5000/api/borrow/apply/${bid}`, { days: borrowDays }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("借阅申请提交成功，等待管理员审核");
        } catch (err) {
            alert("提交失败，请检查库存或重新登录");
        }
    };

    // 收藏/取消收藏
    const toggleCollect = async () => {
        if (!token) return alert("请先登录");
        try {
            if (isCollected) {
                await axios.delete(`http://127.0.0.1:5000/api/collect/cancel/${bid}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIsCollected(false);
                alert("已取消收藏");
            } else {
                await axios.post(`http://127.0.0.1:5000/api/collect/add/${bid}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIsCollected(true);
                alert("收藏成功");
            }
        } catch (err) {
            alert("收藏操作失败");
        }
    };

    // 发表评论
    const submitComment = async () => {
        if (!token) return alert("请先登录");
        if (!commentText.trim()) return alert("评论内容不能为空");
        try {
            await axios.post(`http://127.0.0.1:5000/api/comment/add/${bid}`, {
                content: commentText,
                score: commentScore
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCommentText("");
            loadDetail();
        } catch (err) {
            alert("发布评论失败");
        }
    };

    if (!book) return <div className="text-center py-20">加载中...</div>;

    return (
        <div>
            {/* 图书详情区块 */}
            <div className="bg-white rounded-xl p-8 card-shadow flex gap-10 mb-10">
                {/* 修复封面：替换静态📖，读取book[6] cover_url渲染图片 */}
                <div className="w-1/4 h-80 bg-slate-100 rounded overflow-hidden shrink-0">
                    <img
                        src={book[6]}
                        alt={book[1]}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            // 图片加载失败兜底书本图标
                            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-8xl">📖</div>`;
                        }}
                    />
                </div>
                <div className="w-3/4">
                    <h2 className="text-3xl font-bold mb-3">{book[1]}</h2>
                    <div className="grid grid-cols-2 gap-3 my-4 text-gray-600">
                        <p>作者：{book[2]}</p>
                        <p>出版社：{book[4] || "无"}</p>
                        <p>分类ID：{book[3]}</p>
                        <p>库存：{book[5]}本</p>
                        <p>综合评分：{book[7]}</p>
                        <p>借阅次数：{book[9]}</p>
                    </div>
                    <div className="my-6 p-4 bg-amber-50 rounded-lg text-sm text-amber-800">
                        <h4 className="font-bold mb-2">借阅须知</h4>
                        <p>1. 借阅申请提交后等待管理员审核；</p>
                        <p>2. 请在到期日前归还，逾期将影响借阅权限；</p>
                        <p>3. 损坏图书需照价赔偿。</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div>
                            <span>借阅天数：</span>
                            <select
                                value={borrowDays}
                                onChange={(e) => setBorrowDays(Number(e.target.value))}
                                className="border px-3 py-1.5 rounded"
                            >
                                <option value={7}>7天</option>
                                <option value={14}>14天</option>
                                <option value={30}>30天</option>
                            </select>
                        </div>
                        <button
                            onClick={applyBorrow}
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg"
                        >
                            提交借阅申请
                        </button>
                        <button
                            onClick={toggleCollect}
                            className={`px-6 py-2 rounded-lg ${isCollected ? "bg-red-400 text-white" : "bg-amber-400 text-white"}`}
                        >
                            {isCollected ? "取消收藏" : "收藏本书"}
                        </button>
                    </div>
                </div>
            </div>

            {/* 评论区域 */}
            <div className="bg-white rounded-xl p-8 card-shadow mb-10">
                <h3 className="text-xl font-bold mb-6">图书评论</h3>
                {/* 发表评论 */}
                <div className="mb-8 border-b pb-6">
                    <div className="flex gap-3 mb-4">
                        <span>评分：</span>
                        {[1, 2, 3, 4, 5].map(s => (
                            <span
                                key={s}
                                onClick={() => setCommentScore(s)}
                                className={`text-2xl cursor-pointer ${s <= commentScore ? "text-amber-400" : "text-gray-300"}`}
                            >★</span>
                        ))}
                    </div>
                    <textarea
                        className="w-full border rounded p-4 h-24 mb-4 outline-blue-400"
                        placeholder="写下你的读后感..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button
                        onClick={submitComment}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg"
                    >
                        发布评论
                    </button>
                </div>
                {/* 评论列表 */}
                {commentList.length === 0 ? (
                    <p className="text-gray-400 text-center">暂无评论</p>
                ) : (
                    commentList.map((cmt) => (
                        <div key={cmt[0]} className="border-b py-4">
                            <div className="flex justify-between mb-2">
                                <span className="font-medium">{cmt[5]}</span>
                                <span className="text-amber-400">{"★".repeat(cmt[4])}</span>
                            </div>
                            <p className="text-gray-700">{cmt[3]}</p>
                            <p className="text-xs text-gray-400 mt-2">{cmt[5]}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}