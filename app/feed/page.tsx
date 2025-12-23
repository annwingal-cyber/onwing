import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-4xl font-bold text-gray-900">瓜田广场</h1>
          <p className="text-lg text-gray-600">登录后可查看你有权限看的瓜</p>
          <div className="flex justify-center gap-4">
            <Link href="/login" className="rounded-full bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition">登录</Link>
          </div>
        </div>
      </main>
    )
  }

  const { data: guas } = await supabase
    .from('guas')
    .select('id,title,summary_ai,content,created_at,visibility,person_ids,tags_ai,tags_manual')
    .order('created_at', { ascending: false })
    .limit(50)
  
  const personIds = Array.from(
    new Set(
      (guas || []).flatMap(g => (g.person_ids as string[]) || [])
    )
  ).slice(0, 200)
  const { data: persons } = personIds.length > 0
    ? await supabase.from('persons').select('id,display_name,is_discoverable').in('id', personIds)
    : { data: [] as any[] }
  const personMap = new Map<string, { id: string; display_name: string; is_discoverable: boolean }>()
  ;(persons || []).forEach(p => personMap.set(p.id as string, { id: p.id as string, display_name: p.display_name as string, is_discoverable: p.is_discoverable as boolean }))

  return (
    <main className="max-w-2xl mx-auto p-6 min-h-screen">
      <header className="mb-8 flex justify-between items-center">
        <div className="flex items-end gap-3">
          <h1 className="text-2xl font-bold text-gray-900">瓜田广场</h1>
          <nav className="text-sm">
            <Link href="/me" className="text-gray-600 hover:text-gray-900">只看我的</Link>
          </nav>
        </div>
        <form action="/auth/signout" method="post">
          <button className="text-sm text-gray-600 hover:text-gray-900">退出登录</button>
        </form>
      </header>

      <section className="space-y-4">
        {(guas || []).map((gua) => {
          const chips = ((gua.person_ids as string[]) || []).map(pid => personMap.get(pid)).filter(Boolean)
          const tags = ((gua.tags_ai as string[]) || []).concat((gua.tags_manual as string[]) || [])
          const title = (gua.title as string) || (gua.summary_ai as string) || '无标题'
          return (
          <div key={gua.id as string} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{new Date(gua.created_at as string).toLocaleString()}</span>
            </div>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{(gua.summary_ai as string) || (gua.content as string)?.slice(0, 60)}</p>
            <div className="flex gap-2">
              {tags.slice(0,6).map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{tag}</span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.map(c => (
                <Link key={c!.id} href={`/person/${c!.id}`} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">
                  {c!.display_name}
                </Link>
              ))}
            </div>
          </div>
        )})}

        {(!guas || guas.length === 0) && (
          <div className="mt-8 p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800">
            <p>暂无数据。请先在“记瓜”页面发布一条瓜。</p>
          </div>
        )}
      </section>

      <div className="fixed bottom-6 right-6">
        <Link href="/compose" className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition">
          + 记瓜
        </Link>
      </div>
    </main>
  )
}
