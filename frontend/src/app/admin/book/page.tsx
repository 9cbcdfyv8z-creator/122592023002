"use client";
import { useEffect, useState } from "react";
import axios from "axios";

type BookItem = any;
type CateItem = any;
export default function AdminBookManage() {
    const [token, setToken] = useState<string>("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (typeof window !== "undefined") {
            setToken(localStorage.getItem("token") ?? "");
        }
    }, []);

    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [total, setTotal] = useState(0);
    const [bookList, setBookList] = useState<BookItem[]>([]);
    const [cateList, setCateList] = useState<CateItem[]>([]);
    const [openModal, setOpenModal] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState({
        name: "",
        author: "",
        category_id: "",
        publisher: "",
        stock: 10,
        cover_url: "",
        desc: "",
        publishing_time: "",
        status: 1
    });

    // 加载分类
    const loadCate = async () => {
        const res = await axios.get("http://127.0.0.1:5000/api/category/tree");
        setCateList(res.data.data);
    };

    // 加载图书列表
    const loadBooks = async () => {
        const res = await axios.get(`http://127.0.0.1:5000/api/book/list?page=${page}&size=${size}`);
        setBookList(res.data.data.list);
        setTotal(res.data.data.total);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        loadCate();
        loadBooks();
    }, [page]);

    // 打开新增弹窗
    const openAdd = () => {
        setEditId(null);
        setForm({
            name: "",
            author: "",
            category_id: "",
            publisher: "",
            stock: 10,
            cover_url: "",
            desc: "",
            publishing_time: "",
            status: 1
        });
        setOpenModal(true);
    };

    // 打开编辑弹窗（后端数组格式，保留row下标读取）
    const openEdit = (row: any) => {
        setEditId(row[0]);
        setForm({
            name: row[1],
            author: row[2],
            category_id: row[3] || "",
            publisher: row[4] || "",
            stock: row[5],
            cover_url: row[6] || "",
            desc: row[7] || "",
            publishing_time: row[11] || "",
            status: row[12]
        });
        setOpenModal(true);
    };

    // 提交新增/编辑
    const submitForm = async () => {
        if (!token) {
            alert("登录失效，请刷新页面重新登录！");
            return;
        }
        if (editId === null) {
            await axios.post("http://127.0.0.1:5000/api/admin/book/add", form, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } else {
            await axios.put(`http://127.0.0.1:5000/api/admin/book/edit/${editId}`, form, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
        setOpenModal(false);
        loadBooks();
        alert(editId ? "修改成功" : "新增图书成功");
    };

    // 删除图书
    const delBook = async (bid: number) => {
        if (!confirm("确定删除这本图书？")) return;
        await axios.delete(`http://127.0.0.1:5000/api/admin/book/del/${bid}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        loadBooks();
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">图书管理</h2>
            <div className="bg-white rounded-xl p-6 card-shadow mb-6 flex justify-between items-center">
                <p>图书总数：{total}</p>
                <button onClick={openAdd} className="bg-green-500 text-white px-4 py-2 rounded">新增图书</button>
            </div>

            <div className="bg-white rounded-xl p-6 card-shadow">
                <table className="w-full border-collapse">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="border p-3">ID</th>
                            <th className="border p-3">书名</th>
                            <th className="border p-3">作者</th>
                            <th className="border p-3">分类ID</th>
                            <th className="border p-3">库存</th>
                            <th className="border p-3">借阅次数</th>
                            <th className="border p-3">状态</th>
                            <th className="border p-3">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookList.map(row => (
                            <tr key={row[0]}>
                                <td className="border p-3 text-center">{row[0]}</td>
                                <td className="border p-3 text-center">{row[1]}</td>
                                <td className="border p-3 text-center">{row[2]}</td>
                                <td className="border p-3 text-center">{row[3] || "无"}</td>
                                <td className="border p-3 text-center">{row[5]}</td>
                                <td className="border p-3 text-center">{row[9]}</td>
                                <td className="border p-3 text-center">{row[12] === 1 ? "上架" : "下架"}</td>
                                <td className="border p-3 text-center flex gap-2 justify-center">
                                    <button onClick={() => openEdit(row)} className="bg-blue-400 text-white px-3 py-1 rounded text-sm">编辑</button>
                                    <button onClick={() => delBook(row[0])} className="bg-red-400 text-white px-3 py-1 rounded text-sm">删除</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex justify-center gap-4 mt-6">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 border rounded disabled:opacity-40">上一页</button>
                    <span>第{page}页</span>
                    <button disabled={page * size >= total} onClick={() => setPage(page + 1)} className="px-4 py-2 border rounded disabled:opacity-40">下一页</button>
                </div>
            </div>

            {/* 新增/编辑弹窗 */}
            {openModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto py-10">
                    <div className="bg-white w-full max-w-2xl rounded-xl p-8">
                        <h3 className="text-xl font-bold mb-6">{editId ? "编辑图书" : "新增图书"}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label>图书名称</label>
                                <input className="w-full border rounded px-3 py-2 mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label>作者</label>
                                <input className="w-full border rounded px-3 py-2 mt-1" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
                            </div>
                            <div>
                                <label>分类</label>
                                <select className="w-full border rounded px-3 py-2 mt-1" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                                    <option value="">无分类</option>
                                    {cateList.map(c => (
                                        <optgroup key={c.id} label={c.name}>
                                            <option value={c.id}>{c.name}</option>
                                            {c.children.map(child => <option key={child.id} value={child.id}>{child.name}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>出版社</label>
                                <input className="w-full border rounded px-3 py-2 mt-1" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
                            </div>
                            <div>
                                <label>库存数量</label>
                                <input type="number" className="w-full border rounded px-3 py-2 mt-1" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label>出版日期</label>
                                <input type="date" className="w-full border rounded px-3 py-2 mt-1" value={form.publishing_time} onChange={(e) => setForm({ ...form, publishing_time: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <label>封面图片链接（格式示例：/book-covers/1.jpg）</label>
                                <input className="w-full border rounded px-3 py-2 mt-1" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="/book-covers/数字.jpg" />
                            </div>
                            <div className="col-span-2">
                                <label>图书简介</label>
                                <textarea className="w-full border rounded px-3 py-2 mt-1 h-20" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
                            </div>
                            <div>
                                <label>状态</label>
                                <select className="w-full border rounded px-3 py-2 mt-1" value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}>
                                    <option value={1}>上架</option>
                                    <option value={0}>下架</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setOpenModal(false)} className="flex-1 border py-2 rounded">取消</button>
                            <button onClick={submitForm} className="flex-1 bg-blue-500 text-white py-2 rounded">确认提交</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}