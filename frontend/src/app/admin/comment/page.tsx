"use client";
import { useEffect, useState } from "react";
import axios from "axios";

type CommentItem = any;
export default function AdminCommentManage() {
    // 统一项目惰性读取token，解决localStorage SSR报错
    const [token] = useState<string>(() => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem("token") || "";
    });
    const [commentList, setCommentList] = useState<CommentItem[]>([]);

    const loadComment = async () => {
        if (!token) return;
        const res = await axios.get("http://127.0.0.1:5000/api/admin/comment/list", {
            headers: { Authorization: `Bearer ${token}` }
        });
        setCommentList(res.data.data);
    };

    useEffect(() => {
        (async () => {
            await loadComment();
        })();
    }, [token]);

    // 管理员删除评论
    const delComment = async (cid: number) => {
        if (!confirm("确定删除该评论？")) return;
        await axios.delete(`http://127.0.0.1:5000/api/admin/comment/del/${cid}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        loadComment();
        alert("删除成功");
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">全平台评论管理</h2>
            <div className="bg-white rounded-xl p-6 card-shadow">
                <table className="w-full border-collapse w-full">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="border p-3">评论ID</th>
                            <th className="border p-3">用户</th>
                            <th className="border p-3">所属图书</th>
                            <th className="border p-3">评分</th>
                            <th className="border p-3">评论内容</th>
                            <th className="border p-3">发布时间</th>
                            <th className="border p-3">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {commentList.map(item => (
                            <tr key={item[0]}>
                                <td className="border p-3 text-center">{item[0]}</td>
                                {/* 用户 = item[7] u.username */}
                                <td className="border p-3 text-center">{item[7]}</td>
                                {/* 所属图书 = item[8] b.name */}
                                <td className="border p-3 text-center">{item[8]}</td>
                                {/* 评分 = item[4] c.score */}
                                <td className="border p-3 text-center">{"★".repeat(item[4])}</td>
                                {/* 评论内容 = item[3] c.content */}
                                <td className="border p-3 max-w-xs">{item[3]}</td>
                                {/* 发布时间 = item[5] c.create_time */}
                                <td className="border p-3 text-center">{item[5]}</td>
                                <td className="border p-3 text-center">
                                    <button onClick={() => delComment(item[0])} className="bg-red-400 text-white px-3 py-1 rounded text-sm">删除评论</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {commentList.length === 0 && <p className="text-center py-10 text-gray-400">暂无用户评论</p>}
            </div>
        </div>
    );
}