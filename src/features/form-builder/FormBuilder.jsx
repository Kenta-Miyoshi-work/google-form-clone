import { useMemo, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaCode, FaCopy, FaEye, FaFileCirclePlus, FaGripVertical, FaHouse, FaKey, FaLock, FaPen, FaPlus, FaRightFromBracket, FaTrash, FaUser } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const questionTypes = [
  { value: "shortText", label: "記述式（短文）" },
  { value: "paragraph", label: "段落" },
  { value: "radio", label: "ラジオボタン" },
  { value: "checkbox", label: "チェックボックス" },
  { value: "select", label: "プルダウン" },
];

const samples = [
  { id: "f1", title: "研修参加申請フォーム", description: "研修参加者の基本情報と希望日程を収集するフォームです。", status: "公開中", updatedAt: "2026/07/08 18:20", responses: 12, questions: 5 },
  { id: "f2", title: "満足度アンケート", description: "イベント終了後の満足度と改善要望を集めるアンケートです。", status: "下書き", updatedAt: "2026/07/07 15:10", responses: 0, questions: 8 },
  { id: "f3", title: "備品購入依頼フォーム", description: "備品購入の申請内容を入力する社内向けフォームです。", status: "非公開", updatedAt: "2026/07/05 09:45", responses: 3, questions: 6 },
];

