type LoginSearchParams = {
  message?: string
  error?: string
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>
}) {
  const sp = await searchParams

  const message = sp?.message ?? ""
  const error = sp?.error ?? ""

  return (
    <div>
      {!!message && <p>{message}</p>}
      {!!error && <p>{error}</p>}
      {/* 你的原本登录 UI */}
    </div>
  )
}
