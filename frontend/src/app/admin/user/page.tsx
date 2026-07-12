"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminUserPage() {
    // 正式定义list以及配套分页状态，解决未定义报错
    const [list, setList] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [keyword, setKeyword] = useState("");
    const [total, setTotal] = useState(0);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://127.0.0.1:5000/api/admin/user/list", {
                params: { page, size: pageSize, keyword },
                headers: { Authorization: `Bearer ${token}` }
            });
            setList(res.data.data.list);
            setTotal(res.data.data.total);
        } catch (e) {
            alert("获取用户列表失败，请检查管理员token");
        }
    };

    // 初次加载、分页/关键词变动时刷新列表
    useEffect(() => {
        fetchUserData();
    }, [page, keyword]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold mb-6">用户管理</h1>

            {/* 搜索栏 */}
            <div className="flex gap-3 mb-6">
                <input
                    className="border px-3 py-2 rounded flex-1 max-w-xs"
                    placeholder="搜索用户名"
                    value={keyword}
                    onChange={(ev) => setKeyword(ev.target.value)}
                />
                <button onClick={() => setPage(1)} className="px-5 py-2 bg-blue-500 text-white rounded">搜索</button>
                <button className="px-5 py-2 bg-green-500 text-white rounded ml-auto">新增用户</button>
                <button className="px-5 py-2 bg-red-500 text-white rounded">批量删除选中</button>
            </div>

            {/* 用户表格 */}
            <table className="w-full border-collapse border shadow-sm bg-white">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-3">勾选</th>
                        <th className="border p-3">ID</th>
                        <th className="border p-3">用户名</th>
                        <th className="border p-3">昵称</th>
                        <th className="border p-3">角色</th>
                        <th className="border p-3">状态</th>
                        <th className="border p-3">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {list.map((item) => (
                        <tr key={item[0]}>
                            <td className="border p-3 text-center"><input type="checkbox" /></td>
                            <td className="border p-3 text-center">{item[0]}</td>
                            <td className="border p-3 text-center">{item[1]}</td>
                            <td className="border p-3 text-center">{item[3] ?? "-"}</td>
                            <td className="border p-3 text-center">{item[6] === "admin" ? "管理员" : "普通用户"}</td>
                            <td className="border p-3 text-center">{item[7] === 1 ? "正常" : "封禁"}</td>
                            <td className="border p-3 text-center gap-2 flex justify-center">
                                <button className="px-3 py-1 bg-blue-500 text-white rounded mr-2">编辑</button>
                                <button className="px-3 py-1 bg-red-500 text-white rounded">删除</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 分页控件 */}
            <div className="flex justify-center items-center gap-4 mt-5">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 border rounded disabled:opacity-40">上一页</button>
                <span>第{page}页 / 共{Math.ceil(total / pageSize) || 1}页</span>
                <button disabled={page * pageSize >= total} onClick={() => setPage(page + 1)} className="px-4 py-2 border rounded disabled:opacity-40">下一页</button>
            </div>
        </div>
    );
}