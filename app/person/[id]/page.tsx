import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { analyzeTimeline, type TimelineItem } from '@/lib/ai'

export default async function PersonPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: person } = await supabase
    .from('persons')
    .select('id,display_name,aliases,is_discoverable')
    .eq('id', params.id)
    .single()

  const { data: guas } = await supabase
    .from('guas')
    .select('id,title,content,created_at,summary_ai,tags_ai,tags_manual')
    .contains('person_ids', [params.id])
    .order('created_at', { ascending: false })
    .limit(200)

  const items: TimelineItem[] = (guas || []).map(g => ({
    id: g.id as string,
    title: (g.title as string) || (g.summary_ai as string) || '无标题',
    content: g.content as string,
    date: g.created_at as string
  }))

  const analysis = await analyzeTimeline(items)

  return (
    <main className="max-w-2xl mx-auto p-6 min-h-screen">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{person?.display_name || '未知瓜主'}</h1>
          <p className="text-sm text-gray-600">相关瓜数量：{guas?.length || 0}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/feed" className="text-sm text-gray-600 hover:text-gray-900">广场</Link>
          <Link href="/me" className="text-sm text-gray-600 hover:text-gray-900">我的</Link>
        </div>
      </header>

      <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-semibold text-lg mb-3">AI 脉络梳理</h2>
        <pre className="whitespace-pre-wrap text-sm text-gray-800">{analysis}</pre>
      </section>

      <section className="space-y-4">
        {(guas || []).map(g => (
          <div key={g.id as string} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg text-gray-800">{(g.title as string) || (g.summary_ai as string) || '无标题'}</h3>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{new Date(g.created_at as string).toLocaleString()}</span>
            </div>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{g.content as string}</p>
            <div className="flex gap-2">
              {((g.tags_ai as string[]) || []).concat((g.tags_manual as string[]) || []).slice(0,6).map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{tag}</span>
              ))}
            </div>
          </div>
        ))}

        {(!guas || guas.length === 0) && (
          <div className="p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800">
            暂无相关瓜。
          </div>
        )}
      </section>
    </main>
  )
}
