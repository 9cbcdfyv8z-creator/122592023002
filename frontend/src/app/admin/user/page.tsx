"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminUserPage() {
    const [list, setList] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [keyword, setKeyword] = useState("");
    const [total, setTotal] = useState(0);

    // 编辑弹窗状态
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        id: 0,
        nickname: "",
        role: "user",
        status: 1
    });

    const [token] = useState<string>(() => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem("token") || "";
    });

    // 加载用户列表
    const fetchUserData = async () => {
        try {
            const tokenVal = localStorage.getItem("token");
            const res = await axios.get("http://127.0.0.1:5000/api/admin/user/list", {
                params: { page, size: pageSize, keyword },
                headers: { Authorization: `Bearer ${tokenVal}` }
            });
            setList(res.data.data.list);
            setTotal(res.data.data.total);
        } catch (e) {
            alert("获取用户列表失败，请检查管理员token");
        }
    };

    // 提交编辑用户
    const submitEdit = async () => {
        const tokenVal = localStorage.getItem("token");
        try {
            await axios.put(`http://127.0.0.1:5000/api/admin/user/edit/${editForm.id}`, editForm, {
                headers: { Authorization: `Bearer ${tokenVal}` }
            });
            alert("修改用户成功");
            setEditOpen(false);
            fetchUserData();
        } catch (err) {
            alert("修改失败");
            console.error(err);
        }
    };

    // 单行删除用户
    const handleDelete = async (uid: number) => {
        const tokenVal = localStorage.getItem("token");
        if (!confirm("确定删除该用户，删除后数据无法恢复？")) return;
        try {
            const res = await axios.delete(`http://127.0.0.1:5000/api/admin/user/del/${uid}`, {
                headers: { Authorization: `Bearer ${tokenVal}` }
            });
            alert("删除成功");
            fetchUserData();
        } catch (err: any) {
            if (err.response?.data?.msg) {
                alert(err.response.data.msg);
            } else {
                alert("请求失败，请检查后端服务与跨域配置");
            }
        }
    };

    // 编辑弹窗回填数据
    const handleEdit = (uid: number) => {
        const target = list.find(item => Number(item[0]) === uid);
        if (!target) return;
        setEditForm({
            id: Number(target[0]),
            nickname: target[3] ?? "",
            role: target[6],
            status: Number(target[7])
        });
        setEditOpen(true);
    };

    // 搜索触发
    const handleSearch = () => {
        setPage(1);
        setTimeout(() => fetchUserData(), 0);
    };

    useEffect(() => {
        fetchUserData();
    }, [page, keyword]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold mb-6">用户管理</h1>

            {/* 搜索栏 */}
            <div className="flex gap-3 mb-6 items-center">
                <input
                    className="border px-3 py-2 rounded flex-1 max-w-xs"
                    placeholder="搜索用户名"
                    value={keyword}
                    onChange={(ev) => setKeyword(ev.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button onClick={handleSearch} className="px-5 py-2 bg-blue-500 text-white rounded">搜索</button>
            </div>

            {/* 用户表格 */}
            <table className="w-full border-collapse border shadow-sm bg-white">
                <thead>
                    <tr className="bg-gray-100">
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
                            <td className="border p-3 text-center">{item[0]}</td>
                            <td className="border p-3 text-center">{item[1]}</td>
                            <td className="border p-3 text-center">{item[3] ?? "-"}</td>
                            <td className="border p-3 text-center">{item[6] === "admin" ? "管理员" : "普通用户"}</td>
                            <td className="border p-3 text-center">{item[7] === 1 ? "正常" : "封禁"}</td>
                            <td className="border p-3 text-center flex gap-2 justify-center">
                                <button
                                    onClick={() => handleEdit(Number(item[0]))}
                                    className="px-3 py-1 bg-blue-500 text-white rounded mr-2"
                                >
                                    编辑
                                </button>
                                
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

            {/* 编辑弹窗 */}
            {editOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-xl font-bold mb-4">编辑用户</h3>
                        <div className="mb-3">
                            <label className="block mb-1">昵称</label>
                            <input
                                className="border w-full mt-1 px-3 py-2 rounded"
                                value={editForm.nickname}
                                onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block mb-1">角色</label>
                            <select
                                className="border w-full mt-1 px-3 py-2 rounded"
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                            >
                                <option value="user">普通用户</option>
                                <option value="admin">管理员</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block mb-1">账号状态</label>
                            <select
                                className="border w-full mt-1 px-3 py-2 rounded"
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: Number(e.target.value) })}
                            >
                                <option value={1}>正常</option>
                                <option value={0}>封禁</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setEditOpen(false)} className="px-4 py-2 border rounded">取消</button>
                            <button onClick={submitEdit} className="px-4 py-2 bg-blue-500 text-white rounded">保存修改</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}