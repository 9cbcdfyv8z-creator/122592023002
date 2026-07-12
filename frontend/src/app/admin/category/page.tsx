"use client";
import { useEffect, useState, Fragment } from "react";
import axios from "axios";

type CateItem = {
    id: number;
    name: string;
    parent_id: number;
    sort: number;
    children: CateItem[];
};

export default function AdminCategoryManage() {
    const [tree, setTree] = useState<CateItem[]>([]);
    const [openModal, setOpenModal] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState({
        name: "",
        parent_id: 0,
        sort: 0
    });
    const [token, setToken] = useState<string>("");

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const t = localStorage.getItem("token") ?? "";
            setToken(t);
        }
    }, []);

    const loadTree = async () => {
        try {
            const res = await axios.get("http://127.0.0.1:5000/api/category/tree", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTree(res.data.data);
        } catch (err) {
            console.error("加载分类树失败：", err);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (token) loadTree();
    }, [token]);

    const openAdd = () => {
        setEditId(null);
        setForm({ name: "", parent_id: 0, sort: 0 });
        setOpenModal(true);
    };

    const openEdit = (row: CateItem) => {
        setEditId(row.id);
        setForm({ name: row.name, parent_id: row.parent_id, sort: row.sort });
        setOpenModal(true);
    };

    const submit = async () => {
        try {
            if (editId === null) {
                await axios.post("http://127.0.0.1:5000/api/category/add", form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.put(`http://127.0.0.1:5000/api/category/edit/${editId}`, form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setOpenModal(false);
            await loadTree();
            alert(editId ? "修改成功" : "新增分类成功");
        } catch (err) {
            console.error("提交分类出错", err);
            alert("操作失败，请重试");
        }
    };

    const delCate = async (cid: number) => {
        if (!confirm("删除后该分类下图书将无分类绑定，确认删除？")) return;
        try {
            await axios.delete(`http://127.0.0.1:5000/api/category/del/${cid}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await loadTree();
        } catch (err) {
            console.error("删除失败", err);
            alert("删除操作出错");
        }
    };

    const renderTree = (list: CateItem[], level = 0) => {
        return list.map((item) => (
            <div key={item.id} style={{ marginLeft: level * 24 }} className="my-3 flex items-center gap-4 bg-white p-4 rounded-lg card-shadow">
                <span className="font-medium text-lg">{item.name}</span>
                <span className="text-sm text-gray-500">排序：{item.sort}</span>
                <div className="flex gap-2 ml-auto">
                    <button onClick={() => openEdit(item)} className="bg-blue-400 text-white px-3 py-1 rounded text-sm">编辑</button>
                    <button onClick={() => delCate(item.id)} className="bg-red-400 text-white px-3 py-1 rounded text-sm">删除</button>
                </div>
                {item.children && item.children.length > 0 && renderTree(item.children, level + 1)}
            </div>
        ));
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">图书分类管理（树形结构）</h2>
                <button onClick={openAdd} className="bg-green-500 text-white px-4 py-2 rounded">新增分类</button>
            </div>
            <div className="bg-white rounded-xl p-6 card-shadow">
                {tree.length > 0 ? renderTree(tree) : <p className="text-gray-400">暂无分类数据，加载中...</p>}
            </div>

            {openModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-lg rounded-xl p-8">
                        <h3 className="text-xl font-bold mb-6">{editId ? "编辑分类" : "新增分类"}</h3>
                        <div className="space-y-4">
                            <div>
                                <label>分类名称</label>
                                <input className="w-full border rounded px-3 py-2 mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label>父级分类</label>
                                <select className="w-full border rounded px-3 py-2 mt-1" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: Number(e.target.value) })}>
                                    <option value={0}>顶级分类（无父级）</option>
                                    {tree.map((c) => (
                                        <Fragment key={c.id}>
                                            <option value={c.id}>{c.name}</option>
                                            {c.children.map((child) => <option key={child.id} value={child.id}>—— {child.name}</option>)}
                                        </Fragment>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>排序权重（数字越大越靠前）</label>
                                <input type="number" className="w-full border rounded px-3 py-2 mt-1" value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setOpenModal(false)} className="flex-1 border py-2 rounded">取消</button>
                            <button onClick={submit} className="flex-1 bg-blue-500 text-white py-2 rounded">确认提交</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}