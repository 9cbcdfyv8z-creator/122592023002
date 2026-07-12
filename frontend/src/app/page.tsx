import Link from "next/link";

export default function Home() {
    return (
        <div className="text-center mt-20">
            <h1 className="text-2xl mb-4">图书管理系统</h1>
            <Link className="text-blue-600 underline text-lg" href="/login">
                前往登录页面
            </Link>
        </div>
    );
}