function id() {
  return crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random()}`;
}

function createInitialForm(title = "無題のフォーム", description = "フォームの説明を入力してください。") {
  return {
    version: 1,
    title,
    description,
    questions: [
      { id: id(), type: "shortText", title: "氏名", description: "", required: true, options: [] },
    ],
  };
}

function createQuestion(type = "shortText") {
  const hasOptions = ["radio", "checkbox", "select"].includes(type);
  return { id: id(), type, title: "新しい質問", description: "", required: false, options: hasOptions ? ["選択肢1", "選択肢2"] : [] };
}

function normalizeForm(value) {
  if (!value || typeof value !== "object") throw new Error("JSONの形式が不正です。");
  return {
    version: value.version ?? 1,
    title: value.title ?? "無題のフォーム",
    description: value.description ?? "",
    questions: Array.isArray(value.questions) ? value.questions.map((q) => ({
      id: q.id ?? id(),
      type: q.type ?? "shortText",
      title: q.title ?? "無題の質問",
      description: q.description ?? "",
      required: Boolean(q.required),
      options: Array.isArray(q.options) ? q.options : [],
    })) : [],
  };
}

export default function FormBuilder() {
  const [screen, setScreen] = useState("loginEmail");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState(createInitialForm);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");

  const prettyJson = useMemo(() => JSON.stringify(form, null, 2), [form]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const submitEmail = (e) => { e.preventDefault(); setScreen("loginPassword"); };
  const submitPassword = (e) => { e.preventDefault(); setScreen("home"); };
  const logout = () => { setPassword(""); setScreen("loginEmail"); };

  const startNew = () => { setForm(createInitialForm()); setScreen("edit"); };
  const openSample = (sample, next = "edit") => {
    setForm({ ...createInitialForm(sample.title, sample.description), questions: [
      { id: id(), type: "shortText", title: "氏名", description: "", required: true, options: [] },
      { id: id(), type: "radio", title: "所属区分", description: "該当するものを選択してください。", required: true, options: ["社員", "パートナー", "その他"] },
      { id: id(), type: "paragraph", title: "備考", description: "補足があれば入力してください。", required: false, options: [] },
    ]});
    setScreen(next);
  };

  const updateQuestion = (qid, patch) => setForm((f) => ({ ...f, questions: f.questions.map((q) => q.id === qid ? { ...q, ...patch } : q) }));
  const addQuestion = () => setForm((f) => ({ ...f, questions: [...f.questions, createQuestion()] }));
  const deleteQuestion = (qid) => setForm((f) => ({ ...f, questions: f.questions.filter((q) => q.id !== qid) }));
  const updateOption = (qid, i, value) => setForm((f) => ({ ...f, questions: f.questions.map((q) => q.id !== qid ? q : { ...q, options: q.options.map((op, idx) => idx === i ? value : op) }) }));
  const addOption = (qid) => setForm((f) => ({ ...f, questions: f.questions.map((q) => q.id !== qid ? q : { ...q, options: [...q.options, `選択肢${q.options.length + 1}`] }) }));
  const deleteOption = (qid, i) => setForm((f) => ({ ...f, questions: f.questions.map((q) => q.id !== qid ? q : { ...q, options: q.options.filter((_, idx) => idx !== i) }) }));
  const changeType = (qid, type) => {
    const hasOptions = ["radio", "checkbox", "select"].includes(type);
    updateQuestion(qid, { type, options: hasOptions ? ["選択肢1", "選択肢2"] : [] });
  };
  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setForm((f) => {
      const a = f.questions.findIndex((q) => q.id === active.id);
      const b = f.questions.findIndex((q) => q.id === over.id);
      return { ...f, questions: arrayMove(f.questions, a, b) };
    });
  };
  const openJson = () => { setJsonText(prettyJson); setJsonError(""); setJsonOpen(true); };
  const importJson = () => {
    try { setForm(normalizeForm(JSON.parse(jsonText))); setJsonOpen(false); setScreen("edit"); }
    catch (e) { setJsonError(e.message); }
  };
  const copyJson = async () => navigator.clipboard?.writeText(prettyJson);

  if (screen === "loginEmail") return <LoginEmailPage email={email} setEmail={setEmail} onSubmit={submitEmail} />;
  if (screen === "loginPassword") return <LoginPasswordPage email={email} password={password} setPassword={setPassword} onSubmit={submitPassword} onBack={() => setScreen("loginEmail")} />;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <button type="button" onClick={() => setScreen("home")} className="text-left">
            <h1 className="text-lg font-bold text-slate-900">フォーム管理</h1>
            <p className="text-xs text-slate-500">Googleフォーム風ビルダー v0.5</p>
          </button>
          <div className="flex items-center gap-2">
            {screen !== "home" && <Button variant="outline" size="sm" className="gap-2" onClick={() => setScreen("home")}><FaHouse />管理トップ</Button>}
            {screen === "edit" && <Button variant="outline" size="sm" className="gap-2" onClick={() => setScreen("preview")}><FaEye />プレビュー</Button>}
            {screen === "preview" && <Button variant="outline" size="sm" className="gap-2" onClick={() => setScreen("edit")}><FaPen />編集に戻る</Button>}
            <Button variant="outline" size="sm" className="gap-2" onClick={openJson}><FaCode />JSON</Button>
            <Button variant="ghost" size="sm" className="hidden gap-2 md:flex"><FaUser />{email || "login@example.com"}</Button>
            <Button variant="ghost" size="sm" className="gap-2" onClick={logout}><FaRightFromBracket />ログアウト</Button>
            {screen === "edit" && <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={addQuestion}><FaPlus />質問追加</Button>}
          </div>
        </div>
      </header>

      {screen === "home" && <HomePage forms={samples} onCreate={startNew} onOpen={openSample} />}
      {screen === "edit" && <EditPage form={form} setForm={setForm} sensors={sensors} onDragEnd={onDragEnd} updateQuestion={updateQuestion} addQuestion={addQuestion} deleteQuestion={deleteQuestion} changeType={changeType} updateOption={updateOption} addOption={addOption} deleteOption={deleteOption} />}
      {screen === "preview" && <PreviewPage form={form} />}

      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>開発者向けJSON</DialogTitle><DialogDescription>通常利用では触らなくてOKです。</DialogDescription></DialogHeader>
          <Textarea className="min-h-[520px] font-mono text-xs" value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
          {jsonError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{jsonError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={copyJson}><FaCopy className="mr-2" />コピー</Button>
            <Button variant="outline" onClick={() => setJsonOpen(false)}>閉じる</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={importJson}>JSONを反映</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoginEmailPage({ email, setEmail, onSubmit }) {
  return <div className="min-h-screen bg-slate-100 p-4"><div className="mx-auto flex min-h-screen max-w-md items-center justify-center"><Card className="w-full border-t-8 border-t-purple-600"><CardHeader className="text-center"><div className="mx-auto rounded-full bg-purple-50 p-4 text-purple-600"><FaUser /></div><CardTitle className="text-2xl">ログイン</CardTitle><p className="text-sm text-slate-500">フォーム管理画面にアクセスします。</p></CardHeader><CardContent><form className="space-y-4" onSubmit={onSubmit}><div className="space-y-2"><label className="text-sm font-medium">メールアドレス</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoFocus /></div><Button className="w-full bg-purple-600 hover:bg-purple-700">次へ</Button><div className="space-y-2 text-center text-sm"><button type="button" className="text-purple-700 hover:underline">アカウントを作成する</button><div className="text-xs text-slate-400">バックエンド未接続のため、何を入力しても進めます。</div></div></form></CardContent></Card></div></div>;
}

function LoginPasswordPage({ email, password, setPassword, onSubmit, onBack }) {
  return <div className="min-h-screen bg-slate-100 p-4"><div className="mx-auto flex min-h-screen max-w-md items-center justify-center"><Card className="w-full border-t-8 border-t-purple-600"><CardHeader className="text-center"><div className="mx-auto rounded-full bg-purple-50 p-4 text-purple-600"><FaLock /></div><CardTitle className="text-2xl">パスワード入力</CardTitle><p className="text-sm text-slate-500">{email || "未入力のメールアドレス"}</p></CardHeader><CardContent><form className="space-y-4" onSubmit={onSubmit}><div className="space-y-2"><label className="text-sm font-medium">パスワード</label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="パスワード" autoFocus /></div><Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700"><FaKey />ログイン</Button><div className="flex items-center justify-between text-sm"><button type="button" className="text-slate-600 hover:underline" onClick={onBack}>メールアドレスを変更</button><button type="button" className="text-purple-700 hover:underline">パスワードを忘れた場合</button></div><div className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">デモ実装のため、任意の値でログインできます。</div></form></CardContent></Card></div></div>;
}

function HomePage({ forms, onCreate, onOpen }) {
  return <main className="mx-auto max-w-6xl space-y-8 p-4 md:p-8"><section className="rounded-2xl bg-gradient-to-r from-purple-700 to-violet-500 p-8 text-white"><div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"><div><h2 className="text-3xl font-bold">フォームを作成・管理</h2><p className="mt-2 max-w-2xl text-sm text-purple-50">既存フォームの編集、新規フォーム作成、プレビュー確認を行う管理トップです。</p></div><Button size="lg" className="gap-2 bg-white text-purple-700 hover:bg-purple-50" onClick={onCreate}><FaFileCirclePlus />新規フォーム作成</Button></div></section><section className="grid grid-cols-1 gap-4 md:grid-cols-3"><Summary label="作成済みフォーム" value="3" /><Summary label="下書き" value="1" /><Summary label="回答数" value="15" /></section><section className="space-y-4"><h3 className="text-xl font-bold">最近作成したフォーム</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{forms.map((f) => <Card key={f.id} className="hover:shadow-md"><CardHeader><div className="flex justify-between gap-3"><CardTitle className="text-lg">{f.title}</CardTitle><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{f.status}</span></div></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-6 text-slate-600">{f.description}</p><div className="grid grid-cols-2 text-sm text-slate-500"><div>質問数: {f.questions}</div><div>回答数: {f.responses}</div></div><p className="text-xs text-slate-400">更新: {f.updatedAt}</p><div className="flex justify-end gap-2 border-t pt-4"><Button variant="outline" size="sm" onClick={() => onOpen(f, "preview")}>プレビュー</Button><Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => onOpen(f, "edit")}>編集</Button></div></CardContent></Card>)}</div></section></main>;
}
function Summary({ label, value }) { return <Card><CardContent className="p-6"><p className="text-sm text-slate-500">{label}</p><p className="text-3xl font-bold">{value}</p><p className="text-xs text-slate-400">モックデータ</p></CardContent></Card>; }

function EditPage({ form, setForm, sensors, onDragEnd, updateQuestion, addQuestion, deleteQuestion, changeType, updateOption, addOption, deleteOption }) {
  return <main className="mx-auto max-w-5xl space-y-4 p-4 md:p-8"><Card className="border-t-8 border-t-purple-600"><CardHeader><CardTitle className="text-2xl">フォーム作成</CardTitle></CardHeader><CardContent className="space-y-4"><Input className="text-xl font-semibold" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></CardContent></Card><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={form.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}><div className="space-y-4">{form.questions.map((q, index) => <SortableQuestion key={q.id} question={q} index={index} updateQuestion={updateQuestion} deleteQuestion={deleteQuestion} changeType={changeType} updateOption={updateOption} addOption={addOption} deleteOption={deleteOption} />)}</div></SortableContext></DndContext><div className="flex justify-center pb-12"><Button onClick={addQuestion} className="gap-2 bg-purple-600 hover:bg-purple-700"><FaPlus />質問追加</Button></div></main>;
}

function SortableQuestion(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.question.id });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? "relative z-10 opacity-80" : ""}><QuestionCard {...props} attributes={attributes} listeners={listeners} isDragging={isDragging} /></div>;
}

function QuestionCard({ question, index, updateQuestion, deleteQuestion, changeType, updateOption, addOption, deleteOption, attributes, listeners, isDragging }) {
  const hasOptions = ["radio", "checkbox", "select"].includes(question.type);
  return <Card className={`border-l-4 border-l-purple-500 ${isDragging ? "shadow-2xl ring-2 ring-purple-300" : ""}`}><CardHeader className="flex flex-row items-center justify-between"><div className="flex items-center gap-3"><button className="cursor-grab rounded p-2 text-slate-400 hover:bg-slate-100" {...attributes} {...listeners}><FaGripVertical /></button><CardTitle className="text-base text-slate-500">質問 {index + 1}</CardTitle></div><Button variant="ghost" size="icon" onClick={() => deleteQuestion(question.id)}><FaTrash /></Button></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]"><Input value={question.title} onChange={(e) => updateQuestion(question.id, { title: e.target.value })} /><Select value={question.type} onValueChange={(v) => changeType(question.id, v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{questionTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div><Input value={question.description} onChange={(e) => updateQuestion(question.id, { description: e.target.value })} placeholder="説明文（任意）" />{hasOptions ? <div className="space-y-2">{question.options.map((op, i) => <div key={i} className="flex items-center gap-2"><span className="w-6 text-center text-sm text-slate-500">{question.type === "checkbox" ? "□" : question.type === "radio" ? "○" : i + 1}</span><Input value={op} onChange={(e) => updateOption(question.id, i, e.target.value)} /><Button variant="ghost" size="icon" disabled={question.options.length <= 1} onClick={() => deleteOption(question.id, i)}><FaTrash /></Button></div>)}<Button variant="outline" size="sm" onClick={() => addOption(question.id)}>選択肢追加</Button></div> : <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-slate-500">回答欄が表示されます</div>}<div className="flex justify-end border-t pt-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={question.required} onChange={(e) => updateQuestion(question.id, { required: e.target.checked })} />必須</label></div></CardContent></Card>;
}

function PreviewPage({ form }) {
  return <main className="mx-auto max-w-3xl space-y-4 p-4 md:p-8"><Card className="border-t-8 border-t-purple-600"><CardHeader><CardTitle className="text-3xl">{form.title}</CardTitle><p className="text-sm text-slate-600">{form.description}</p></CardHeader></Card>{form.questions.map((q) => <Card key={q.id}><CardContent className="space-y-3 pt-6"><div className="font-medium">{q.title}{q.required && <span className="ml-1 text-red-500">*</span>}</div>{q.description && <p className="text-sm text-slate-500">{q.description}</p>}<PreviewControl question={q} /></CardContent></Card>)}<div className="flex justify-end pb-12"><Button className="bg-purple-600 hover:bg-purple-700">送信</Button></div></main>;
}
function PreviewControl({ question }) {
  if (question.type === "paragraph") return <Textarea placeholder="回答を入力" />;
  if (["radio", "checkbox"].includes(question.type)) return <div className="space-y-2">{question.options.map((op) => <label key={op} className="flex items-center gap-2 text-sm"><input type={question.type === "radio" ? "radio" : "checkbox"} name={question.id} />{op}</label>)}</div>;
  if (question.type === "select") return <select className="w-full rounded-md border bg-white px-3 py-2 text-sm"><option>選択してください</option>{question.options.map((op) => <option key={op}>{op}</option>)}</select>;
  return <Input placeholder="回答を入力" />;
}
