'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createGua(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=未登录')
  }

  const title = (formData.get('title') as string) || null
  const content = (formData.get('content') as string) || ''
  const visibility = (formData.get('visibility') as string) as 'private'|'public'|'custom'
  const personIdsJson = (formData.get('person_ids') as string) || '[]'
  const tagsJson = (formData.get('tags_manual') as string) || '[]'
  let personIds: string[] = []
  let tagsManual: string[] = []
  try {
    personIds = JSON.parse(personIdsJson)
  } catch {}
  try {
    tagsManual = JSON.parse(tagsJson)
  } catch {}

  if (!content.trim()) {
    redirect('/compose?error=正文不能为空')
  }
  if (!personIds.length) {
    redirect('/compose?error=至少选择一个瓜主')
  }

  const { data: inserted, error } = await supabase
    .from('guas')
    .insert({
      author_user_id: user.id,
      title,
      content,
      tags_manual: tagsManual,
      person_ids: personIds,
      visibility,
      allowed_user_ids: [],
      media_urls: []
    })
    .select('id')
    .single()

  if (error) {
    redirect(`/compose?error=${encodeURIComponent(error.message)}`)
  }

  if (inserted?.id) {
    await supabase
      .from('ai_jobs')
      .insert({
        gua_id: inserted.id,
        status: 'pending',
        result_json: null
      })
  }

  revalidatePath('/feed')
  redirect('/feed?message=发布成功，AI归档处理中…')
}
