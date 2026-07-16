import { useMemo } from "react";
import { FaCopy } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { llmPromptExample } from "../../data/mockData";
import { getJsonDiffSummary, normalizeForm, validateAuthoringForm } from "../../utils/formBuilderUtils";


export function JsonAuthoringDialog({ open, onOpenChange, jsonTab, setJsonTab, jsonText, setJsonText, jsonError, prettyJson, copyJson, importJson, currentForm }) {
  const validationPreview = useMemo(() => {
    if (!jsonText.trim()) return { state: "empty", message: "JSONを貼り付けると、反映前チェックを表示します。" };
    try {
      const parsed = JSON.parse(jsonText);
      const errors = validateAuthoringForm(parsed);
      if (errors.length > 0) return { state: "error", message: errors.join("\n") };
      return {
        state: "ok",
        message: `反映できます。タイトル: ${parsed.title ?? "無題"} / セクション: ${parsed.sections?.length ?? 0} / 質問: ${parsed.questions?.length ?? 0}`,
      };
    } catch (error) {
      return { state: "error", message: error.message };
    }
  }, [jsonText]);
  const diffPreview = useMemo(() => {
    if (validationPreview.state !== "ok") return [];
    try {
      return getJsonDiffSummary(currentForm, normalizeForm(JSON.parse(jsonText)));
    } catch {
      return [];
    }
  }, [currentForm, jsonText, validationPreview.state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto" style={{ width: "96vw", maxWidth: "1280px" }}>
        <DialogHeader>
          <DialogTitle>フォーム作成JSON</DialogTitle>
          <DialogDescription>IDなしのJSONを貼り付けてフォームを作成できます。</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b">
          <JsonTabButton active={jsonTab === "json"} onClick={() => setJsonTab("json")}>JSON</JsonTabButton>
          <JsonTabButton active={jsonTab === "guide"} onClick={() => setJsonTab("guide")}>使い方</JsonTabButton>
        </div>

        {jsonTab === "json" ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              このJSONはLLMに書かせるための作成用フォーマットです。内部IDは不要です。
            </div>
            <Textarea className="h-[52vh] min-h-80 resize-none font-mono text-xs" value={jsonText} onChange={(event) => setJsonText(event.target.value)} />
            <div className={`whitespace-pre-line rounded-md p-3 text-sm ${validationPreview.state === "ok" ? "bg-green-50 text-green-700" : validationPreview.state === "error" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600"}`}>{validationPreview.message}</div>
            {diffPreview.length > 0 && (
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs text-slate-500"><tr><th className="px-3 py-2">項目</th><th className="px-3 py-2">現在</th><th className="px-3 py-2">反映後</th><th className="px-3 py-2">差分</th></tr></thead>
                  <tbody>{diffPreview.map((item) => <tr key={item.label} className="border-b"><td className="px-3 py-2 font-medium text-slate-900">{item.label}</td><td className="px-3 py-2 text-slate-600">{item.before}</td><td className="px-3 py-2 text-slate-600">{item.after}</td><td className="px-3 py-2"><span className={`rounded-full px-2 py-1 text-xs ${item.changed ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{item.changed ? "変更あり" : "変更なし"}</span></td></tr>)}</tbody>
                </table>
              </div>
            )}
            {jsonError && <p className="whitespace-pre-line rounded-md bg-red-50 p-3 text-sm text-red-700">{jsonError}</p>}
          </div>
        ) : <JsonGuide />}

        <DialogFooter>
          {jsonTab === "json" && <Button variant="outline" onClick={() => setJsonText(prettyJson)}>現在のフォームを再読込</Button>}
          {jsonTab === "json" && <Button variant="outline" onClick={copyJson}><FaCopy className="mr-2" />コピー</Button>}
          <Button variant="outline" onClick={() => onOpenChange(false)}>クローズ</Button>
          {jsonTab === "json" && <Button className="bg-purple-600 hover:bg-purple-700" onClick={importJson}>JSONを反映</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export function JsonTabButton({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`px-4 py-2 text-sm font-medium ${active ? "border-b-2 border-purple-600 text-purple-700" : "text-slate-500 hover:text-slate-900"}`}>
      {children}
    </button>
  );
}

export function JsonGuide() {
  const sampleJson = `{
  "version": 1,
  "title": "研修参加申請フォーム",
  "description": "受講希望者の情報と希望日程を確認します。",
  "settings": {
    "visibility": "organization",
    "deadline": "2026-07-31T17:00",
    "acceptingResponses": true,
    "themeColor": "#2563eb",
    "backgroundColor": "#eef2ff",
    "showProgress": true,
    "collectEmail": true,
    "limitOneResponse": true,
    "allowEditAfterSubmit": false,
    "sendReceipt": true,
    "submitButtonLabel": "申請を送信",
    "confirmationType": "custom",
    "thankYouTitle": "申請を受け付けました",
    "thankYouMessage": "事務局で確認後、メールで連絡します。"
  },
  "sections": [
    { "title": "基本情報", "description": "回答者情報を入力します。" },
    { "title": "希望内容", "description": "参加希望を入力します。" }
  ],
  "questions": [
    { "section": "基本情報", "type": "shortText", "title": "氏名", "required": true, "placeholder": "山田 太郎", "validation": { "minLength": 2, "errorMessage": "氏名を入力してください" } },
    { "section": "基本情報", "type": "email", "title": "連絡先メール", "required": true, "validation": { "format": "email" } },
    { "section": "希望内容", "type": "radio", "title": "希望日程", "required": true, "options": ["7月15日", "7月22日"], "allowOther": true },
    { "section": "希望内容", "type": "rating", "title": "期待度", "required": false, "scaleMin": 1, "scaleMax": 5, "scaleMinLabel": "低い", "scaleMaxLabel": "高い" },
    { "section": "希望内容", "type": "consent", "title": "個人情報の取り扱い", "required": true, "consentText": "申請内容の確認に利用することに同意します。" }
  ]
}`;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <div className="font-medium text-slate-900">このJSON機能の目的</div>
          <p className="mt-2">GUIで1問ずつ作らず、LLMにフォーム定義を書かせて貼り付けるための機能です。内部IDは自動生成されるので書く必要はありません。</p>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="font-medium text-slate-900">使える質問タイプ</div>
          <ul className="list-disc space-y-1 pl-5">
            <li><code>shortText</code>: 短文</li>
            <li><code>paragraph</code>: 長文</li>
            <li><code>email</code> / <code>number</code> / <code>date</code> / <code>time</code>: 入力形式つき項目</li>
            <li><code>radio</code>: 単一選択</li>
            <li><code>checkbox</code>: 複数選択</li>
            <li><code>select</code>: プルダウン</li>
            <li><code>rating</code>: 評価スケール</li>
            <li><code>matrix</code>: 行と列のグリッド</li>
            <li><code>file</code>: 添付ファイルのモック</li>
            <li><code>consent</code>: 同意チェック</li>
          </ul>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="font-medium text-slate-900">詳細設定を書く場合</div>
          <p><code>placeholder</code>、<code>example</code>、<code>validation</code>、<code>allowOther</code>、<code>randomizeOptions</code>、<code>rows</code>、<code>columns</code> などを書けます。</p>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="font-medium text-slate-900">分岐を書く場合</div>
          <p><code>branch</code> に <code>option</code> と <code>targetSection</code> を書きます。送信完了へ進める場合は <code>targetSection</code> に「送信完了」と書きます。</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <div className="mb-2 text-sm font-medium text-slate-900">LLMに投げるプロンプト例</div>
          <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">{llmPromptExample}</pre>
        </div>
        <div>
          <div className="mb-2 text-sm font-medium text-slate-900">最小JSON例</div>
          <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">{sampleJson}</pre>
        </div>
      </div>
    </div>
  );
}
