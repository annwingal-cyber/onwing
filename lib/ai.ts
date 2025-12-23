export type TimelineItem = { id: string; title: string; content: string; date: string }

export async function analyzeTimeline(input: TimelineItem[]): Promise<string> {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    const items = input
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((i, idx) => `${idx + 1}. ${i.date.slice(0,10)} - ${i.title}`)
      .join('\n')
    return `未配置 AI。以下为按时间排序的事件概览：\n${items}`
  }
  const messages = [
    { role: 'system', content: '你是一个仅做整理的助手，不造谣。请用中文，输出简洁的事件脉络梳理，按时间线说明关键节点与可能的关联标签。' },
    { role: 'user', content: JSON.stringify(input) }
  ]
  const body = {
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.3
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  const json = await res.json()
  const text = json?.choices?.[0]?.message?.content || ''
  return text
}
