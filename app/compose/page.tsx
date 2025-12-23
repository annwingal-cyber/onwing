import Link from 'next/link'
import ComposeForm from '@/components/ComposeForm'
import { createClient } from '@/utils/supabase/server'

export default async function ComposePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let persons: { id: string; display_name: string; aliases?: string[] }[] = []
  if (user) {
    const { data } = await supabase
      .from('persons')
      .select('id,display_name,aliases')
      .eq('owner_user_id', user.id)
      .limit(200)
    persons = data || []
  }
  return (
    <main className="max-w-2xl mx-auto p-6 min-h-screen">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">记瓜</h1>
        <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">返回</Link>
      </header>
      <ComposeForm persons={persons} />
    </main>
  )
}
