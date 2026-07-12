"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [token, setToken] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);

  // 返回上一页通用按钮
  const goBack = () => router.back();

  useEffect(() => {
    const t = localStorage.getItem("token") || "";
    setToken(t);
    if (t) {
      axios.get("http://127.0.0.1:5000/api/user/profile", {
        headers: { Authorization: `Bearer ${t}` }
      }).then(res => setUserInfo(res.data.data));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    router.push("/login");
  };

  return (
    <html lang="zh-CN">
      <body className="bg-slate-50 min-h-screen">
        {/* 全局顶部导航栏 */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 返回按钮 所有页面通用 */}
              {path !== "/" && (
                <button
                  onClick={goBack}
                  className="px-3 py-1 border rounded hover:bg-blue-50 text-blue-600"
                >
                  ← 返回
                </button>
              )}
              <Link href="/" className="text-xl font-bold text-blue-600">
                📖 图书借阅管理系统
              </Link>
              <nav className="flex gap-5 ml-8">
                <Link href="/" className={path === "/" ? "text-blue-600 font-medium" : "text-gray-600"}>首页</Link>
                <Link href="/book" className={path.startsWith("/book") ? "text-blue-600 font-medium" : "text-gray-600"}>图书浏览</Link>
                {token && <Link href="/profile" className={path.startsWith("/profile") ? "text-blue-600 font-medium" : "text-gray-600"}>个人中心</Link>}
                {userInfo?.[5] === "admin" && <Link href="/admin" className={path.startsWith("/admin") ? "text-blue-600 font-medium" : "text-gray-600"}>管理后台</Link>}
              </nav>
            </div>
            <div>
              {token ? (
                <div className="flex items-center gap-4">
                  <span>你好，{userInfo?.[2] || userInfo?.[1]}</span>
                  <button onClick={logout} className="text-red-500">退出登录</button>
                </div>
              ) : (
                <Link href="/login" className="bg-blue-500 text-white px-4 py-1.5 rounded">登录</Link>
              )}
            </div>
          </div>
        </header>
        {/* 页面主体内容 */}
        <main className="max-w-7xl mx-auto p-4 mt-4">{children}</main>
      </body>
    </html>
  );
}