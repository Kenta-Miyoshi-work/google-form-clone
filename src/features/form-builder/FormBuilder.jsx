import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { FaBars, FaCode, FaEye, FaFloppyDisk, FaGear, FaHouse, FaPen, FaPlus, FaRegClock, FaRightFromBracket, FaRocket, FaUser } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { actionItems, maxJsonImportLength, templates } from "./data/mockData";
import { roleOptions } from "./data/roleOptions";
import { LoginEmailPage, LoginPasswordPage } from "./components/auth/AuthPages";
import {
  createBlankForm,
  createDefaultSections,
  createDefaultSettings,
  createFormFromActionItem,
  createFormFromTemplate,
  createQuestion,
  createQuestionDefaults,
  createSection,
  appendAuditLog,
  appendVersionHistory,
  archiveCreatedForm,
  deleteCreatedForm,
  duplicateCreatedForm,
  getBlockingPublishIssues,
  getRespondentFormFromHash,
  getStoredCreatedForms,
  getStoredLoginEmail,
  getNotificationRulesForItem,
  getPublishChecklistForForm,
  getRecipientsForItem,
  normalizeBranch,
  normalizeForm,
  resetDemoStorage,
  upsertCreatedForm,
  toAuthoringForm,
  validateAuthoringForm,
} from "./utils/formBuilderUtils";

const HomePage = lazy(() => import("./components/home/HomePage").then((module) => ({ default: module.HomePage })));
const EditPage = lazy(() => import("./components/editor/EditPage").then((module) => ({ default: module.EditPage })));
const JsonAuthoringDialog = lazy(() => import("./components/json/JsonAuthoringDialog").then((module) => ({ default: module.JsonAuthoringDialog })));
const PreviewPage = lazy(() => import("./components/respondent/RespondentPages").then((module) => ({ default: module.PreviewPage })));
const RespondentFormPage = lazy(() => import("./components/respondent/RespondentPages").then((module) => ({ default: module.RespondentFormPage })));
const AuditLogPage = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.AuditLogPage })));
const FormSettingsDialog = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.FormSettingsDialog })));
const NotificationSettingsDialog = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.NotificationSettingsDialog })));
const PrePublishReviewDialog = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.PrePublishReviewDialog })));
const PublishControlDialog = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.PublishControlDialog })));
const RecipientManagementPage = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.RecipientManagementPage })));
const ResponseDashboardPage = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.ResponseDashboardPage })));
const ShareLinkDialog = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.ShareLinkDialog })));
const StateSwitchPage = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.StateSwitchPage })));
const VersionHistoryDialog = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.VersionHistoryDialog })));

function LoadingPanel() {
  return <div className="mx-auto max-w-6xl p-6 text-sm text-slate-500">画面を読み込んでいます...</div>;
}

