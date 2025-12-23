import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

type PersonParams = { id: string };

export default async function PersonPage({
  params,
}: {
  // ✅ Next 15：params 必须是 Promise
  params: Promise<PersonParams>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-4xl font-bold text-gray-900">瓜主档案</h1>
          <p className="text-lg text-gray-600">登录后可查看你有权限看的瓜主档案</p>
          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="rounded-full bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition"
            >
              登录
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: person, error: personError } = await supabase
    .from("persons")
    .select("id,display_name,is_discoverable")
    .eq("id", id)
    .maybeSingle();

  if (personError) {
    return (
      <main className="max-w-2xl mx-auto p-6 min-h-screen">
        <div className="rounded-2xl bg-red-50 border border-red-100 p-5 text-sm text-red-700">
          加载瓜主失败：{personError.message}
        </div>
        <div className="mt-6">
          <Link href="/feed" className="text-sm text-gray-600 hover:text-gray-900 underline">
            返回瓜田广场
          </Link>
        </div>
      </main>
    );
  }

  if (!person) {
    return (
      <main className="max-w-2xl mx-auto p-6 min-h-screen">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-sm text-gray-700">
          找不到这个瓜主档案（id：<span className="font-mono">{id}</span>）
        </div>
        <div className="mt-6">
          <Link href="/feed" className="text-sm text-gray-600 hover:text-gray-900 underline">
            返回瓜田广场
          </Link>
        </div>
      </main>
    );
  }

  if (!person.is_discoverable) {
    return (
      <main className="max-w-2xl mx-auto p-6 min-h-screen">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">瓜主档案</h1>
          <Link href="/feed" className="text-sm text-gray-600 hover:text-gray-900">
            返回广场
          </Link>
        </header>
        <div className="rounded-2xl bg-yellow-50 border border-yellow-100 p-5 text-sm text-yellow-800">
          该瓜主档案未开放展示。
        </div>
      </main>
    );
  }

  const { data: guas } = await supabase
    .from("guas")
    .select("id,title,summary_ai,content,created_at,visibility,person_ids,tags_ai,tags_manual")
    .contains("person_ids", [id])
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="max-w-2xl mx-auto p-6 min-h-screen">
      <header className="mb-8 flex justify-between items-center">
        <div className="flex items-end gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{person.display_name}</h1>
          <nav className="text-sm">
            <Link href="/feed" className="text-gray-600 hover:text-gray-900">
              返回广场
            </Link>
          </nav>
        </div>
        <form action="/auth/signout" method="post">
          <button className="text-sm text-gray-600 hover:text-gray-900">退出登录</button>
        </form>
      </header>

      <section className="space-y-4">
        {(guas || []).map((gua) => {
          const tags = ((gua.tags_ai as string[]) || []).concat((gua.tags_manual as string[]) || []);
          const title = (gua.title as string) || (gua.summary_ai as string) || "无标题";

          return (
            <div
              key={gua.id as string}
              className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {new Date(gua.created_at as string).toLocaleString()}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {(gua.summary_ai as string) || (gua.content as string)?.slice(0, 60)}
              </p>

              <div className="flex gap-2 flex-wrap">
                {tags.slice(0, 8).map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {(!guas || guas.length === 0) && (
          <div className="mt-8 p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800">
            <p>这个瓜主暂时没有可见的瓜（或者权限不允许你看）。</p>
          </div>
        )}
      </section>

      <div className="fixed bottom-6 right-6">
        <Link
          href="/compose"
          className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition"
        >
          + 记瓜
        </Link>
      </div>
    </main>
  );
}
