'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const message = sp.get('message') ?? '';
  const errorFromUrl = sp.get('error') ?? '';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>(errorFromUrl);

  React.useEffect(() => {
    // URL 里如果有 error/message，优先展示
    if (errorFromUrl) setError(errorFromUrl);
  }, [errorFromUrl]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // 登录成功：去瓜田广场
      router.push('/feed');
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? '登录失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // 这里保持默认即可；如果你有自定义回调域名再改
          redirectTo: `${window.location.origin}/feed`,
        },
      });

      if (error) setError(error.message);
    } catch (err: any) {
      setError(err?.message ?? 'Google 登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.9),_rgba(245,245,245,1))]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        {/* 标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">瓜田</h1>
          <p className="mt-2 text-sm text-neutral-600">
            记录你的瓜，AI 自动归档成瓜主档案 🍉
          </p>
        </div>

        {/* 提示条 */}
        {message ? (
          <div className="mb-4 rounded-2xl border border-black/5 bg-white/60 p-3 text-sm text-neutral-700 backdrop-blur">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-50/70 p-3 text-sm text-red-700 backdrop-blur">
            {error}
          </div>
        ) : null}

        {/* 卡片 */}
        <div className="rounded-3xl border border-black/5 bg-white/55 p-6 shadow-sm backdrop-blur">
          <form onSubmit={onLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-black/20"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-black/20"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white transition active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? '登录中…' : '登录'}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white/60 px-3 text-xs text-neutral-500 backdrop-blur">
                  或者
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onGoogle}
              disabled={loading}
              className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-medium text-neutral-800 transition active:scale-[0.99] disabled:opacity-60"
            >
              用 Google 登录
            </button>

            <p className="pt-2 text-center text-xs text-neutral-500">
              轻松记录，别把真名电话住址写进来哦（保护自己也保护别人）
            </p>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-neutral-500">
          登录后默认跳转到 <span className="font-medium">/feed</span>
        </div>
      </div>
    </div>
  );
}
