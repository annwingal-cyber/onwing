import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
      return (
         <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
            <div className="text-center space-y-6 max-w-md">
                <h1 className="text-4xl font-bold text-gray-900">欢迎来到 🍉 瓜田笔记</h1>
                <p className="text-lg text-gray-600">
                    专业的吃瓜与记瓜工具。
                    <br />
                    AI 自动归档，权限精细控制，不再错过每一个瓜。
                </p>
                <div className="flex justify-center gap-4">
                     <Link 
                        href="/login"
                        className="rounded-full bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition"
                    >
                        开始吃瓜
                    </Link>
                </div>
            </div>
         </main>
      )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold text-gray-900">欢迎回来</h1>
        <p className="text-lg text-gray-600">请选择入口</p>
        <div className="flex justify-center gap-4">
          <Link href="/feed" className="rounded-full bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition">瓜田广场</Link>
          <Link href="/me" className="rounded-full bg-gray-900 px-6 py-3 text-white font-medium hover:bg-black transition">个人吃瓜</Link>
        </div>
      </div>
    </main>
  )
}
