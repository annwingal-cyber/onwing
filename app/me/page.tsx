import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-4xl font-bold text-gray-900">个人吃瓜</h1>
          <p className="text-lg text-gray-600">登录后查看你发布的或可见的瓜</p>
          <div className="flex justify-center gap-4">
            <Link href="/login" className="rounded-full bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition">登录</Link>
          </div>
        </div>
      </main>
    )
  }

  const mockGuas = [
    { id: 3, title: '我发布的：团队冲突复盘', summary: '一次会议中的分歧与后续解决方案…', time: '1天前', tags: ['复盘', '团队'] },
  ]

  return (
    <main className="max-w-2xl mx-auto p-6 min-h-screen">
      <header className="mb-8 flex justify-between items-center">
        <div className="flex items-end gap-3">
          <h1 className="text-2xl font-bold text-gray-900">个人吃瓜</h1>
          <nav className="text-sm">
            <Link href="/feed" className="text-gray-600 hover:text-gray-900">返回广场</Link>
          </nav>
        </div>
        <form action="/auth/signout" method="post">
          <button className="text-sm text-gray-600 hover:text-gray-900">退出登录</button>
        </form>
      </header>

      <section className="space-y-4">
        {mockGuas.map((gua) => (
          <div key={gua.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg text-gray-800">{gua.title}</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{gua.time}</span>
            </div>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{gua.summary}</p>
            <div className="flex gap-2">
              {['复盘','团队'].map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{tag}</span>
              ))}
            </div>
          </div>
        ))}
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800">
          <p>此页面将展示你的个人可见与发布的瓜。接通数据库后自动加载。</p>
        </div>
      </section>
    </main>
  )
}
