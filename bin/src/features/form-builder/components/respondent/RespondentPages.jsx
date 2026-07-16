import { useState } from "react";
import { FaCalendarDays, FaCheck } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  createDefaultSections,
  createDefaultSettings,
  formatAnswerValue,
  formatDeadline,
  getStoredResponseState,
  normalizeBranch,
  normalizeQuestion,
  normalizeSections,
  normalizeVisibilityCondition,
  recordSubmittedResponse,
  setStoredResponseState,
} from "../../utils/formBuilderUtils";

function isReviewMode() {
  return /[?&]mode=review(?:&|$)/.test(window.location.hash);
}

export function FormHeaderCard({ form }) {
  const settings = form.settings ?? createDefaultSettings();

  return (
    <Card className="overflow-hidden border-t-8" style={{ borderTopColor: settings.themeColor }}>
      {settings.headerImageUrl && (
        <img className="h-48 w-full object-cover" src={settings.headerImageUrl} alt="フォームヘッダー" referrerPolicy="no-referrer" />
      )}
      <CardHeader>
        <CardTitle className="text-3xl">{form.title}</CardTitle>
        <p className="text-sm text-slate-600">{form.description}</p>
        <div className="mt-3 grid gap-2 text-sm">
          <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-600">
            <FaCalendarDays style={{ color: settings.themeColor }} />
            <span>公開期限: {formatDeadline(settings.deadline)}</span>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export function SubmissionComplete({ settings, respondentEmail, onEdit }) {
  return (
    <main className="mx-auto max-w-3xl p-4 md:p-8">
      <Card className="border-t-8" style={{ borderTopColor: settings.themeColor }}>
        <CardContent className="space-y-4 p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-50 text-green-600"><FaCheck /></div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">ご回答ありがとうございました</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">回答を受け付けました。</p>
          </div>
          <div className="mx-auto max-w-md rounded-lg bg-slate-50 p-4 text-left text-sm text-slate-600">
            {settings.sendReceipt ? <p>回答コピーを {respondentEmail} 宛に送信した想定です。</p> : <p>回答コピーの送信は設定されていません。</p>}
            {settings.allowEditAfterSubmit && <Button className="mt-3" variant="outline" onClick={onEdit}>回答編集</Button>}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export function AlreadyAnsweredPage({ form, settings, respondentEmail, onEdit }) {
  return (
    <main className="mx-auto max-w-3xl p-4 md:p-8">
      <Card className="border-t-8" style={{ borderTopColor: settings.themeColor }}>
        <CardHeader>
          <CardTitle className="text-2xl">回答済みです</CardTitle>
          <p className="text-sm text-slate-600">{form.title}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">このフォームは1人1回のみ回答できます。ログイン中: {respondentEmail}</p>
          {settings.allowEditAfterSubmit ? <Button className="bg-purple-600 hover:bg-purple-700" onClick={onEdit}>前回回答編集</Button> : <p className="text-sm text-slate-500">送信後の編集は許可されていません。</p>}
        </CardContent>
      </Card>
    </main>
  );
}

export function RespondentFormPage({ form, respondentEmail, showHeader = true }) {
  return (
    <div className="min-h-screen bg-slate-100">
      {showHeader && (
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-3xl flex-col gap-1 px-4 py-4 md:px-8">
            <h1 className="text-lg font-bold text-slate-900">フォーム回答</h1>
            <p className="text-sm text-slate-500">ログイン中: {respondentEmail}</p>
          </div>
        </header>
      )}
      <AnswerForm form={form} submitLabel="回答送信" respondentEmail={respondentEmail} />
    </div>
  );
}

function getUnavailableReason(settings) {
  if (!settings.acceptingResponses) return "このフォームは現在、回答受付を停止しています。";
  if (settings.visibility === "private") return "このフォームは非公開に設定されています。";
  if (settings.deadline) {
    const deadline = new Date(settings.deadline);
    if (!Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now()) return "公開期限を過ぎているため、回答できません。";
  }
  return "";
}

function ResponsePolicyNote({ settings }) {
  const identityText = settings.anonymousResponses
    ? "匿名で回答できます。"
    : settings.collectEmail
      ? "ログイン中のメールアドレスと回答が紐づきます。"
      : "メールアドレスは収集されません。";
  const editText = settings.allowEditAfterSubmit ? "送信後も回答を編集できます。" : "送信後の編集はできません。";
  const countText = settings.limitOneResponse ? "回答は1回のみです。" : "必要に応じて再回答できます。";
  const receiptText = settings.sendReceipt ? "送信後に回答コピーが送信されます。" : "";

  return (
    <div className="rounded-lg border bg-white/80 px-4 py-3 text-xs leading-5 text-slate-500 shadow-sm">
      <span className="font-medium text-slate-700">回答前の確認:</span> {[identityText, editText, countText, receiptText].filter(Boolean).join(" ")}
    </div>
  );
}

export function UnavailableFormPage({ form }) {
  const settings = form.settings ?? createDefaultSettings();
  return (
    <main className="mx-auto max-w-3xl p-4 md:p-8">
      <Card className="border-t-8 border-t-slate-400">
        <CardHeader>
          <CardTitle className="text-2xl">回答を受け付けていません</CardTitle>
          <p className="text-sm text-slate-600">{form.title}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{getUnavailableReason(settings)}</p>
          <div className="grid gap-2 text-sm">
            <div className="rounded-md bg-slate-50 px-3 py-2">公開期限: {formatDeadline(settings.deadline)}</div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function isAnswered(question, value) {
  if (question.type === "checkbox") return Array.isArray(value) && value.length > 0;
  if (question.type === "file") return Array.isArray(value) && value.length > 0;
  if (question.type === "consent") return Boolean(value);
  if (question.type === "matrix") return question.rows.every((row) => value?.[row]);
  return typeof value === "string" && value.trim().length > 0;
}

function getValidationError(question, value) {
  const validation = question.validation ?? {};
  const message = validation.errorMessage || "入力内容を確認してください。";
  if (question.required && !isAnswered(question, value)) return "この質問は必須です。";
  if (!isAnswered(question, value)) return "";
  if (["shortText", "paragraph", "email"].includes(question.type) && typeof value === "string") {
    if (validation.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return message;
    if (validation.format === "url" && !/^https?:\/\/.+/i.test(value)) return message;
    if (validation.format === "tel" && !/^[0-9+\-()\s]+$/.test(value)) return message;
    if (validation.minLength && value.length < Number(validation.minLength)) return message;
    if (validation.maxLength && value.length > Number(validation.maxLength)) return message;
  }
  if (question.type === "number") {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return message;
    if (validation.min !== "" && numericValue < Number(validation.min)) return message;
    if (validation.max !== "" && numericValue > Number(validation.max)) return message;
  }
  return "";
}

function getProgressCounts(questions, values) {
  const requiredQuestions = questions.filter((question) => question.required);
  const optionalQuestions = questions.filter((question) => !question.required);
  return {
    requiredDone: requiredQuestions.filter((question) => isAnswered(question, values[question.id])).length,
    requiredTotal: requiredQuestions.length,
    optionalDone: optionalQuestions.filter((question) => isAnswered(question, values[question.id])).length,
    optionalTotal: optionalQuestions.length,
  };
}

export function AnswerProgress({ questions, values, currentSectionIndex, totalSections }) {
  const progress = getProgressCounts(questions, values);
  const requiredPercent = progress.requiredTotal ? Math.round((progress.requiredDone / progress.requiredTotal) * 100) : 100;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium text-slate-700">進捗: セクション {currentSectionIndex + 1} / {totalSections}</span>
          <span className="text-slate-500">必須 {progress.requiredDone}/{progress.requiredTotal} ・ 任意 {progress.optionalDone}/{progress.optionalTotal}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-purple-600 transition-all" style={{ width: `${requiredPercent}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

function getBranchTarget(sectionQuestions, values) {
  for (const question of sectionQuestions) {
    const branch = normalizeBranch(question.branch);
    const value = values[question.id];
    if (!branch.enabled || !branch.option || !branch.targetSectionId) continue;
    if (question.type === "checkbox" ? value?.includes(branch.option) : value === branch.option) return branch.targetSectionId;
  }
  return "";
}

function isQuestionVisible(question, values) {
  const condition = normalizeVisibilityCondition(question.visibilityCondition);
  if (!condition.enabled || !condition.questionId || !condition.option) return true;
  const sourceValue = values[condition.questionId];
  return Array.isArray(sourceValue) ? sourceValue.includes(condition.option) : sourceValue === condition.option;
}

export function AnswerForm({ form, submitLabel = "送信", respondentEmail = "login@example.com" }) {
  const [sectionId, setSectionId] = useState((form.sections ?? createDefaultSections())[0]?.id ?? "section-1");
  const formResponseKey = form.id ?? form.title ?? "preview-form";
  const [responseState, setResponseState] = useState(() => getStoredResponseState(formResponseKey));
  const [values, setValues] = useState(() => responseState?.values ?? {});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const settings = form.settings ?? createDefaultSettings();
  const sections = normalizeSections(form.sections);
  const currentSectionIndex = Math.max(0, sections.findIndex((section) => section.id === sectionId));
  const currentSection = sections[currentSectionIndex] ?? sections[0];
  const questions = form.questions.map((question) => normalizeQuestion(question));
  const currentQuestions = questions.filter((question) => (question.sectionId ?? "section-1") === currentSection.id && isQuestionVisible(question, values));
  const unavailableReason = getUnavailableReason(settings);
  const buttonLabel = settings.submitButtonLabel || submitLabel;
  const reviewMode = isReviewMode();

  const startEditingSubmittedResponse = () => {
    setSubmitted(false);
    setResponseState((current) => ({ ...(current ?? {}), editing: true }));
    setSectionId(sections[0]?.id ?? "section-1");
  };

  const mappedReviewAnswers = Object.fromEntries(
    questions.map((question) => [question.title, formatAnswerValue(responseState?.values?.[question.id]) || "-"])
  );
  const reviewAnswers = Object.values(mappedReviewAnswers).some((value) => value !== "-")
    ? mappedReviewAnswers
    : (form.reviewAnswers ?? null);

  if (submitted) return <SubmissionComplete settings={settings} respondentEmail={respondentEmail} onEdit={startEditingSubmittedResponse} />;
  if (reviewMode) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-4 md:p-8" style={{ backgroundColor: settings.backgroundColor }}>
        <FormHeaderCard form={form} />
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">あなたの回答内容</CardTitle>
            <p className="text-sm text-slate-500">{responseState?.submittedAt || form.reviewSubmittedAt || "回答日時: -"}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewAnswers ? Object.entries(reviewAnswers).map(([label, answer]) => (
              <div key={label} className="rounded-lg border bg-white p-4">
                <div className="text-sm font-medium text-slate-900">{label}</div>
                <div className="mt-1 text-sm text-slate-600">{answer || "-"}</div>
              </div>
            )) : <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">確認できる回答データがありません。</p>}
          </CardContent>
        </Card>
      </main>
    );
  }
  if (unavailableReason) return <UnavailableFormPage form={form} />;
  if (settings.limitOneResponse && responseState?.submitted && !responseState.editing) return <AlreadyAnsweredPage form={form} settings={settings} respondentEmail={respondentEmail} onEdit={startEditingSubmittedResponse} />;

  const completeSubmission = () => {
    const nextResponseState = { submitted: true, editing: false, values, submittedAt: new Date().toISOString(), respondentEmail };
    setStoredResponseState(formResponseKey, nextResponseState);
    recordSubmittedResponse(form, values, respondentEmail);
    setResponseState(nextResponseState);
    setSubmitted(true);
  };

  const setQuestionValue = (question, value) => {
    setValues((current) => ({ ...current, [question.id]: value }));
    setErrors((current) => ({ ...current, [question.id]: "" }));
  };

  const validateCurrentSection = () => {
    const nextErrors = {};
    currentQuestions.forEach((question) => {
      const error = getValidationError(question, values[question.id]);
      if (error) nextErrors[question.id] = error;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateCurrentSection()) return;
    const branchTarget = getBranchTarget(currentQuestions, values);
    if (branchTarget === "__submit__") { completeSubmission(); return; }
    if (branchTarget && sections.some((section) => section.id === branchTarget)) { setSectionId(branchTarget); return; }
    if (currentSectionIndex >= sections.length - 1) { completeSubmission(); return; }
    setSectionId(sections[currentSectionIndex + 1].id);
  };

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4 md:p-8" style={{ backgroundColor: settings.backgroundColor }}>
      <FormHeaderCard form={form} />
      {settings.showProgress && <AnswerProgress questions={questions} values={values} currentSectionIndex={currentSectionIndex} totalSections={sections.length} />}

      <ResponsePolicyNote settings={settings} />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{currentSection.title}</CardTitle>
          {currentSection.description && <p className="text-sm text-slate-500">{currentSection.description}</p>}
        </CardHeader>
      </Card>

      {currentQuestions.map((question) => (
        <Card key={question.id} className={errors[question.id] ? "border-red-300" : ""}>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2 font-medium">
              <span>{question.title}{settings.requiredMarkStyle === "asterisk" && question.required ? " *" : ""}</span>
              {settings.requiredMarkStyle === "badge" && (question.required ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">必須</span> : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">任意</span>)}
            </div>
            {question.showDescription !== false && question.description && <p className="text-sm text-slate-500">{question.description}</p>}
            {question.example && <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">回答例: {question.example}</p>}
            <PreviewControl question={question} value={values[question.id]} onChange={(value) => setQuestionValue(question, value)} />
            {errors[question.id] && <p className="text-sm text-red-600">{errors[question.id]}</p>}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-between gap-2 pb-12">
        {currentSectionIndex > 0 ? <Button variant="outline" onClick={() => setSectionId(sections[currentSectionIndex - 1].id)}>前画面</Button> : <span />}
        <Button style={{ backgroundColor: settings.themeColor }} onClick={goNext}>{currentSectionIndex >= sections.length - 1 ? buttonLabel : "次画面"}</Button>
      </div>
    </main>
  );
}

export function PreviewPage({ form }) {
  return <AnswerForm form={form} submitLabel="送信" respondentEmail="preview@example.com" />;
}

function getFileAcceptAttribute(fileTypes = []) {
  const acceptMap = {
    PDF: ".pdf,application/pdf",
    画像: "image/*",
    Excel: ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    Word: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    CSV: ".csv,text/csv",
  };
  return fileTypes.map((type) => acceptMap[type] ?? type).join(",");
}

export function PreviewControl({ question, value, onChange }) {
  const update = onChange ?? (() => {});
  const placeholder = question.placeholder || "回答を入力";
  const options = question.randomizeOptions ? [...question.options].reverse() : question.options;
  const optionsWithOther = question.allowOther ? [...options, "その他"] : options;
  if (question.type === "paragraph") return <Textarea placeholder={placeholder} value={value ?? ""} onChange={(event) => update(event.target.value)} />;
  if (question.type === "email") return <Input type="email" placeholder={question.placeholder || "name@example.com"} value={value ?? ""} onChange={(event) => update(event.target.value)} />;
  if (question.type === "number") return <Input type="number" placeholder={placeholder} value={value ?? ""} onChange={(event) => update(event.target.value)} />;
  if (question.type === "date") return <Input type="date" value={value ?? ""} onChange={(event) => update(event.target.value)} />;
  if (question.type === "time") return <Input type="time" value={value ?? ""} onChange={(event) => update(event.target.value)} />;
  if (question.type === "radio") return <div className="space-y-2">{optionsWithOther.map((option) => <label key={option} className="flex items-center gap-2 text-sm"><input type="radio" name={question.id} checked={value === option} onChange={() => update(option)} />{option}</label>)}</div>;
  if (question.type === "checkbox") {
    const currentValue = Array.isArray(value) ? value : [];
    return <div className="space-y-2">{optionsWithOther.map((option) => <label key={option} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={currentValue.includes(option)} onChange={(event) => update(event.target.checked ? [...currentValue, option] : currentValue.filter((item) => item !== option))} />{option}</label>)}</div>;
  }
  if (question.type === "select") return <select className="w-full rounded-md border bg-white px-3 py-2 text-sm" value={value ?? ""} onChange={(event) => update(event.target.value)}><option value="">選択してください</option>{optionsWithOther.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
  if (question.type === "rating") {
    const scaleValues = Array.from({ length: Math.max(1, question.scaleMax - question.scaleMin + 1) }, (_, index) => String(question.scaleMin + index));
    return <div className="space-y-2"><div className="flex flex-wrap gap-2">{scaleValues.map((scaleValue) => <label key={scaleValue} className="flex size-10 items-center justify-center rounded-full border bg-white text-sm"><input className="sr-only" type="radio" name={question.id} checked={value === scaleValue} onChange={() => update(scaleValue)} />{scaleValue}</label>)}</div><div className="flex justify-between text-xs text-slate-500"><span>{question.scaleMinLabel}</span><span>{question.scaleMaxLabel}</span></div></div>;
  }
  if (question.type === "matrix") {
    const currentValue = value && typeof value === "object" ? value : {};
    return <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead><tr><th className="px-2 py-2 text-left"></th>{question.columns.map((column) => <th key={column} className="px-2 py-2 text-center font-medium">{column}</th>)}</tr></thead><tbody>{question.rows.map((row) => <tr key={row} className="border-t"><td className="px-2 py-2 font-medium text-slate-700">{row}</td>{question.columns.map((column) => <td key={column} className="px-2 py-2 text-center"><input type="radio" name={`${question.id}-${row}`} checked={currentValue[row] === column} onChange={() => update({ ...currentValue, [row]: column })} /></td>)}</tr>)}</tbody></table></div>;
  }
  if (question.type === "file") return <div className="space-y-2"><Input type="file" accept={getFileAcceptAttribute(question.fileTypes)} multiple={question.maxFiles > 1} onChange={(event) => update(Array.from(event.target.files ?? []).slice(0, question.maxFiles).map((file) => file.name))} /><p className="text-xs text-slate-500">許可: {question.fileTypes.join(", ")} / 最大{question.maxFiles}件</p>{Array.isArray(value) && value.length > 0 && <p className="text-xs text-slate-500">選択中: {value.join(", ")}</p>}</div>;
  if (question.type === "consent") return <label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={Boolean(value)} onChange={(event) => update(event.target.checked)} /><span>{question.consentText}</span></label>;
  return <Input placeholder={placeholder} value={value ?? ""} onChange={(event) => update(event.target.value)} />;
}
