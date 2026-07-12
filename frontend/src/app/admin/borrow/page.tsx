"use client";
import { useEffect, useState } from "react";
import axios from "axios";

type BorrowItem = any;
export default function AdminBorrowAudit() {
    const token = localStorage.getItem("token");
    const [filterType, setFilterType] = useState("all");
    const [borrowList, setBorrowList] = useState<BorrowItem[]>([]);

    const loadBorrow = async () => {
        const res = await axios.get(`http://127.0.0.1:5000/api/admin/borrow/list?filter=${filterType}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setBorrowList(res.data.data);
    };

    useEffect(() => {
        loadBorrow();
    }, [filterType]);

    // 审批通过/驳回
    const auditOperate = async (borrowId: number, status: number) => {
        await axios.put(`http://127.0.0.1:5000/api/admin/borrow/audit/${borrowId}`, { status }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        loadBorrow();
        alert(status === 1 ? "审批通过" : "已驳回申请");
    };

    const statusMap = {
        0: "待审批",
        1: "借阅中",
        2: "已驳回",
        3: "已归还",
        4: "逾期未还"
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">借阅申请审批管理</h2>
                <div className="flex gap-3">
                    <button onClick={() => setFilterType("all")} className={`px-4 py-2 rounded ${filterType === "all" ? "bg-blue-500 text-white" : "border"}`}>全部记录</button>
                    <button onClick={() => setFilterType("overdue")} className={`px-4 py-2 rounded ${filterType === "overdue" ? "bg-blue-500 text-white" : "border"}`}>逾期未还</button>
                    <button onClick={() => setFilterType("soon")} className={`px-4 py-2 rounded ${filterType === "soon" ? "bg-blue-500 text-white" : "border"}`}>即将到期(3天内)</button>
                </div>
            </div>

            <div className="bg-white rounded-xl p-6 card-shadow">
                <table className="w-full border-collapse">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="border p-3">借阅ID</th>
                            <th className="border p-3">用户</th>
                            <th className="border p-3">图书</th>
                            <th className="border p-3">申请日期</th>
                            <th className="border p-3">应还日期</th>
                            <th className="border p-3">归还日期</th>
                            <th className="border p-3">状态</th>
                            <th className="border p-3">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {borrowList.map(item => (
                            <tr key={item[0]}>
                                <td className="border p-3 text-center">{item[0]}</td>
                                <td className="border p-3 text-center">{item[9]}</td>
                                <td className="border p-3 text-center">{item[10]}</td>
                                <td className="border p-3 text-center">{item[3]}</td>
                                <td className="border p-3 text-center">{item[6]}</td>
                                <td className="border p-3 text-center">{item[7] || "-"}</td>
                                <td className="border p-3 text-center">{statusMap[item[8]]}</td>
                                <td className="border p-3 text-center flex gap-2 justify-center">
                                    {item[8] === 0 && (
                                        <>
                                            <button onClick={() => auditOperate(item[0], 1)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">通过</button>
                                            <button onClick={() => auditOperate(item[0], 2)} className="bg-red-400 text-white px-3 py-1 rounded text-sm">驳回</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {borrowList.length === 0 && <p className="text-center py-10 text-gray-400">暂无数据</p>}
            </div>
        </div>
    );
}