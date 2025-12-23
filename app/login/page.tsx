import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

type PersonParams = { id: string };

// ✅ Next 15：params 可能是 Promise
export default async function PersonPage({
  params,
}: {
  params: Promise<PersonParams>;
}) {
  const { id } = await params;

  const supabase = createClient();

  // 取瓜主信息（根据你表名/字段可能需要调整）
  // 假设表：persons，主键 id
  const { data: person, error: personError } = await supabase
    .from("persons")
    .select("*")
    .eq("id", id)
    .single();

  if (personError) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-black/10 bg-white/60 p-4 backdrop-blur">
          <p className="text-sm text-red-700">加载瓜主失败：{personError.message}</p>
        </div>
        <div className="mt-4">
          <Link className="text-sm underline" href="/feed">
            返回瓜田广场
          </Link>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-black/10 bg-white/60 p-4 backdrop-blur">
          <p className="text-sm text-neutral-700">找不到这个瓜主。</p>
        </div>
        <div className="mt-4">
          <Link className="text-sm underline" href="/feed">
            返回瓜田广场
          </Link>
        </div>
      </div>
    );
  }

  // 取该瓜主相关的瓜（按你项目字段可能要改）
  // 假设：gua 表里有 person_ids（数组）或 person_id（单个）
  // 这里我写两种示例：你用哪种就保留哪种

  // A) 如果是单 person_id 字段：
  const { data: guasA } = await supabase
    .from("guas")
    .select("*")
    .eq("person_id", id)
    .order("created_at", { ascending: false });

  // B) 如果是数组 person_ids（Postgres array），改成 contains：
  // const { data: guasB } = await supabase
  //   .from("guas")
  //   .select("*")
  //   .contains("person_ids", [id])
  //   .order("created_at", { ascending: false });

  const guas = guasA ?? [];

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {person.display_name ?? person.name ?? "瓜主档案"}
        </h1>
        <Link className="text-sm underline" href="/feed">
          返回广场
        </Link>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white/60 p-5 shadow-sm backdrop-blur">
        <div className="text-sm text-neutral-700">
          <div className="mb-2">
            <span className="text-neutral-500">ID：</span>
            <span className="font-mono">{id}</span>
          </div>

          {/* 你可以把更多 person 字段展示在这里 */}
          {person.bio ? (
            <div className="mt-3 text-neutral-800">{person.bio}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">相关瓜</h2>

        {guas.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white/60 p-4 text-sm text-neutral-700 backdrop-blur">
            这个瓜主还没有瓜，去记一条🍉
          </div>
        ) : (
          <div className="space-y-3">
            {guas.map((g: any) => (
              <div
                key={g.id}
                className="rounded-2xl border border-black/10 bg-white/60 p-4 backdrop-blur"
              >
                <div className="text-sm font-medium text-neutral-900">
                  {g.title ?? g.summary_ai ?? "一条瓜"}
                </div>
                <div className="mt-1 line-clamp-2 text-sm text-neutral-700">
                  {g.content ?? ""}
                </div>
                <div className="mt-2 text-xs text-neutral-500">
                  {g.created_at ? new Date(g.created_at).toLocaleString() : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
