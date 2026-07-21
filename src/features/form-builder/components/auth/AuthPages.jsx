import { FaKey, FaLock, FaUser } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginPage({ email, setEmail, password, setPassword, onSubmit }) {
  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
        <Card className="w-full border-t-8 border-t-purple-600">
          <CardHeader className="text-center">
            <div className="mx-auto rounded-full bg-purple-50 p-4 text-purple-600"><FaUser /></div>
            <CardTitle className="text-2xl">ログイン</CardTitle>
            {/* <p className="text-sm text-slate-500">フォーム管理画面にアクセスします。</p> */}
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div className="space-y-2"><label className="text-sm font-medium">ESQID</label><Input type="text" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="li4959" autoFocus /></div>
              <div className="space-y-2"><label className="text-sm font-medium">パスワード</label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="パスワード" /></div>
              <Button type="submit" className="w-full gap-2 bg-purple-600 hover:bg-purple-700"><FaKey />ログイン</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
              <div className="space-y-2"><label className="text-sm font-medium">ESQID</label><Input type="text" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="li4959" autoFocus /></div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">次へ</Button>
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
            {/* <p className="text-sm text-slate-500">{email || "未入力のESQID"}</p> */}
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2"><label className="text-sm font-medium">パスワード</label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="パスワード" autoFocus /></div>
              <Button type="submit" className="w-full gap-2 bg-purple-600 hover:bg-purple-700"><FaKey />ログイン</Button>
              <button
                type="button"
                onClick={onBack}
                className="block w-full text-center text-sm text-slate-600 underline-offset-2 transition hover:text-slate-900 hover:underline"
              >
                サインインに戻る
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
