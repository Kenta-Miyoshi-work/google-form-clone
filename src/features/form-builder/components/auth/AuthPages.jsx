import { FaKey, FaLock, FaUser } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginEmailPage({ email, setEmail, onSubmit }) {
  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
        <Card className="w-full border-t-8 border-t-purple-600">
          <CardHeader className="text-center">
            <div className="mx-auto rounded-full bg-purple-50 p-4 text-purple-600"><FaUser /></div>
            <CardTitle className="text-2xl">ログイン</CardTitle>
            <p className="text-sm text-slate-500">フォーム管理画面にアクセスします。</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div className="space-y-2"><label className="text-sm font-medium">メールアドレス</label><Input type="text" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoFocus /></div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">次へ</Button>
              <div className="space-y-2 text-center text-sm"><button type="button" className="text-purple-700 hover:underline">アカウントを作成する</button><div className="text-xs text-slate-400">バックエンド未接続のため、何を入力しても進めます。</div></div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function LoginPasswordPage({ email, password, setPassword, onSubmit, onBack }) {
  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
        <Card className="w-full border-t-8 border-t-purple-600">
          <CardHeader className="text-center">
            <div className="mx-auto rounded-full bg-purple-50 p-4 text-purple-600"><FaLock /></div>
            <CardTitle className="text-2xl">パスワード入力</CardTitle>
            <p className="text-sm text-slate-500">{email || "未入力のメールアドレス"}</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2"><label className="text-sm font-medium">パスワード</label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="パスワード" autoFocus /></div>
              <Button type="submit" className="w-full gap-2 bg-purple-600 hover:bg-purple-700"><FaKey />ログイン</Button>
              <div className="flex items-center justify-between text-sm"><button type="button" className="text-slate-600 hover:underline" onClick={onBack}>メールアドレスを変更</button><button type="button" className="text-purple-700 hover:underline">パスワードを忘れた場合</button></div>
              <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">デモ実装のため、任意の値でログインできます。</div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
