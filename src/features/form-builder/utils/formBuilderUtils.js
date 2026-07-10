import {
  actionItems,
  auditLogSamples,
  confirmationTypeOptions,
  createdForms,
  notificationRuleSamples,
  recipientSamples,
  responseSamples,
  templates,
  versionHistory,
  visibilityOptions,
} from "../data/mockData";

export function safeId() {
  return crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createDefaultSettings(overrides = {}) {
  const settings = {
    visibility: "limited",
    deadline: "",
    acceptingResponses: true,
    headerImageUrl: "",
    themeColor: "#7c3aed",
    backgroundColor: "#f1f5f9",
    showProgress: true,
    requiredMarkStyle: "badge",
    collectEmail: true,
    anonymousResponses: false,
    limitOneResponse: false,
    allowEditAfterSubmit: false,
    sendReceipt: false,
    submitButtonLabel: "送信",
    confirmationType: "default",
    thankYouTitle: "ご回答ありがとうございました",
    thankYouMessage: "回答を受け付けました。",
    ...overrides,
  };
  return { ...settings, headerImageUrl: sanitizeImageUrl(settings.headerImageUrl) };
}

export function sanitizeImageUrl(value) {
  if (!value || typeof value !== "string") return "";
  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export function normalizeSettings(value) {
  const visibilityValues = visibilityOptions.map((option) => option.value);
  const confirmationTypeValues = confirmationTypeOptions.map((option) => option.value);
  return createDefaultSettings({
    visibility: visibilityValues.includes(value?.visibility) ? value.visibility : "limited",
    deadline: typeof value?.deadline === "string" ? value.deadline : "",
    acceptingResponses: typeof value?.acceptingResponses === "boolean" ? value.acceptingResponses : true,
    headerImageUrl: sanitizeImageUrl(value?.headerImageUrl),
    themeColor: typeof value?.themeColor === "string" ? value.themeColor : "#7c3aed",
    backgroundColor: typeof value?.backgroundColor === "string" ? value.backgroundColor : "#f1f5f9",
    showProgress: typeof value?.showProgress === "boolean" ? value.showProgress : true,
    requiredMarkStyle: ["badge", "asterisk"].includes(value?.requiredMarkStyle) ? value.requiredMarkStyle : "badge",
    collectEmail: typeof value?.collectEmail === "boolean" ? value.collectEmail : true,
    anonymousResponses: typeof value?.anonymousResponses === "boolean" ? value.anonymousResponses : false,
    limitOneResponse: typeof value?.limitOneResponse === "boolean" ? value.limitOneResponse : false,
    allowEditAfterSubmit: typeof value?.allowEditAfterSubmit === "boolean" ? value.allowEditAfterSubmit : false,
    sendReceipt: typeof value?.sendReceipt === "boolean" ? value.sendReceipt : false,
    submitButtonLabel: typeof value?.submitButtonLabel === "string" ? value.submitButtonLabel : "送信",
    confirmationType: confirmationTypeValues.includes(value?.confirmationType) ? value.confirmationType : "default",
    thankYouTitle: typeof value?.thankYouTitle === "string" ? value.thankYouTitle : "ご回答ありがとうございました",
    thankYouMessage: typeof value?.thankYouMessage === "string" ? value.thankYouMessage : "回答を受け付けました。",
  });
}

export function getVisibilityLabel(value) {
  return visibilityOptions.find((option) => option.value === value)?.label ?? visibilityOptions[1].label;
}

export function toDeadlineInputValue(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value.slice(0, 16);
  const match = value.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}T23:59`;
  return value;
}

export function formatDeadline(value) {
  if (!value) return "期限なし";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getVersionsForItem(item) {
  if (!item) return [];
  const storedVersions = getStoredVersionHistory();
  if (storedVersions[item.id]) return storedVersions[item.id];
  return versionHistory[item.id] ?? [
    { version: "v1", status: item.status, editor: "ログインユーザー", updatedAt: item.updatedAt, summary: "現在のフォーム定義", questions: 1, responses: item.responses ?? 0 },
  ];
}

export function getResponsesForItem(item) {
  if (!item) return [];
  const storedRecords = getStoredResponseRecords();
  return [...(storedRecords[item.id] ?? []), ...(responseSamples[item.id] ?? [])];
}

export function getRecipientsForItem(item) {
  return item ? recipientSamples[item.id] ?? [] : [];
}

export function getNotificationRulesForItem(item) {
  if (!item) return [];
  const storedRules = getStoredNotificationRules();
  return storedRules[item.id] ?? notificationRuleSamples[item.id] ?? [];
}

export function getRecipientCounts(recipients) {
  return {
    total: recipients.length,
    answered: recipients.filter((recipient) => recipient.status === "回答済み").length,
    pending: recipients.filter((recipient) => ["未回答", "リマインド済み", "未送信"].includes(recipient.status)).length,
  };
}

export function getFormForCreatedItem(item) {
  return createFormFromActionItem({ ...item, requester: "フォーム管理者", due: item?.deadline });
}

export function getPublishReviewSummary(item) {
  const form = getFormForCreatedItem(item);
  const recipients = getRecipientsForItem(item);
  const notificationRules = getNotificationRulesForItem(item);
  return {
    questionCount: form.questions.length,
    requiredCount: form.questions.filter((question) => question.required).length,
    sectionCount: normalizeSections(form.sections).length,
    recipientCount: recipients.length,
    enabledNotifications: notificationRules.filter((rule) => rule.enabled).length,
  };
}

export function getResponseAnswerKeys(responses) {
  return Array.from(new Set(responses.flatMap((response) => Object.keys(response.answers))));
}

export function escapeCsvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function buildResponsesCsv(item) {
  const responses = getResponsesForItem(item);
  const answerKeys = getResponseAnswerKeys(responses);
  const header = ["回答ID", "回答者", "送信日時", "ステータス", ...answerKeys];
  const rows = responses.map((response) => [response.id, response.respondent, response.submittedAt, response.status, ...answerKeys.map((key) => response.answers[key])]);
  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function downloadResponsesCsv(item) {
  const csv = buildResponsesCsv(item);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${item?.title ?? "responses"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function getStatusClassName(status) {
  if (["公開中", "確認済み", "承認済み"].includes(status)) return "bg-green-50 text-green-700";
  if (["下書き", "確認待ち", "承認待ち", "自動保存"].includes(status)) return "bg-amber-50 text-amber-700";
  if (["差し戻し", "却下", "非公開", "受付停止"].includes(status)) return "bg-red-50 text-red-700";
  if (["アーカイブ"].includes(status)) return "bg-slate-100 text-slate-500";
  return "bg-slate-100 text-slate-600";
}

export const supportedQuestionTypes = ["shortText", "paragraph", "email", "number", "date", "time", "radio", "checkbox", "select", "rating", "matrix", "file", "consent"];
const storedCreatedFormsKey = "form-builder-demo-created-forms";
const storedResponsesKey = "form-builder-demo-response-state";
const storedResponseRecordsKey = "form-builder-demo-response-records";
const storedAuditLogsKey = "form-builder-demo-audit-logs";
const storedNotificationRulesKey = "form-builder-demo-notification-rules";
const storedVersionHistoryKey = "form-builder-demo-version-history";
const demoStorageKeys = [storedCreatedFormsKey, storedResponsesKey, storedResponseRecordsKey, storedAuditLogsKey, storedNotificationRulesKey, storedVersionHistoryKey, "form-builder-demo-email"];

export function resetDemoStorage() {
  demoStorageKeys.forEach((key) => localStorage.removeItem(key));
}

export function getStoredCreatedForms() {
  try {
    const stored = JSON.parse(localStorage.getItem(storedCreatedFormsKey) || "[]");
    const storedForms = Array.isArray(stored) ? stored : [];
    const storedIds = new Set(storedForms.map((item) => item.id));
    return [...storedForms, ...createdForms.filter((item) => !storedIds.has(item.id))];
  } catch {
    return createdForms;
  }
}

export function persistStoredCreatedForms(items) {
  const localItems = items.filter((item) => item.id?.startsWith("local-") || item.form);
  localStorage.setItem(storedCreatedFormsKey, JSON.stringify(localItems));
}

export function formatNow() {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export function createCreatedItemFromForm(form, existingItem = {}, status = "下書き") {
  const settings = createDefaultSettings(form.settings);
  return {
    id: existingItem.id ?? `local-${safeId()}`,
    title: form.title || "無題のフォーム",
    status,
    updatedAt: formatNow(),
    responses: getResponsesForItem(existingItem).length,
    visibility: settings.visibility,
    deadline: settings.deadline,
    acceptingResponses: settings.acceptingResponses,
    templateId: existingItem.templateId ?? "custom",
    headerImageUrl: settings.headerImageUrl,
    confirmationType: settings.confirmationType,
    thankYouTitle: settings.thankYouTitle,
    thankYouMessage: settings.thankYouMessage,
    form: normalizeForm(form),
  };
}

export function upsertCreatedForm(items, form, activeFormId, status = "下書き") {
  const index = items.findIndex((item) => item.id === activeFormId);
  const existingItem = index >= 0 ? items[index] : {};
  const item = createCreatedItemFromForm(form, existingItem, status);
  const nextItems = index >= 0 ? items.map((candidate, candidateIndex) => candidateIndex === index ? item : candidate) : [item, ...items];
  persistStoredCreatedForms(nextItems);
  return { item, items: nextItems };
}

export function getStoredNotificationRules() {
  try {
    const rules = JSON.parse(localStorage.getItem(storedNotificationRulesKey) || "{}");
    return rules && typeof rules === "object" ? rules : {};
  } catch {
    return {};
  }
}

export function saveNotificationRules(item, rules, actor = "login@example.com") {
  const storedRules = getStoredNotificationRules();
  storedRules[item.id] = rules;
  localStorage.setItem(storedNotificationRulesKey, JSON.stringify(storedRules));
  appendAuditLog({ actor, action: "通知設定更新", target: item.title, detail: `${rules.filter((rule) => rule.enabled).length}件の通知ルールを有効化` });
}

export function getStoredVersionHistory() {
  try {
    const versions = JSON.parse(localStorage.getItem(storedVersionHistoryKey) || "{}");
    return versions && typeof versions === "object" ? versions : {};
  } catch {
    return {};
  }
}

export function appendVersionHistory(item, form, status, actor = "login@example.com", summary = "フォーム定義を更新") {
  const storedVersions = getStoredVersionHistory();
  const currentVersions = storedVersions[item.id] ?? versionHistory[item.id] ?? [];
  const nextNumber = currentVersions.length + 1;
  const nextVersion = {
    version: `v${nextNumber}`,
    status,
    editor: actor,
    updatedAt: formatNow(),
    summary,
    questions: form.questions?.length ?? 0,
    responses: getResponsesForItem(item).length,
  };
  storedVersions[item.id] = [nextVersion, ...currentVersions];
  localStorage.setItem(storedVersionHistoryKey, JSON.stringify(storedVersions));
  appendAuditLog({ actor, action: "版履歴追加", target: item.title, detail: `${nextVersion.version} ${status}` });
  return nextVersion;
}

export function getStoredResponseState(formId) {
  try {
    const state = JSON.parse(localStorage.getItem(storedResponsesKey) || "{}");
    return state[formId] ?? null;
  } catch {
    return null;
  }
}

export function setStoredResponseState(formId, value) {
  try {
    const state = JSON.parse(localStorage.getItem(storedResponsesKey) || "{}");
    state[formId] = value;
    localStorage.setItem(storedResponsesKey, JSON.stringify(state));
  } catch {
    localStorage.setItem(storedResponsesKey, JSON.stringify({ [formId]: value }));
  }
}

export function getStoredResponseRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(storedResponseRecordsKey) || "{}");
    return records && typeof records === "object" ? records : {};
  } catch {
    return {};
  }
}

export function persistStoredResponseRecords(records) {
  localStorage.setItem(storedResponseRecordsKey, JSON.stringify(records));
}

export function formatAnswerValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return Object.entries(value).map(([key, answer]) => `${key}: ${answer}`).join(" / ");
  if (typeof value === "boolean") return value ? "同意" : "未同意";
  return value ?? "";
}

export function getAuditLogs() {
  try {
    const storedLogs = JSON.parse(localStorage.getItem(storedAuditLogsKey) || "[]");
    return [...(Array.isArray(storedLogs) ? storedLogs : []), ...auditLogSamples];
  } catch {
    return auditLogSamples;
  }
}

export function appendAuditLog({ actor = "login@example.com", action, target, detail }) {
  try {
    const storedLogs = JSON.parse(localStorage.getItem(storedAuditLogsKey) || "[]");
    const nextLogs = [{ time: formatNow(), actor, action, target, detail }, ...(Array.isArray(storedLogs) ? storedLogs : [])].slice(0, 80);
    localStorage.setItem(storedAuditLogsKey, JSON.stringify(nextLogs));
  } catch {
    localStorage.setItem(storedAuditLogsKey, JSON.stringify([{ time: formatNow(), actor, action, target, detail }]));
  }
}

export function recordSubmittedResponse(form, values, respondentEmail) {
  const formId = form.id ?? form.title ?? "preview-form";
  const records = getStoredResponseRecords();
  const formRecords = Array.isArray(records[formId]) ? records[formId] : [];
  const questions = Array.isArray(form.questions) ? form.questions.map((question) => normalizeQuestion(question)) : [];
  const answers = Object.fromEntries(questions.map((question) => [question.title, formatAnswerValue(values[question.id]) || "-"]));
  const nextRecord = {
    id: `local-response-${safeId()}`,
    respondent: respondentEmail,
    submittedAt: formatNow(),
    status: "確認待ち",
    answers,
  };
  records[formId] = [nextRecord, ...formRecords.filter((record) => record.respondent !== respondentEmail)];
  persistStoredResponseRecords(records);
  appendAuditLog({ actor: respondentEmail, action: "回答送信", target: form.title, detail: `${questions.length}問の回答を送信` });
  return nextRecord;
}

export function updateResponseStatus(formId, responseId, status) {
  const records = getStoredResponseRecords();
  const formRecords = Array.isArray(records[formId]) ? records[formId] : [];
  records[formId] = formRecords.map((record) => record.id === responseId ? { ...record, status } : record);
  persistStoredResponseRecords(records);
}

export function duplicateCreatedForm(items, item) {
  const sourceForm = createFormFromActionItem(item);
  const copyForm = { ...sourceForm, title: `${sourceForm.title} のコピー` };
  const copyItem = createCreatedItemFromForm(copyForm, { id: `local-${safeId()}`, templateId: item.templateId }, "下書き");
  const nextItems = [copyItem, ...items];
  persistStoredCreatedForms(nextItems);
  appendAuditLog({ action: "フォーム複製", target: item.title, detail: `${copyItem.title} を作成` });
  return nextItems;
}

export function archiveCreatedForm(items, item) {
  const nextItems = items.map((candidate) => candidate.id === item.id ? { ...candidate, status: "アーカイブ", archived: true, updatedAt: formatNow() } : candidate);
  persistStoredCreatedForms(nextItems);
  appendAuditLog({ action: "フォームアーカイブ", target: item.title, detail: "作成済み一覧でアーカイブ表示に変更" });
  return nextItems;
}

export function deleteCreatedForm(items, item) {
  const nextItems = items.filter((candidate) => candidate.id !== item.id);
  persistStoredCreatedForms(nextItems);
  appendAuditLog({ action: "フォーム削除", target: item.title, detail: "ローカル保存フォームを一覧から削除" });
  return nextItems;
}

export function getBlockingPublishIssues(checklist) {
  return checklist.filter((item) => !item.ok);
}

export function getJsonDiffSummary(currentForm, nextForm) {
  const currentSections = normalizeSections(currentForm.sections);
  const nextSections = normalizeSections(nextForm.sections);
  const currentQuestions = Array.isArray(currentForm.questions) ? currentForm.questions.map((question) => normalizeQuestion(question)) : [];
  const nextQuestions = Array.isArray(nextForm.questions) ? nextForm.questions.map((question) => normalizeQuestion(question)) : [];
  const currentTypes = Array.from(new Set(currentQuestions.map((question) => question.type))).join(", ") || "なし";
  const nextTypes = Array.from(new Set(nextQuestions.map((question) => question.type))).join(", ") || "なし";
  return [
    { label: "タイトル", before: currentForm.title || "未設定", after: nextForm.title || "未設定", changed: (currentForm.title || "") !== (nextForm.title || "") },
    { label: "セクション数", before: `${currentSections.length}`, after: `${nextSections.length}`, changed: currentSections.length !== nextSections.length },
    { label: "質問数", before: `${currentQuestions.length}`, after: `${nextQuestions.length}`, changed: currentQuestions.length !== nextQuestions.length },
    { label: "必須質問", before: `${currentQuestions.filter((question) => question.required).length}`, after: `${nextQuestions.filter((question) => question.required).length}`, changed: currentQuestions.filter((question) => question.required).length !== nextQuestions.filter((question) => question.required).length },
    { label: "質問タイプ", before: currentTypes, after: nextTypes, changed: currentTypes !== nextTypes },
  ];
}

export function getPublishChecklistForForm(form, recipients = [], notificationRules = []) {
  const settings = createDefaultSettings(form.settings);
  const sections = normalizeSections(form.sections);
  const questions = Array.isArray(form.questions) ? form.questions.map((question) => normalizeQuestion(question)) : [];
  return [
    { label: "フォームタイトルと説明", ok: Boolean(form.title?.trim()) && Boolean(form.description?.trim()) },
    { label: "質問が1件以上ある", ok: questions.length > 0 },
    { label: "必須質問が設定されている", ok: questions.some((question) => question.required) },
    { label: "全質問がセクションに紐づいている", ok: questions.every((question) => sections.some((section) => section.id === question.sectionId)) },
    { label: "公開範囲が非公開ではない", ok: settings.visibility !== "private" },
    { label: "回答期限が設定されている", ok: Boolean(settings.deadline) },
    { label: "対象者または全体公開がある", ok: recipients.length > 0 || ["limited", "organization", "public"].includes(settings.visibility) },
    { label: "通知ルールが1件以上有効", ok: notificationRules.some((rule) => rule.enabled) },
    { label: "送信完了メッセージが確認済み", ok: settings.confirmationType !== "custom" || Boolean(settings.thankYouMessage?.trim()) },
  ];
}

export function validateAuthoringForm(value) {
  const errors = [];
  if (!value || typeof value !== "object") return ["JSONのルートはオブジェクトにしてください。"];
  if (!value.title || typeof value.title !== "string") errors.push("title は必須です。");
  if (!Array.isArray(value.sections) || value.sections.length === 0) errors.push("sections は1件以上必要です。");
  if (!Array.isArray(value.questions) || value.questions.length === 0) errors.push("questions は1件以上必要です。");
  const sectionNames = new Set((Array.isArray(value.sections) ? value.sections : []).map((section) => typeof section === "string" ? section : section?.title).filter(Boolean));

  (Array.isArray(value.questions) ? value.questions : []).forEach((question, index) => {
    const label = `questions[${index}]`;
    if (!supportedQuestionTypes.includes(question?.type)) errors.push(`${label}.type は対応していない形式です。`);
    if (!question?.title || typeof question.title !== "string") errors.push(`${label}.title は必須です。`);
    if (question?.section && !sectionNames.has(question.section)) errors.push(`${label}.section は sections に存在しません。`);
    if (["radio", "checkbox", "select"].includes(question?.type) && (!Array.isArray(question.options) || question.options.length === 0)) errors.push(`${label}.options は1件以上必要です。`);
    if (question?.type === "rating" && Number(question.scaleMin ?? 1) >= Number(question.scaleMax ?? 5)) errors.push(`${label}.scaleMin は scaleMax より小さくしてください。`);
    if (question?.type === "matrix" && (!Array.isArray(question.rows) || question.rows.length === 0 || !Array.isArray(question.columns) || question.columns.length === 0)) errors.push(`${label}.rows と columns は1件以上必要です。`);
    if (question?.type === "file" && Number(question.maxFiles ?? 1) < 1) errors.push(`${label}.maxFiles は1以上にしてください。`);
  });
  return errors;
}

export function withIds(q) {
  return normalizeQuestion({
    id: safeId(),
    sectionId: q.sectionId ?? "section-1",
    type: q.type,
    title: q.title,
    description: q.description ?? "",
    required: Boolean(q.required),
    options: q.options ?? [],
    branch: normalizeBranch(q.branch),
  });
}

export function questionHasOptions(type) {
  return ["radio", "checkbox", "select"].includes(type);
}

export function createDefaultValidation(overrides = {}) {
  return {
    format: "none",
    minLength: "",
    maxLength: "",
    min: "",
    max: "",
    errorMessage: "",
    ...overrides,
  };
}

export function normalizeValidation(value) {
  return createDefaultValidation({
    format: typeof value?.format === "string" ? value.format : "none",
    minLength: value?.minLength ?? "",
    maxLength: value?.maxLength ?? "",
    min: value?.min ?? "",
    max: value?.max ?? "",
    errorMessage: typeof value?.errorMessage === "string" ? value.errorMessage : "",
  });
}

export function createQuestionDefaults(type = "shortText") {
  const optionType = questionHasOptions(type);
  return {
    type,
    title: "新しい質問",
    description: "",
    showDescription: true,
    placeholder: "",
    example: "",
    required: false,
    options: optionType ? ["選択肢1", "選択肢2"] : [],
    allowOther: false,
    randomizeOptions: false,
    rows: type === "matrix" ? ["項目1", "項目2"] : [],
    columns: type === "matrix" ? ["満足", "普通", "不満"] : [],
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: "低い",
    scaleMaxLabel: "高い",
    fileTypes: ["PDF", "画像", "Officeファイル"],
    maxFiles: 1,
    consentText: "内容を確認し、同意します。",
    validation: createDefaultValidation(type === "email" ? { format: "email" } : {}),
    branch: normalizeBranch(),
    visibilityCondition: normalizeVisibilityCondition(),
  };
}

export function normalizeQuestion(value = {}) {
  const type = supportedQuestionTypes.includes(value.type) ? value.type : "shortText";
  const defaults = createQuestionDefaults(type);
  const scaleMin = Number(value.scaleMin ?? defaults.scaleMin);
  const scaleMax = Number(value.scaleMax ?? defaults.scaleMax);
  const maxFiles = Number(value.maxFiles ?? defaults.maxFiles);
  return {
    ...defaults,
    id: value.id ?? safeId(),
    sectionId: value.sectionId ?? "section-1",
    type,
    title: typeof value.title === "string" ? value.title : defaults.title,
    description: typeof value.description === "string" ? value.description : "",
    showDescription: typeof value.showDescription === "boolean" ? value.showDescription : true,
    placeholder: typeof value.placeholder === "string" ? value.placeholder : "",
    example: typeof value.example === "string" ? value.example : "",
    required: Boolean(value.required),
    options: Array.isArray(value.options) ? value.options : defaults.options,
    allowOther: Boolean(value.allowOther),
    randomizeOptions: Boolean(value.randomizeOptions),
    rows: Array.isArray(value.rows) ? value.rows : defaults.rows,
    columns: Array.isArray(value.columns) ? value.columns : defaults.columns,
    scaleMin: Number.isFinite(scaleMin) ? scaleMin : defaults.scaleMin,
    scaleMax: Number.isFinite(scaleMax) ? scaleMax : defaults.scaleMax,
    scaleMinLabel: typeof value.scaleMinLabel === "string" ? value.scaleMinLabel : defaults.scaleMinLabel,
    scaleMaxLabel: typeof value.scaleMaxLabel === "string" ? value.scaleMaxLabel : defaults.scaleMaxLabel,
    fileTypes: Array.isArray(value.fileTypes) ? value.fileTypes : defaults.fileTypes,
    maxFiles: Number.isFinite(maxFiles) && maxFiles > 0 ? maxFiles : defaults.maxFiles,
    consentText: typeof value.consentText === "string" ? value.consentText : defaults.consentText,
    validation: normalizeValidation(value.validation),
    branch: normalizeBranch(value.branch),
    visibilityCondition: normalizeVisibilityCondition(value.visibilityCondition),
  };
}

export function createDefaultSections() {
  return [{ id: "section-1", title: "基本情報", description: "" }];
}

export function createSection(title = "新しいセクション") {
  return { id: safeId(), title, description: "" };
}

export function normalizeSections(value) {
  if (!Array.isArray(value) || value.length === 0) return createDefaultSections();
  return value.map((section, index) => ({
    id: section && typeof section === "object" ? section.id ?? `section-${index + 1}` : `section-${index + 1}`,
    title: section && typeof section === "object" ? section.title ?? `セクション ${index + 1}` : section || `セクション ${index + 1}`,
    description: section && typeof section === "object" ? section.description ?? "" : "",
  }));
}

export function createSectionLookup(sections) {
  return new Map(sections.map((section) => [section.title, section.id]));
}

export function getSectionTitle(sections, sectionId) {
  return sections.find((section) => section.id === sectionId)?.title ?? sections[0]?.title ?? "基本情報";
}

export function normalizeImportBranch(value, sections) {
  const branch = normalizeBranch(value);
  const lookup = createSectionLookup(sections);
  const targetSection = value?.targetSection ?? value?.targetSectionTitle;
  if (targetSection === "送信完了" || targetSection === "__submit__") return { ...branch, targetSectionId: "__submit__" };
  if (typeof targetSection === "string" && lookup.has(targetSection)) return { ...branch, targetSectionId: lookup.get(targetSection) };
  return branch;
}

export function toAuthoringForm(value) {
  const sections = normalizeSections(value.sections);
  return {
    version: value.version ?? 1,
    title: value.title,
    description: value.description,
    settings: value.settings ?? createDefaultSettings(),
    sections: sections.map((section) => ({ title: section.title, description: section.description })),
    questions: value.questions.map((question) => {
      const normalizedQuestion = normalizeQuestion(question);
      const branch = normalizeBranch(question.branch);
      const authoringQuestion = {
        section: getSectionTitle(sections, normalizedQuestion.sectionId),
        type: normalizedQuestion.type,
        title: normalizedQuestion.title,
        description: normalizedQuestion.description,
        showDescription: normalizedQuestion.showDescription,
        placeholder: normalizedQuestion.placeholder,
        example: normalizedQuestion.example,
        required: normalizedQuestion.required,
        validation: normalizedQuestion.validation,
      };
      if (questionHasOptions(normalizedQuestion.type)) {
        authoringQuestion.options = normalizedQuestion.options;
        authoringQuestion.allowOther = normalizedQuestion.allowOther;
        authoringQuestion.randomizeOptions = normalizedQuestion.randomizeOptions;
      }
      if (normalizedQuestion.type === "rating") {
        authoringQuestion.scaleMin = normalizedQuestion.scaleMin;
        authoringQuestion.scaleMax = normalizedQuestion.scaleMax;
        authoringQuestion.scaleMinLabel = normalizedQuestion.scaleMinLabel;
        authoringQuestion.scaleMaxLabel = normalizedQuestion.scaleMaxLabel;
      }
      if (normalizedQuestion.type === "matrix") {
        authoringQuestion.rows = normalizedQuestion.rows;
        authoringQuestion.columns = normalizedQuestion.columns;
      }
      if (normalizedQuestion.type === "file") {
        authoringQuestion.fileTypes = normalizedQuestion.fileTypes;
        authoringQuestion.maxFiles = normalizedQuestion.maxFiles;
      }
      if (normalizedQuestion.type === "consent") authoringQuestion.consentText = normalizedQuestion.consentText;
      if (branch.enabled) {
        authoringQuestion.branch = {
          enabled: true,
          option: branch.option,
          targetSection: branch.targetSectionId === "__submit__" ? "送信完了" : getSectionTitle(sections, branch.targetSectionId),
        };
      }
      if (normalizedQuestion.visibilityCondition.enabled) authoringQuestion.visibilityCondition = normalizedQuestion.visibilityCondition;
      return authoringQuestion;
    }),
  };
}

export function normalizeBranch(value) {
  return {
    enabled: Boolean(value?.enabled),
    option: typeof value?.option === "string" ? value.option : "",
    targetSectionId: typeof value?.targetSectionId === "string" ? value.targetSectionId : "",
  };
}

export function normalizeVisibilityCondition(value) {
  return {
    enabled: Boolean(value?.enabled),
    questionId: typeof value?.questionId === "string" ? value.questionId : "",
    option: typeof value?.option === "string" ? value.option : "",
  };
}

export function getTemplateSections(template) {
  if (template.questions.length <= 6) return createDefaultSections();
  return [
    { id: "section-1", title: "基本情報", description: "回答者と概要を確認します。" },
    { id: "section-2", title: "希望・選択", description: "希望内容や選択項目を確認します。" },
    { id: "section-3", title: "詳細確認", description: "補足事項を入力します。" },
  ];
}

export function getSectionIdForTemplateQuestion(template, index) {
  if (template.questions.length <= 6) return "section-1";
  if (index < Math.ceil(template.questions.length / 3)) return "section-1";
  if (index < Math.ceil((template.questions.length * 2) / 3)) return "section-2";
  return "section-3";
}

export function createBlankForm() {
  return {
    version: 1,
    title: "無題のフォーム",
    description: "フォームの説明を入力してください。",
    settings: createDefaultSettings(),
    sections: createDefaultSections(),
    questions: [{ id: safeId(), sectionId: "section-1", type: "shortText", title: "氏名", description: "", required: true, options: [], branch: normalizeBranch() }],
  };
}

export function createFormFromTemplate(template) {
  return {
    version: 1,
    title: template.title,
    description: template.description,
    settings: createDefaultSettings(),
    sections: getTemplateSections(template),
    questions: template.questions.map((question, index) => withIds({ ...question, sectionId: getSectionIdForTemplateQuestion(template, index) })),
  };
}

export function createFormFromActionItem(item) {
  if (item?.form) return { ...normalizeForm(item.form), id: item.id };
  const template = templates.find((candidate) => candidate.id === item?.templateId) ?? templates[0];
  return {
    id: item?.id,
    ...createFormFromTemplate(template),
    title: item?.title ?? template.title,
    description: `${item?.requester ?? "担当者"} から依頼された回答フォームです。`,
    settings: createDefaultSettings({
      visibility: item?.visibility ?? "limited",
      deadline: toDeadlineInputValue(item?.due),
      acceptingResponses: item?.acceptingResponses ?? true,
      headerImageUrl: item?.headerImageUrl ?? "",
      confirmationType: item?.confirmationType ?? "default",
      thankYouTitle: item?.thankYouTitle ?? "ご回答ありがとうございました",
      thankYouMessage: item?.thankYouMessage ?? "回答を受け付けました。",
    }),
  };
}

export function getRespondentActionId() {
  const match = window.location.hash.match(/^#\/respond\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function getRespondentFormFromHash() {
  const actionId = getRespondentActionId();
  if (!actionId) return null;
  const item = actionItems.find((candidate) => candidate.id === actionId) ?? getStoredCreatedForms().find((candidate) => candidate.id === actionId);
  return item ? createFormFromActionItem(item) : null;
}

export function getRespondentUrl(item) {
  return `${window.location.origin}${window.location.pathname}#/respond/${encodeURIComponent(item.id)}`;
}

export function getStoredLoginEmail() {
  return localStorage.getItem("form-builder-demo-email") || "login@example.com";
}

export function createQuestion(type = "shortText") {
  return normalizeQuestion({ ...createQuestionDefaults(type), id: safeId(), sectionId: "section-1" });
}

export function normalizeForm(value) {
  if (!value || typeof value !== "object") throw new Error("JSONの形式が不正です。");
  const sections = normalizeSections(value.sections);
  const sectionLookup = createSectionLookup(sections);
  return {
    version: value.version ?? 1,
    title: value.title ?? "無題のフォーム",
    description: value.description ?? "",
    settings: normalizeSettings(value.settings),
    sections,
    questions: Array.isArray(value.questions) ? value.questions.map((question) => normalizeQuestion({
      ...question,
      id: question.id ?? safeId(),
      sectionId: question.sectionId ?? sectionLookup.get(question.section) ?? sectionLookup.get(question.sectionTitle) ?? sections[0]?.id ?? "section-1",
      type: question.type ?? "shortText",
      title: question.title ?? "無題の質問",
      branch: normalizeImportBranch(question.branch, sections),
    })) : [],
  };
}
