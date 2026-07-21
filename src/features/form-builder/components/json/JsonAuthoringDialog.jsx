import { useRef, useState } from "react";
import { FaArrowUpRightFromSquare, FaBolt, FaFileArrowUp, FaRotate } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { generateForm } from "../../utils/aiGeneration";
import { normalizeForm, normalizeSections, toAuthoringForm, validateAuthoringForm } from "../../utils/formBuilderUtils";

export function JsonAuthoringDialog({ open, onOpenChange, jsonText, setJsonText, jsonError, setJsonError, importJson, variant = "dialog" }) {
  const [promptText, setPromptText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [messages, setMessages] = useState([]);
  const [draftForm, setDraftForm] = useState(null);
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    window.requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  };

  const generateJson = async () => {
    const trimmedPrompt = promptText.trim();
    if (!trimmedPrompt) {
      setGenerationError("生成したいフォームの内容を入力してください。");
      return;
    }

    setIsGenerating(true);
    setGenerationError("");
    setJsonError("");
    const userMessage = { role: "user", text: trimmedPrompt };
    setMessages((current) => [...current, userMessage]);
    setPromptText("");

    try {
      const result = await generateForm({
        prompt: trimmedPrompt,
        currentForm: draftForm ? toAuthoringForm(normalizeForm(draftForm)) : null,
      });

      const validationErrors = validateAuthoringForm(result.form);
      if (validationErrors.length > 0) throw new Error(`AIの生成結果を確認できませんでした。\n${validationErrors.join("\n")}`);

      const nextJsonText = JSON.stringify(result.form, null, 2);
      setJsonText(nextJsonText);
      setDraftForm(result.form);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: `フォームを作成しました。タイトルは「${result.form.title || "無題"}」、質問は ${result.form.questions?.length ?? 0} 件です。`,
          form: result.form,
        },
      ]);
      scrollToBottom();
    } catch (error) {
      setGenerationError(error.message);
      setMessages((current) => [...current, { role: "assistant", text: `失敗しました。${error.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePromptKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      generateJson();
    }
  };

  const applyDraftForm = () => {
    if (!draftForm) return;
    const nextJsonText = JSON.stringify(draftForm, null, 2);
    setJsonText(nextJsonText);
    importJson(nextJsonText);
  };

  const startOver = () => {
    setMessages([]);
    setDraftForm(null);
    setPromptText("");
    setGenerationError("");
  };

  const messageListMaxHeightClass = variant === "panel" ? "min-h-0 flex-1" : "max-h-[58vh]";

  const chatBody = (
    <div className={`rounded-lg border bg-slate-50 p-4 ${variant === "panel" ? "flex min-h-0 flex-1 flex-col gap-4" : "space-y-4"}`}>
      <div className={`${messageListMaxHeightClass} space-y-4 overflow-y-auto rounded-lg bg-white p-4 shadow-sm`}>
        {messages.length === 0 ? (
          <div className="text-sm text-slate-500">
            <p className="font-medium text-slate-700">どんなフォームを作りますか？</p>
            <p className="mt-1">例: 「ピザパーティーの出欠と、希望の味を聞くフォームを作って」</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatBubble key={`${message.role}-${index}`} role={message.role} text={message.text} form={message.form} />
          ))
        )}
        {isGenerating && <ChatBubble role="assistant" text={draftForm ? "フォームを修正しています..." : "フォームを作成しています..."} loading />}
        <div ref={bottomRef} />
      </div>

      <div className={`space-y-2 ${variant === "panel" ? "shrink-0" : ""}`}>
        <div className="relative">
          <Textarea
            autoFocus
            className="min-h-28 resize-none pb-10 text-sm"
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            onKeyDown={handlePromptKeyDown}
            placeholder={draftForm ? "例: 希望日時を複数選べるようにして、備考欄も追加して" : "作りたいフォームの用途、聞きたいことを入力してください"}
          />
          <Button variant="outline" size="xs" className="absolute bottom-2 right-2 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800" disabled={isGenerating} onClick={generateJson}>
            <FaBolt />{isGenerating ? "送信中..." : "チャットを送信"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="bg-purple-600 hover:bg-purple-700" disabled={!draftForm} onClick={applyDraftForm}>
            <FaArrowUpRightFromSquare className="mr-2" />このフォームを反映
          </Button>
          {messages.length > 0 && <Button variant="ghost" disabled={isGenerating} onClick={startOver}><FaRotate className="mr-2" />最初から</Button>}
          <span className="ml-auto self-center text-xs text-slate-400">Enterで送信 / Shift+Enterで改行</span>
        </div>
        {generationError && <p className="whitespace-pre-line rounded-md bg-red-50 p-3 text-sm text-red-700">{generationError}</p>}
        {jsonError && <p className="whitespace-pre-line rounded-md bg-red-50 p-3 text-sm text-red-700">{jsonError}</p>}
      </div>
    </div>
  );

  if (variant === "panel") {
    if (!open) return null;
    return (
      <section className="flex h-[calc(100vh-7rem)] min-h-0 flex-col overflow-hidden rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-slate-900">AIチャット</h3>
            <p className="text-xs text-slate-500">AIと相談しながら下書きを作成できます。</p>
          </div>
        </div>
        {chatBody}
      </section>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[calc(100vh-2rem)] overflow-y-auto" style={{ width: "96vw", maxWidth: "1280px" }}>
        <DialogHeader>
          <DialogTitle>AIチャット</DialogTitle>
          <DialogDescription>AIと相談しながら下書きを作り、プレビューを確認してから反映できます。</DialogDescription>
        </DialogHeader>
        {chatBody}
      </DialogContent>
    </Dialog>
  );
}

export function ChatBubble({ role, text, form, loading = false }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[92%] rounded-lg px-4 py-3 text-sm leading-6 ${role === "user" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-800"}`}>
        <p className={loading ? "animate-pulse" : ""}>{text}</p>
        {form && <FormDraftPreview form={form} />}
      </div>
    </div>
  );
}

function FormDraftPreview({ form }) {
  const preview = normalizeForm(form);
  const sections = normalizeSections(preview.sections);
  const typeLabel = { shortText: "記述式", radio: "1つ選択", checkbox: "複数選択", file: "ファイル" };

  return (
    <div className="mt-3 overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="border-t-4 px-4 py-3" style={{ borderTopColor: preview.settings?.themeColor || "#7c3aed" }}>
        <div className="font-semibold text-slate-900">{preview.title || "無題のフォーム"}</div>
        {preview.description && <p className="mt-1 text-xs leading-5 text-slate-500">{preview.description}</p>}
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
          <span>{sections.length} セクション</span><span>・</span><span>{preview.questions.length} 問</span><span>・</span><span>必須 {preview.questions.filter((question) => question.required).length} 問</span>
        </div>
      </div>
      <div className="max-h-72 space-y-3 overflow-y-auto border-t bg-slate-50 p-3">
        {sections.map((section) => {
          const questions = preview.questions.filter((question) => question.sectionId === section.id);
          return (
            <div key={section.id} className="space-y-2">
              <div className="text-xs font-semibold text-purple-700">{section.title}</div>
              {questions.map((question, index) => (
                <div key={question.id} className="rounded-lg border bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-slate-800">{index + 1}. {question.title} {question.required && <span className="text-red-500">*</span>}</p>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{typeLabel[question.type] || question.type}</span>
                  </div>
                  {question.description && <p className="mt-1 text-xs text-slate-500">{question.description}</p>}
                  {["radio", "checkbox"].includes(question.type) && <div className="mt-2 space-y-1 text-xs text-slate-600">{question.options.map((option) => <div key={option}>{question.type === "radio" ? "○" : "□"} {option}</div>)}</div>}
                  {question.type === "shortText" && <div className="mt-3 border-b pb-1 text-xs text-slate-400">{question.placeholder || "回答を入力"}</div>}
                  {question.type === "file" && <div className="mt-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-slate-500"><FaFileArrowUp />ファイルを追加</div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {/* previous-diff display removed per request */}
    </div>
  );
}