"use client";
import axios from "axios";
import { useEffect, useState } from "react";

type BookItem = {
    id: number;
    name: string;
    author: string;
};

export default function BookManagePage() {
    const [bookList, setBookList] = useState<BookItem[]>([]);
    const [newBookName, setNewBookName] = useState("");
    const [newAuthor, setNewAuthor] = useState("");

    const fetchBookData = async () => {
        const res = await axios.get("http://127.0.0.1:5000/api/book");
        setBookList(res.data.data);
    };

    useEffect(() => {
        fetchBookData();
    }, []);

    const submitAddBook = async () => {
        if (!newBookName || !newAuthor) {
            alert("图书名称和作者不能为空");
            return;
        }
        await axios.post("http://127.0.0.1:5000/api/book", {
            name: newBookName,
            author: newAuthor,
        });
        setNewBookName("");
        setNewAuthor("");
        fetchBookData();
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 p-4">
            <h2 className="text-xl mb-5 text-center">图书管理面板</h2>
            <div className="border p-4 rounded mb-6">
                <h3 className="mb-3">新增图书</h3>
                <div className="flex gap-3 mb-3">
                    <input
                        className="border p-2 flex-1"
                        placeholder="输入图书名称"
                        value={newBookName}
                        onChange={(e) => setNewBookName(e.target.value)}
                    />
                    <input
                        className="border p-2 flex-1"
                        placeholder="输入作者姓名"
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                    />
                </div>
                <button
                    onClick={submitAddBook}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                >
                    添加图书
                </button>
            </div>
            <h3 className="mb-3">全部图书列表</h3>
            <table className="w-full border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-2">编号ID</th>
                        <th className="border p-2">图书名称</th>
                        <th className="border p-2">作者</th>
                    </tr>
                </thead>
                <tbody>
                    {bookList.map((bk) => (
                        <tr key={bk.id}>
                            <td className="border p-2 text-center">{bk.id}</td>
                            <td className="border p-2 text-center">{bk.name}</td>
                            <td className="border p-2 text-center">{bk.author}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}