export default function FormBuilder() {
  const respondentForm = getRespondentFormFromHash();
  const [screen, setScreen] = useState("loginEmail");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [homeTab, setHomeTab] = useState("actions");
  const [hoveredTemplateId, setHoveredTemplateId] = useState(templates[0].id);
  const [form, setForm] = useState(createBlankForm);
  const [managedForms, setManagedForms] = useState(getStoredCreatedForms);
  const [activeFormId, setActiveFormId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const [userRole, setUserRole] = useState("owner");
  const [publishIssues, setPublishIssues] = useState([]);
  const [pendingPublishItem, setPendingPublishItem] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareItem, setShareItem] = useState(null);
  const [responseItem, setResponseItem] = useState(null);
  const [versionItem, setVersionItem] = useState(null);
  const [publishItem, setPublishItem] = useState(null);
  const [recipientItem, setRecipientItem] = useState(null);
  const [notificationItem, setNotificationItem] = useState(null);
  const [reviewItem, setReviewItem] = useState(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonTab, setJsonTab] = useState("json");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");

  const hoveredTemplate = templates.find((template) => template.id === hoveredTemplateId) ?? templates[0];
  const prettyJson = useMemo(() => JSON.stringify(toAuthoringForm(form), null, 2), [form]);
  const activeManagedForm = managedForms.find((item) => item.id === activeFormId);
  const currentRole = roleOptions.find((role) => role.value === userRole) ?? roleOptions[0];
  const publishChecklistForCurrentForm = useMemo(() => getPublishChecklistForForm(
    form,
    activeManagedForm ? getRecipientsForItem(activeManagedForm) : [],
    activeManagedForm ? getNotificationRulesForItem(activeManagedForm) : [],
  ), [activeManagedForm, form]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty || screen !== "edit" || !currentRole.canEdit) return undefined;
    const timer = window.setTimeout(() => {
      const { item, items } = upsertCreatedForm(managedForms, form, activeFormId, "自動保存");
      setManagedForms(items);
      setActiveFormId(item.id);
      setIsDirty(false);
      setSaveNotice("自動保存しました。");
    }, 15000);
    return () => window.clearTimeout(timer);
  }, [activeFormId, currentRole.canEdit, form, isDirty, managedForms, screen]);

  const submitEmail = (event) => { event.preventDefault(); setScreen("loginPassword"); };
  const submitPassword = (event) => {
    event.preventDefault();
    localStorage.setItem("form-builder-demo-email", email || "login@example.com");
    setScreen("home");
  };
  const confirmDiscardIfDirty = () => !isDirty || window.confirm("未保存の変更があります。保存せずに移動しますか？");
  const goHome = () => { if (confirmDiscardIfDirty()) setScreen("home"); };
  const logout = () => { if (!confirmDiscardIfDirty()) return; setPassword(""); setScreen("loginEmail"); };

  const markFormChanged = (updater) => {
    if (!currentRole.canEdit) {
      setSaveNotice("閲覧者権限では編集できません。");
      return;
    }
    setForm(updater);
    setIsDirty(true);
    setSaveNotice("");
  };

  const saveCurrentForm = (status = "下書き") => {
    if (!currentRole.canEdit) { setSaveNotice("閲覧者権限では保存できません。"); return activeManagedForm; }
    const { item, items } = upsertCreatedForm(managedForms, form, activeFormId, status);
    setManagedForms(items);
    setActiveFormId(item.id);
    setIsDirty(false);
    setSaveNotice(status === "公開中" ? "公開版として保存しました。" : "下書きを保存しました。");
    appendAuditLog({ actor: email || "login@example.com", action: status === "公開中" ? "フォーム公開" : "下書き保存", target: item.title, detail: `${item.status}として保存` });
    if (status !== "自動保存") appendVersionHistory(item, form, status, email || "login@example.com", status === "公開中" ? "公開版として保存" : "下書き保存");
    return item;
  };

  const publishCurrentForm = (force = false) => {
    if (!currentRole.canPublish) { setSaveNotice("この権限では公開できません。"); return null; }
    const issues = getBlockingPublishIssues(publishChecklistForCurrentForm);
    if (!force && issues.length > 0) {
      setPublishIssues(issues);
      setPendingPublishItem(null);
      return null;
    }
    return saveCurrentForm("公開中");
  };

  const publishManagedItem = (item, force = false) => {
    if (!currentRole.canPublish) { setSaveNotice("この権限では公開できません。"); return null; }
    const itemForm = createFormFromActionItem(item);
    const checklist = getPublishChecklistForForm(itemForm, getRecipientsForItem(item), getNotificationRulesForItem(item));
    const issues = getBlockingPublishIssues(checklist);
    if (!force && issues.length > 0) {
      setPublishIssues(issues);
      setPendingPublishItem(item);
      return null;
    }
    const result = upsertCreatedForm(managedForms, itemForm, item.id, "公開中");
    setManagedForms(result.items);
    setActiveFormId(result.item.id);
    setIsDirty(false);
    setSaveNotice("公開版として保存しました。");
    appendAuditLog({ actor: email || "login@example.com", action: "フォーム公開", target: result.item.title, detail: "公開前チェックを確認して公開" });
    appendVersionHistory(result.item, itemForm, "公開中", email || "login@example.com", "公開前チェックを確認して公開");
    return result.item;
  };

  const resetDemo = () => {
    if (!window.confirm("保存済みフォーム、回答、監査ログ、通知設定、版履歴を初期化しますか？")) return;
    resetDemoStorage();
    setManagedForms(getStoredCreatedForms());
    setActiveFormId(null);
    setIsDirty(false);
    setSaveNotice("デモデータを初期化しました。");
    setScreen("home");
  };

  const duplicateManagedForm = (item) => setManagedForms(duplicateCreatedForm(managedForms, item));
  const archiveManagedForm = (item) => setManagedForms(archiveCreatedForm(managedForms, item));
  const deleteManagedForm = (item) => {
    if (!window.confirm(`${item.title} を削除しますか？`)) return;
    setManagedForms(deleteCreatedForm(managedForms, item));
  };

  const startBlank = () => { setForm(createBlankForm()); setActiveFormId(null); setIsDirty(true); setSaveNotice(""); setScreen("edit"); };
  const startFromTemplate = (template) => { setForm(createFormFromTemplate(template)); setActiveFormId(null); setIsDirty(true); setSaveNotice(""); setScreen("edit"); };
  const openResponseDashboard = (item) => { setResponseItem(item); setScreen("responses"); };
  const openRecipientManagement = (item) => { setRecipientItem(item); setScreen("recipients"); };
  const openCreatedForm = (item, next = "edit") => {
    setForm(createFormFromActionItem(item));
    setActiveFormId(item.id);
    setIsDirty(false);
    setSaveNotice("");
    setScreen(next);
  };

  const updateFormSettings = (patch) => markFormChanged((current) => ({
    ...current,
    settings: createDefaultSettings({ ...current.settings, ...patch }),
  }));

  const updateQuestion = (qid, patch) => markFormChanged((current) => ({ ...current, questions: current.questions.map((q) => q.id === qid ? { ...q, ...patch } : q) }));
  const addQuestion = () => markFormChanged((current) => ({
    ...current,
    questions: [...current.questions, { ...createQuestion(), sectionId: current.sections?.[0]?.id ?? "section-1" }],
  }));
  const deleteQuestion = (qid) => markFormChanged((current) => ({ ...current, questions: current.questions.filter((q) => q.id !== qid) }));
  const updateOption = (qid, index, value) => markFormChanged((current) => ({ ...current, questions: current.questions.map((q) => q.id !== qid ? q : { ...q, options: q.options.map((option, i) => i === index ? value : option) }) }));
  const addOption = (qid) => markFormChanged((current) => ({ ...current, questions: current.questions.map((q) => q.id !== qid ? q : { ...q, options: [...q.options, `選択肢${q.options.length + 1}`] }) }));
  const deleteOption = (qid, index) => markFormChanged((current) => ({ ...current, questions: current.questions.map((q) => q.id !== qid ? q : { ...q, options: q.options.filter((_, i) => i !== index) }) }));
  const changeType = (qid, type) => {
    markFormChanged((current) => ({
      ...current,
      questions: current.questions.map((question) => question.id !== qid ? question : {
        ...createQuestionDefaults(type),
        id: question.id,
        sectionId: question.sectionId,
        type,
        title: question.title,
        description: question.description,
        required: question.required,
        branch: normalizeBranch(),
      }),
    }));
  };
  const duplicateQuestion = (qid) => markFormChanged((current) => {
    const index = current.questions.findIndex((question) => question.id === qid);
    if (index < 0) return current;
    const original = current.questions[index];
    const copy = { ...original, id: crypto?.randomUUID?.() ?? `copy-${Date.now()}`, title: `${original.title} のコピー` };
    return { ...current, questions: [...current.questions.slice(0, index + 1), copy, ...current.questions.slice(index + 1)] };
  });
  const moveQuestion = (qid, direction) => markFormChanged((current) => {
    const index = current.questions.findIndex((question) => question.id === qid);
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || nextIndex < 0 || nextIndex >= current.questions.length) return current;
    return { ...current, questions: arrayMove(current.questions, index, nextIndex) };
  });
  const addSection = () => markFormChanged((current) => ({ ...current, sections: [...(current.sections ?? createDefaultSections()), createSection(`セクション ${(current.sections?.length ?? 1) + 1}`)] }));
  const updateSection = (sectionId, patch) => markFormChanged((current) => ({ ...current, sections: (current.sections ?? createDefaultSections()).map((section) => section.id === sectionId ? { ...section, ...patch } : section) }));
  const deleteSection = (sectionId) => markFormChanged((current) => {
    const sections = current.sections ?? createDefaultSections();
    if (sections.length <= 1) return current;
    const nextSections = sections.filter((section) => section.id !== sectionId);
    const fallbackSectionId = nextSections[0]?.id ?? "section-1";
    return {
      ...current,
      sections: nextSections,
      questions: current.questions.map((question) => question.sectionId === sectionId ? { ...question, sectionId: fallbackSectionId } : question),
    };
  });

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    markFormChanged((current) => {
      const oldIndex = current.questions.findIndex((q) => q.id === active.id);
      const newIndex = current.questions.findIndex((q) => q.id === over.id);
      return { ...current, questions: arrayMove(current.questions, oldIndex, newIndex) };
    });
  };

  const openJson = () => { setPublishIssues([]); setPendingPublishItem(null); setJsonText(prettyJson); setJsonError(""); setJsonTab("json"); setJsonOpen(true); };
  const importJson = () => {
    try {
      if (jsonText.length > maxJsonImportLength) throw new Error("JSONが大きすぎます。200KB以内にしてください。");
      const parsedJson = JSON.parse(jsonText);
      const validationErrors = validateAuthoringForm(parsedJson);
      if (validationErrors.length > 0) throw new Error(validationErrors.join("\n"));
      const normalizedJsonForm = normalizeForm(parsedJson);
      appendAuditLog({ actor: email || "login@example.com", action: "JSONインポート", target: normalizedJsonForm.title, detail: `${normalizedJsonForm.questions.length}問を反映` });
      setForm(normalizedJsonForm); setActiveFormId(null); setIsDirty(true); setJsonOpen(false); setScreen("edit");
    }
    catch (error) { setJsonError(error.message); }
  };
  const copyJson = async () => navigator.clipboard?.writeText(jsonText || prettyJson);

  if (respondentForm) return <Suspense fallback={<LoadingPanel />}><RespondentFormPage form={respondentForm} respondentEmail={getStoredLoginEmail()} /></Suspense>;

  if (screen === "loginEmail") return <LoginEmailPage email={email} setEmail={setEmail} onSubmit={submitEmail} />;
  if (screen === "loginPassword") return <LoginPasswordPage email={email} password={password} setPassword={setPassword} onSubmit={submitPassword} onBack={() => setScreen("loginEmail")} />;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <button type="button" onClick={goHome} className="text-left">
            <h1 className="text-lg font-bold text-slate-900">フォーム管理</h1>
            <p className="text-xs text-slate-500">Googleフォーム風ビルダー v0.6</p>
          </button>
          <div className="flex items-center justify-end gap-2">
            <select aria-label="権限ロール" className="h-9 max-w-24 rounded-md border bg-white px-2 text-xs text-slate-700" value={userRole} onChange={(event) => setUserRole(event.target.value)}>
              {roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
            {screen === "edit" && <Button variant="outline" size="sm" className="inline-flex gap-2" aria-label="プレビュー" onClick={() => setScreen("preview")}><FaEye /><span className="hidden sm:inline">プレビュー</span></Button>}
            {screen === "preview" && <Button variant="outline" size="sm" className="inline-flex gap-2" aria-label="編集に戻る" onClick={() => setScreen("edit")}><FaPen /><span className="hidden sm:inline">編集に戻る</span></Button>}
            {screen === "edit" && <Button aria-label="保存" variant="outline" size="sm" className="inline-flex gap-2" disabled={!currentRole.canEdit} onClick={() => saveCurrentForm("下書き")}><FaFloppyDisk /><span className="hidden sm:inline">保存</span></Button>}
            {screen === "edit" && <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700" disabled={!currentRole.canEdit} onClick={addQuestion}><FaPlus />質問追加</Button>}

            <DropdownMenu>
              <DropdownMenuTrigger aria-label="メニュー" className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400">
                <FaBars />
                <span className="hidden sm:inline">メニュー</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>フォーム操作</DropdownMenuLabel>
                  {screen !== "home" && <DropdownMenuItem onClick={goHome}><FaHouse />管理トップ</DropdownMenuItem>}
                  {screen === "edit" && <DropdownMenuItem onClick={() => setSettingsOpen(true)}><FaGear />フォーム設定</DropdownMenuItem>}
                  {screen === "edit" && <DropdownMenuItem onClick={() => saveCurrentForm("下書き")}><FaFloppyDisk />下書き保存</DropdownMenuItem>}
                  {screen === "edit" && <DropdownMenuItem onClick={() => publishCurrentForm()}><FaRocket />公開として保存</DropdownMenuItem>}
                </DropdownMenuGroup>

                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>高度な操作</DropdownMenuLabel>
                  {screen === "edit" && <DropdownMenuItem onClick={openJson}><FaCode />JSONインポート/出力</DropdownMenuItem>}
                  {screen !== "audit" && <DropdownMenuItem onClick={() => setScreen("audit")}><FaRegClock />監査ログ</DropdownMenuItem>}
                  {screen !== "states" && <DropdownMenuItem onClick={() => setScreen("states")}><FaEye />状態切替</DropdownMenuItem>}
                  <DropdownMenuItem onClick={resetDemo}><FaRegClock />デモデータをリセット</DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>アカウント</DropdownMenuLabel>
                  <DropdownMenuItem><FaUser />{email || "login@example.com"}</DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}><FaRightFromBracket />ログアウト</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      {screen === "edit" && (
        <div className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2 text-xs text-slate-500 md:px-8">
            <span className={`rounded-full px-2 py-1 ${isDirty ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>{isDirty ? "未保存の変更あり" : "保存済み"}</span>
            {activeManagedForm && <span>編集中: {activeManagedForm.title}</span>}
            <span>権限: {currentRole.label}</span>
            {saveNotice && <span className="text-green-700">{saveNotice}</span>}
          </div>
        </div>
      )}

      <Suspense fallback={<LoadingPanel />}>
        {screen === "home" && (
          <HomePage
            templates={templates}
            hoveredTemplate={hoveredTemplate}
            hoveredTemplateId={hoveredTemplateId}
            setHoveredTemplateId={setHoveredTemplateId}
            onStartBlank={startBlank}
            onStartTemplate={startFromTemplate}
            homeTab={homeTab}
            setHomeTab={setHomeTab}
            actionItems={actionItems}
            createdForms={managedForms}
            onOpenCreated={openCreatedForm}
            onShareCreated={setShareItem}
            onOpenResponses={openResponseDashboard}
            onOpenVersions={setVersionItem}
            onOpenPublish={setPublishItem}
            onOpenRecipients={openRecipientManagement}
            onOpenNotifications={setNotificationItem}
            onOpenReview={setReviewItem}
            onDuplicate={duplicateManagedForm}
            onArchive={archiveManagedForm}
            onDelete={deleteManagedForm}
            currentRole={currentRole}
          />
        )}
        {screen === "edit" && <EditPage form={form} setForm={markFormChanged} sensors={sensors} onDragEnd={onDragEnd} updateQuestion={updateQuestion} addQuestion={addQuestion} deleteQuestion={deleteQuestion} duplicateQuestion={duplicateQuestion} moveQuestion={moveQuestion} changeType={changeType} updateOption={updateOption} addOption={addOption} deleteOption={deleteOption} addSection={addSection} updateSection={updateSection} deleteSection={deleteSection} />}
        {screen === "preview" && <PreviewPage form={form} />}
        {screen === "responses" && <ResponseDashboardPage item={responseItem ?? managedForms[0]} onBack={() => setScreen("home")} onPreview={(item) => openCreatedForm(item, "preview")} />}
        {screen === "recipients" && <RecipientManagementPage item={recipientItem ?? managedForms[0]} onBack={() => setScreen("home")} onOpenNotifications={setNotificationItem} />}
        {screen === "audit" && <AuditLogPage onBack={() => setScreen("home")} />}
        {screen === "states" && <StateSwitchPage onBack={() => setScreen("home")} />}

        {settingsOpen && (
          <FormSettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            settings={form.settings ?? createDefaultSettings()}
            onChange={updateFormSettings}
          />
        )}

        {shareItem && <ShareLinkDialog item={shareItem} onOpenChange={(open) => !open && setShareItem(null)} />}

        {versionItem && <VersionHistoryDialog item={versionItem} onOpenChange={(open) => !open && setVersionItem(null)} onPreview={(item) => openCreatedForm(item, "preview")} onCreateVersion={(item) => { const draftForm = createFormFromActionItem(item); appendVersionHistory(item, draftForm, "下書き", email || "login@example.com", "新しい下書き版を作成"); openCreatedForm(item, "edit"); setVersionItem(null); setSaveNotice("新しい版の下書きを開きました。"); }} />}
        {publishItem && <PublishControlDialog item={publishItem} onOpenChange={(open) => !open && setPublishItem(null)} onShare={(item) => { setPublishItem(null); setShareItem(item); }} onPublish={(item) => { const published = publishManagedItem(item); if (published) { setPublishItem(null); setShareItem(published); } }} />}
        {notificationItem && <NotificationSettingsDialog item={notificationItem} onOpenChange={(open) => !open && setNotificationItem(null)} />}
        {reviewItem && <PrePublishReviewDialog item={reviewItem} onOpenChange={(open) => !open && setReviewItem(null)} onOpenPublish={(item) => { setReviewItem(null); setPublishItem(item); }} onOpenNotifications={(item) => { setReviewItem(null); setNotificationItem(item); }} onPublish={(item) => { const published = publishManagedItem(item); if (published) setReviewItem(null); }} />}

        <Dialog open={publishIssues.length > 0} onOpenChange={(open) => { if (!open) { setPublishIssues([]); setPendingPublishItem(null); } }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>公開前に確認が必要です</DialogTitle>
              <DialogDescription>未完了のチェックがあります。仕様確認のため、確認後に強制公開する流れも表示できます。</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {publishIssues.map((issue) => <div key={issue.label} className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">{issue.label}</div>)}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setPublishIssues([]); setPendingPublishItem(null); }}>下書きに戻る</Button>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => {
                const published = pendingPublishItem ? publishManagedItem(pendingPublishItem, true) : publishCurrentForm(true);
                setPublishIssues([]);
                setPendingPublishItem(null);
                if (published) setShareItem(published);
              }}>確認して公開</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {jsonOpen && (
          <JsonAuthoringDialog
            open={jsonOpen}
            onOpenChange={setJsonOpen}
            jsonTab={jsonTab}
            setJsonTab={setJsonTab}
            jsonText={jsonText}
            setJsonText={setJsonText}
            jsonError={jsonError}
            prettyJson={prettyJson}
            copyJson={copyJson}
            importJson={importJson}
            currentForm={form}
          />
        )}
      </Suspense>

    </div>
  );
}
