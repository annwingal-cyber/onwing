'use client'
import { useMemo, useState } from 'react'
import { createGua } from '@/app/compose/actions'

type Person = { id: string; display_name: string; aliases?: string[] }

export default function ComposeForm({ persons }: { persons: Person[] }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [visibility, setVisibility] = useState<'private'|'public'|'custom'>('private')
  const [selectedPersons, setSelectedPersons] = useState<Person[]>([])
  const [filter, setFilter] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [ocrStatus, setOcrStatus] = useState<'idle'|'running'|'done'|'error'>('idle')
  const [ocrProgress, setOcrProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const filteredPersons = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return persons
    return persons.filter(p => {
      const aliases = (p.aliases || []).join(' ')
      return (
        p.display_name.toLowerCase().includes(q) ||
        aliases.toLowerCase().includes(q)
      )
    })
  }, [filter, persons])

  function togglePerson(p: Person) {
    const exists = selectedPersons.find(sp => sp.id === p.id)
    if (exists) {
      setSelectedPersons(prev => prev.filter(sp => sp.id !== p.id))
    } else {
      setSelectedPersons(prev => [...prev, p])
    }
  }

  function parseTagsInput(v: string) {
    const parts = v.split(/[，,\\s]+/).map(s => s.trim()).filter(Boolean)
    setTags(parts)
  }

  function onFilesChange(list: FileList | null) {
    if (!list) return
    const arr = Array.from(list).slice(0, 9)
    setFiles(arr)
  }

  async function runOCR() {
    if (!files.length) return
    setOcrStatus('running')
    setError(null)
    try {
      const Tesseract: any = await import('tesseract.js')
      let combined = ''
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const res = await Tesseract.recognize(file, 'chi_sim', {
          logger: (m: any) => {
            if (m.status === 'recognizing text' && typeof m.progress === 'number') {
              const base = (i / files.length) * 100
              const part = (m.progress * 100) / files.length
              setOcrProgress(Math.min(100, Math.floor(base + part)))
            }
          }
        })
        combined += '\\n\\n' + (res.data?.text || '')
      }
      const merged = (content ? content + '\\n\\n' : '') + combined.trim()
      setContent(merged)
      setOcrStatus('done')
      setOcrProgress(100)
    } catch (e: any) {
      setOcrStatus('error')
      setError(e?.message || 'OCR 失败')
    }
  }

  return (
    <form className="space-y-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">标题（可选）</label>
        <input value={title} onChange={e => setTitle(e.target.value)} type="text" name="title" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" placeholder="今天的瓜标题…" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">正文（必填）</label>
        <textarea value={content} onChange={e => setContent(e.target.value)} name="content" rows={8} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" placeholder="详细描述一下这口瓜…" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">选择已有瓜主</label>
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="搜索" className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none" />
        </div>
        <div className="max-h-40 overflow-auto rounded-md border border-gray-200 p-2">
          {filteredPersons.length === 0 && (
            <div className="text-xs text-gray-500">没有匹配的瓜主</div>
          )}
          {filteredPersons.map(p => {
            const checked = !!selectedPersons.find(sp => sp.id === p.id)
            return (
              <label key={p.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                <input type="checkbox" checked={checked} onChange={() => togglePerson(p)} />
                <span className="text-gray-800">{p.display_name}</span>
                {p.aliases && p.aliases.length > 0 && (
                  <span className="text-gray-500 text-xs">（{p.aliases.slice(0,3).join('、')}{p.aliases.length>3?'…':''}）</span>
                )}
              </label>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedPersons.map(p => (
            <span key={p.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{p.display_name}</span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">标签（可选）</label>
        <input onChange={e => parseTagsInput(e.target.value)} type="text" name="tags" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" placeholder="例如：职场, 反转, 社死" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">可见范围（必填）</label>
        <select value={visibility} onChange={e => setVisibility(e.target.value as any)} name="visibility" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
          <option value="private">仅自己</option>
          <option value="public">公开</option>
          <option value="custom">指定可见</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">图片（可选，最多 9 张）</label>
        <input type="file" accept="image/*" multiple onChange={e => onFilesChange(e.target.files)} />
        {files.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {files.map((f, i) => {
              const url = URL.createObjectURL(f)
              return (
                <img key={i} src={url} alt="preview" className="aspect-square w-full object-cover rounded-md border" />
              )
            })}
          </div>
        )}
        <div className="flex items-center gap-3">
          <button type="button" onClick={runOCR} disabled={ocrStatus==='running' || files.length===0} className="rounded-md bg-melon text-white px-4 py-2 text-sm disabled:opacity-50">提取图片文字</button>
          {ocrStatus==='running' && <span className="text-sm text-gray-600">OCR 中… {ocrProgress}%</span>}
          {ocrStatus==='done' && <span className="text-sm text-green-600">已填充正文</span>}
          {ocrStatus==='error' && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>

      <input type="hidden" name="person_ids" value={JSON.stringify(selectedPersons.map(p => p.id))} />
      <input type="hidden" name="tags_manual" value={JSON.stringify(tags)} />

      <div className="flex items-center gap-3">
        <button type="button" className="rounded-md bg-melon text-white px-4 py-2 text-sm hover:opacity-90">AI归档</button>
        <button formAction={createGua} className="rounded-md bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700">发布</button>
        <button type="button" className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">保存草稿</button>
      </div>

      <p className="text-xs text-gray-500">提示：图片 OCR 会尝试中文识别，失败时可重试或改为英文识别。</p>
    </form>
  )
}
