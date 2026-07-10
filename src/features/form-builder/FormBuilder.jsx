import { useMemo, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FaBell,
  FaBriefcase,
  FaBullhorn,
  FaCalendarDays,
  FaCheck,
  FaCode,
  FaCopy,
  FaEye,
  FaFileCirclePlus,
  FaGear,
  FaGlobe,
  FaGripVertical,
  FaHouse,
  FaKey,
  FaLayerGroup,
  FaLock,
  FaPen,
  FaPlus,
  FaRegClock,
  FaRightFromBracket,
  FaTrash,
  FaUser,
} from "react-icons/fa6";

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

const visibilityOptions = [
  { value: "private", label: "非公開", description: "作成者だけが確認できます。" },
  { value: "limited", label: "リンクを知っている人", description: "URLを知っている人が回答できます。" },
  { value: "organization", label: "組織内", description: "社内ユーザーだけが回答できます。" },
  { value: "public", label: "全体公開", description: "誰でも回答できます。" },
];

const confirmationTypeOptions = [
  { value: "default", label: "デフォルト" },
  { value: "custom", label: "お礼メッセージを表示" },
];

const sampleHeaderImageUrl = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80";
const maxJsonImportLength = 200000;
const llmPromptExample = `Googleフォーム風のフォーム定義JSONを作ってください。
目的: 研修参加申請フォーム
対象者: 社内の受講希望者
出力条件:
- JSONだけを出力する
- idやsectionIdなど内部IDは書かない
- sectionsはtitleとdescriptionだけを書く
- questionsはsection, type, title, description, required, optionsを書く
- typeはshortText, paragraph, radio, checkbox, selectのいずれか
- 分岐が必要な場合はbranch.enabled, branch.option, branch.targetSectionを書く
- targetSectionはセクション名、送信完了に進める場合は「送信完了」と書く
- settingsには公開範囲、期限、受付状態、送信完了メッセージを含める`;

const templates = [
  {
    id: "training",
    title: "研修参加申請",
    description: "参加者情報、希望日程、事前要望を集めるテンプレートです。",
    icon: FaBriefcase,
    tag: "申請",
    questions: [
      { type: "shortText", title: "氏名", description: "", required: true, options: [] },
      { type: "shortText", title: "所属部署", description: "", required: true, options: [] },
      { type: "radio", title: "希望日程", description: "第一希望を選択してください。", required: true, options: ["7月15日", "7月22日", "7月29日"] },
      { type: "paragraph", title: "事前に確認したいこと", description: "任意で入力してください。", required: false, options: [] },
      { type: "checkbox", title: "参加目的", description: "当てはまるものを選択してください。", required: true, options: ["基礎理解", "業務改善", "資格取得", "チーム展開", "その他"] },
      { type: "select", title: "受講形式", description: "希望する受講方法を選択してください。", required: true, options: ["会場参加", "オンライン", "録画視聴", "どれでもよい"] },
      { type: "paragraph", title: "上長への共有事項", description: "事前に伝えておきたいことがあれば入力してください。", required: false, options: [] },
      { type: "shortText", title: "緊急連絡先", description: "当日の連絡先を入力してください。", required: false, options: [] },
    ],
  },
  {
    id: "survey",
    title: "満足度アンケート",
    description: "イベントや説明会の満足度、改善要望を集めるテンプレートです。",
    icon: FaBullhorn,
    tag: "アンケート",
    questions: [
      { type: "radio", title: "全体の満足度", description: "最も近いものを選択してください。", required: true, options: ["満足", "やや満足", "普通", "やや不満", "不満"] },
      { type: "checkbox", title: "よかった点", description: "複数選択できます。", required: false, options: ["内容", "進行", "資料", "会場", "質疑応答"] },
      { type: "paragraph", title: "改善してほしい点", description: "自由に入力してください。", required: false, options: [] },
      { type: "radio", title: "資料の分かりやすさ", description: "資料について評価してください。", required: true, options: ["とても分かりやすい", "分かりやすい", "普通", "分かりにくい"] },
      { type: "radio", title: "今後の参加意向", description: "同様の企画があれば参加したいですか。", required: true, options: ["参加したい", "内容による", "参加しない"] },
      { type: "paragraph", title: "次回扱ってほしいテーマ", description: "任意で入力してください。", required: false, options: [] },
    ],
  },
  {
    id: "purchase",
    title: "備品購入依頼",
    description: "購入したい備品、理由、希望納期を申請するテンプレートです。",
    icon: FaLayerGroup,
    tag: "社内申請",
    questions: [
      { type: "shortText", title: "申請者名", description: "", required: true, options: [] },
      { type: "shortText", title: "購入希望品名", description: "", required: true, options: [] },
      { type: "select", title: "購入理由", description: "", required: true, options: ["新規購入", "故障交換", "追加購入", "その他"] },
      { type: "paragraph", title: "詳細理由", description: "必要性や用途を入力してください。", required: true, options: [] },
      { type: "shortText", title: "概算金額", description: "税込の見込み金額を入力してください。", required: true, options: [] },
      { type: "select", title: "希望納期", description: "", required: true, options: ["今週中", "今月中", "来月中", "急ぎではない"] },
      { type: "paragraph", title: "購入先候補", description: "URLや店舗名があれば入力してください。", required: false, options: [] },
    ],
  },
  {
    id: "onboarding",
    title: "入社オンボーディング確認",
    description: "新入社員の準備状況、配属前の不安、必要なサポートを確認します。",
    icon: FaUser,
    tag: "人事",
    questions: [
      { type: "shortText", title: "氏名", description: "", required: true, options: [] },
      { type: "shortText", title: "配属予定部署", description: "", required: true, options: [] },
      { type: "radio", title: "入社手続きの進捗", description: "現在の状況を選択してください。", required: true, options: ["完了", "一部未完了", "未着手", "確認中"] },
      { type: "checkbox", title: "受け取り済みの備品", description: "複数選択できます。", required: false, options: ["PC", "社員証", "入館カード", "メールアカウント", "チャットアカウント"] },
      { type: "select", title: "初日の勤務形態", description: "", required: true, options: ["出社", "リモート", "未定"] },
      { type: "paragraph", title: "入社前に不安なこと", description: "任意で入力してください。", required: false, options: [] },
      { type: "checkbox", title: "事前に知りたい内容", description: "", required: false, options: ["業務内容", "評価制度", "チーム体制", "利用ツール", "福利厚生"] },
      { type: "paragraph", title: "メンターに相談したいこと", description: "任意で入力してください。", required: false, options: [] },
      { type: "shortText", title: "緊急連絡先", description: "任意で入力してください。", required: false, options: [] },
      { type: "paragraph", title: "その他連絡事項", description: "", required: false, options: [] },
    ],
  },
  {
    id: "incident",
    title: "インシデント一次報告",
    description: "発生状況、影響範囲、初動対応を整理して報告します。",
    icon: FaBell,
    tag: "報告",
    questions: [
      { type: "shortText", title: "報告者", description: "", required: true, options: [] },
      { type: "shortText", title: "発生日時", description: "分かる範囲で入力してください。", required: true, options: [] },
      { type: "select", title: "影響度", description: "", required: true, options: ["高", "中", "低", "調査中"] },
      { type: "checkbox", title: "影響を受けた範囲", description: "複数選択できます。", required: true, options: ["顧客", "社内ユーザー", "外部連携", "データ", "インフラ", "不明"] },
      { type: "paragraph", title: "発生内容", description: "確認できている事実を入力してください。", required: true, options: [] },
      { type: "paragraph", title: "初動対応", description: "すでに実施した対応を入力してください。", required: true, options: [] },
      { type: "radio", title: "現在の状態", description: "", required: true, options: ["継続中", "復旧済み", "再発監視中", "不明"] },
      { type: "paragraph", title: "関係者への連絡状況", description: "連絡済みの相手や未連絡の相手を入力してください。", required: false, options: [] },
      { type: "paragraph", title: "次に必要な対応", description: "", required: false, options: [] },
    ],
  },
  {
    id: "equipmentAudit",
    title: "備品利用状況確認",
    description: "貸与備品の保有状況、利用頻度、交換希望を確認します。",
    icon: FaLayerGroup,
    tag: "棚卸し",
    questions: [
      { type: "shortText", title: "氏名", description: "", required: true, options: [] },
      { type: "shortText", title: "所属部署", description: "", required: true, options: [] },
      { type: "checkbox", title: "現在利用中の備品", description: "複数選択できます。", required: true, options: ["ノートPC", "モニター", "キーボード", "マウス", "ヘッドセット", "スマートフォン", "その他"] },
      { type: "radio", title: "PCの状態", description: "", required: true, options: ["問題なし", "やや不調", "交換希望", "利用していない"] },
      { type: "paragraph", title: "不具合の詳細", description: "不調や交換希望がある場合に入力してください。", required: false, options: [] },
      { type: "select", title: "利用頻度", description: "", required: true, options: ["毎日", "週数回", "月数回", "ほぼ利用なし"] },
      { type: "paragraph", title: "返却予定の備品", description: "返却予定があれば入力してください。", required: false, options: [] },
      { type: "paragraph", title: "追加で必要な備品", description: "業務上必要なものがあれば入力してください。", required: false, options: [] },
    ],
  },
];

const actionItems = [
  { id: "a1", title: "研修参加申請フォーム", requester: "人材開発チーム", due: "2026/07/12", status: "未回答", visibility: "organization", templateId: "training", headerImageUrl: sampleHeaderImageUrl, confirmationType: "custom", thankYouTitle: "申請を受け付けました", thankYouMessage: "研修事務局で内容を確認し、参加可否をメールでお知らせします。" },
  { id: "a2", title: "満足度アンケート", requester: "イベント事務局", due: "2026/07/15", status: "未回答", visibility: "limited", templateId: "survey" },
  { id: "a3", title: "備品利用状況確認", requester: "総務チーム", due: "2026/07/19", status: "受付停止", visibility: "organization", templateId: "equipmentAudit", acceptingResponses: false },
];

const createdForms = [
  { id: "c1", title: "研修参加申請フォーム", status: "公開中", updatedAt: "2026/07/08 18:20", responses: 12, visibility: "organization", deadline: "2026-07-31T17:00", templateId: "training", headerImageUrl: sampleHeaderImageUrl, confirmationType: "custom", thankYouTitle: "申請を受け付けました", thankYouMessage: "研修事務局で内容を確認し、参加可否をメールでお知らせします。" },
  { id: "c2", title: "満足度アンケート", status: "下書き", updatedAt: "2026/07/07 15:10", responses: 0, visibility: "limited", deadline: "", templateId: "survey" },
  { id: "c3", title: "備品購入依頼フォーム", status: "非公開", updatedAt: "2026/07/05 09:45", responses: 3, visibility: "private", deadline: "2026-07-20T23:59", templateId: "purchase", acceptingResponses: false },
];

const versionHistory = {
  c1: [
    { version: "v3", status: "公開中", editor: "山田 花子", updatedAt: "2026/07/08 18:20", summary: "ヘッダー画像と送信完了メッセージを追加", questions: 8, responses: 12 },
    { version: "v2", status: "公開終了", editor: "佐藤 健", updatedAt: "2026/07/06 11:05", summary: "受講形式と上長共有事項を追加", questions: 7, responses: 5 },
    { version: "v1", status: "初回公開", editor: "山田 花子", updatedAt: "2026/07/01 09:30", summary: "テンプレートから初回作成", questions: 5, responses: 0 },
  ],
  c2: [
    { version: "v2", status: "下書き", editor: "イベント事務局", updatedAt: "2026/07/07 15:10", summary: "資料評価と次回テーマの質問を追加", questions: 6, responses: 0 },
    { version: "v1", status: "下書き保存", editor: "イベント事務局", updatedAt: "2026/07/06 16:40", summary: "満足度アンケートの初期案を作成", questions: 3, responses: 0 },
  ],
  c3: [
    { version: "v2", status: "非公開", editor: "総務チーム", updatedAt: "2026/07/05 09:45", summary: "概算金額と希望納期を必須化", questions: 7, responses: 3 },
    { version: "v1", status: "公開終了", editor: "総務チーム", updatedAt: "2026/07/02 13:20", summary: "備品購入依頼の受付を開始", questions: 5, responses: 3 },
  ],
};

const responseSamples = {
  c1: [
    { id: "r-1001", respondent: "tanaka@example.com", submittedAt: "2026/07/09 09:12", status: "確認待ち", answers: { 氏名: "田中 一郎", 所属部署: "営業部", 希望日程: "7月15日", 参加目的: "基礎理解, 業務改善", 受講形式: "オンライン" } },
    { id: "r-1002", respondent: "suzuki@example.com", submittedAt: "2026/07/09 10:48", status: "確認済み", answers: { 氏名: "鈴木 美咲", 所属部署: "開発部", 希望日程: "7月22日", 参加目的: "チーム展開", 受講形式: "会場参加" } },
    { id: "r-1003", respondent: "kato@example.com", submittedAt: "2026/07/10 08:35", status: "差し戻し", answers: { 氏名: "加藤 翔", 所属部署: "人事部", 希望日程: "7月29日", 参加目的: "資格取得", 受講形式: "録画視聴" } },
  ],
  c2: [],
  c3: [
    { id: "r-2001", respondent: "ito@example.com", submittedAt: "2026/07/05 11:02", status: "承認待ち", answers: { 申請者名: "伊藤 玲奈", 購入希望品名: "27インチモニター", 購入理由: "追加購入", 概算金額: "42,000円", 希望納期: "今月中" } },
    { id: "r-2002", respondent: "mori@example.com", submittedAt: "2026/07/05 12:18", status: "承認済み", answers: { 申請者名: "森 健太", 購入希望品名: "Webカメラ", 購入理由: "故障交換", 概算金額: "8,500円", 希望納期: "今週中" } },
    { id: "r-2003", respondent: "abe@example.com", submittedAt: "2026/07/05 16:44", status: "却下", answers: { 申請者名: "阿部 真央", 購入希望品名: "タブレット", 購入理由: "新規購入", 概算金額: "89,000円", 希望納期: "来月中" } },
  ],
};

const collaboratorSamples = [
  { name: "山田 花子", role: "オーナー", permission: "編集・公開・回答閲覧" },
  { name: "佐藤 健", role: "編集者", permission: "編集・プレビュー" },
  { name: "人材開発チーム", role: "閲覧者", permission: "回答閲覧・CSV出力" },
];

const publishChecklist = ["フォームタイトルと説明", "必須質問の設定", "公開範囲", "公開期限", "送信完了メッセージ", "回答リンクの確認"];

const recipientSamples = {
  c1: [
    { name: "田中 一郎", email: "tanaka@example.com", department: "営業部", status: "回答済み", lastContact: "2026/07/09 08:30" },
    { name: "鈴木 美咲", email: "suzuki@example.com", department: "開発部", status: "回答済み", lastContact: "2026/07/09 08:30" },
    { name: "加藤 翔", email: "kato@example.com", department: "人事部", status: "回答済み", lastContact: "2026/07/09 08:30" },
    { name: "中村 葵", email: "nakamura@example.com", department: "営業部", status: "未回答", lastContact: "2026/07/10 09:00" },
    { name: "小林 悠", email: "kobayashi@example.com", department: "総務部", status: "リマインド済み", lastContact: "2026/07/10 09:00" },
  ],
  c2: [
    { name: "イベント参加者グループ", email: "event-members@example.com", department: "配布リスト", status: "未送信", lastContact: "-" },
  ],
  c3: [
    { name: "伊藤 玲奈", email: "ito@example.com", department: "経理部", status: "回答済み", lastContact: "2026/07/05 10:00" },
    { name: "森 健太", email: "mori@example.com", department: "開発部", status: "回答済み", lastContact: "2026/07/05 10:00" },
    { name: "阿部 真央", email: "abe@example.com", department: "営業部", status: "回答済み", lastContact: "2026/07/05 10:00" },
  ],
};

const notificationRuleSamples = {
  c1: [
    { label: "回答依頼", timing: "公開直後", channel: "メール", enabled: true, subject: "研修参加申請フォームへの回答依頼" },
    { label: "期限前リマインド", timing: "期限3日前 09:00", channel: "メール", enabled: true, subject: "研修参加申請フォームの回答期限が近づいています" },
    { label: "未回答者リマインド", timing: "期限前日 09:00", channel: "メール", enabled: true, subject: "未回答のフォームがあります" },
    { label: "受付終了通知", timing: "期限到達時", channel: "メール", enabled: false, subject: "研修参加申請フォームの受付を終了しました" },
  ],
  c2: [
    { label: "回答依頼", timing: "公開時", channel: "メール", enabled: false, subject: "満足度アンケートへの回答依頼" },
    { label: "回答完了通知", timing: "回答送信時", channel: "メール", enabled: true, subject: "アンケート回答を受け付けました" },
  ],
  c3: [
    { label: "回答依頼", timing: "公開直後", channel: "メール", enabled: true, subject: "備品購入依頼フォームへの回答依頼" },
    { label: "受付停止通知", timing: "受付停止時", channel: "メール", enabled: true, subject: "備品購入依頼フォームの受付を停止しました" },
  ],
};

const auditLogSamples = [
  { time: "2026/07/10 09:15", actor: "山田 花子", action: "回答CSVを出力", target: "研修参加申請フォーム", detail: "回答3件をCSVダウンロード" },
  { time: "2026/07/10 09:00", actor: "山田 花子", action: "リマインド送信", target: "研修参加申請フォーム", detail: "未回答者2名に送信" },
  { time: "2026/07/08 18:20", actor: "山田 花子", action: "フォーム公開", target: "研修参加申請フォーム", detail: "v3を組織内公開" },
  { time: "2026/07/08 18:05", actor: "佐藤 健", action: "JSONインポート", target: "研修参加申請フォーム", detail: "質問8件、セクション3件を反映" },
  { time: "2026/07/07 15:10", actor: "イベント事務局", action: "下書き保存", target: "満足度アンケート", detail: "通知設定は未送信" },
  { time: "2026/07/05 09:45", actor: "総務チーム", action: "受付停止", target: "備品購入依頼フォーム", detail: "非公開へ変更" },
];

const stateScenarios = [
  { id: "emptyResponses", title: "回答0件", description: "回答管理で空状態を表示します。" },
  { id: "noPermission", title: "権限なし", description: "閲覧権限がない場合のエラー表示です。" },
  { id: "deadlineExpired", title: "期限切れ", description: "回答期限を過ぎた回答画面です。" },
  { id: "alreadyAnswered", title: "回答済み", description: "1人1回回答の再アクセス時です。" },
  { id: "jsonError", title: "JSON取込エラー", description: "LLM生成JSONの形式不備です。" },
  { id: "csvError", title: "CSV取込エラー", description: "回答者CSVの列不足です。" },
];

function safeId() {
  return crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createDefaultSettings(overrides = {}) {
  const settings = {
    visibility: "limited",
    deadline: "",
    acceptingResponses: true,
    headerImageUrl: "",
    confirmationType: "default",
    thankYouTitle: "ご回答ありがとうございました",
    thankYouMessage: "回答を受け付けました。",
    ...overrides,
  };
  return { ...settings, headerImageUrl: sanitizeImageUrl(settings.headerImageUrl) };
}

function sanitizeImageUrl(value) {
  if (!value || typeof value !== "string") return "";
  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function normalizeSettings(value) {
  const visibilityValues = visibilityOptions.map((option) => option.value);
  const confirmationTypeValues = confirmationTypeOptions.map((option) => option.value);
  return createDefaultSettings({
    visibility: visibilityValues.includes(value?.visibility) ? value.visibility : "limited",
    deadline: typeof value?.deadline === "string" ? value.deadline : "",
    acceptingResponses: typeof value?.acceptingResponses === "boolean" ? value.acceptingResponses : true,
    headerImageUrl: sanitizeImageUrl(value?.headerImageUrl),
    confirmationType: confirmationTypeValues.includes(value?.confirmationType) ? value.confirmationType : "default",
    thankYouTitle: typeof value?.thankYouTitle === "string" ? value.thankYouTitle : "ご回答ありがとうございました",
    thankYouMessage: typeof value?.thankYouMessage === "string" ? value.thankYouMessage : "回答を受け付けました。",
  });
}

function getVisibilityLabel(value) {
  return visibilityOptions.find((option) => option.value === value)?.label ?? visibilityOptions[1].label;
}

function toDeadlineInputValue(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value.slice(0, 16);
  const match = value.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}T23:59`;
  return value;
}

function formatDeadline(value) {
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

function getVersionsForItem(item) {
  if (!item) return [];
  return versionHistory[item.id] ?? [
    { version: "v1", status: item.status, editor: "ログインユーザー", updatedAt: item.updatedAt, summary: "現在のフォーム定義", questions: 1, responses: item.responses ?? 0 },
  ];
}

function getResponsesForItem(item) {
  return item ? responseSamples[item.id] ?? [] : [];
}

function getRecipientsForItem(item) {
  return item ? recipientSamples[item.id] ?? [] : [];
}

function getNotificationRulesForItem(item) {
  return item ? notificationRuleSamples[item.id] ?? [] : [];
}

function getRecipientCounts(recipients) {
  return {
    total: recipients.length,
    answered: recipients.filter((recipient) => recipient.status === "回答済み").length,
    pending: recipients.filter((recipient) => ["未回答", "リマインド済み", "未送信"].includes(recipient.status)).length,
  };
}

function getFormForCreatedItem(item) {
  return createFormFromActionItem({ ...item, requester: "フォーム管理者", due: item?.deadline });
}

function getPublishReviewSummary(item) {
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

function getResponseAnswerKeys(responses) {
  return Array.from(new Set(responses.flatMap((response) => Object.keys(response.answers))));
}

function escapeCsvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function buildResponsesCsv(item) {
  const responses = getResponsesForItem(item);
  const answerKeys = getResponseAnswerKeys(responses);
  const header = ["回答ID", "回答者", "送信日時", "ステータス", ...answerKeys];
  const rows = responses.map((response) => [response.id, response.respondent, response.submittedAt, response.status, ...answerKeys.map((key) => response.answers[key])]);
  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function downloadResponsesCsv(item) {
  const csv = buildResponsesCsv(item);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${item?.title ?? "responses"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function getStatusClassName(status) {
  if (["公開中", "確認済み", "承認済み"].includes(status)) return "bg-green-50 text-green-700";
  if (["下書き", "確認待ち", "承認待ち"].includes(status)) return "bg-amber-50 text-amber-700";
  if (["差し戻し", "却下", "非公開", "受付停止"].includes(status)) return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
}

function withIds(q) {
  return {
    id: safeId(),
    sectionId: q.sectionId ?? "section-1",
    type: q.type,
    title: q.title,
    description: q.description ?? "",
    required: Boolean(q.required),
    options: q.options ?? [],
    branch: normalizeBranch(q.branch),
  };
}

function createDefaultSections() {
  return [{ id: "section-1", title: "基本情報", description: "" }];
}

function createSection(title = "新しいセクション") {
  return { id: safeId(), title, description: "" };
}

function normalizeSections(value) {
  if (!Array.isArray(value) || value.length === 0) return createDefaultSections();
  return value.map((section, index) => ({
    id: section && typeof section === "object" ? section.id ?? `section-${index + 1}` : `section-${index + 1}`,
    title: section && typeof section === "object" ? section.title ?? `セクション ${index + 1}` : section || `セクション ${index + 1}`,
    description: section && typeof section === "object" ? section.description ?? "" : "",
  }));
}

function createSectionLookup(sections) {
  return new Map(sections.map((section) => [section.title, section.id]));
}

function getSectionTitle(sections, sectionId) {
  return sections.find((section) => section.id === sectionId)?.title ?? sections[0]?.title ?? "基本情報";
}

function normalizeImportBranch(value, sections) {
  const branch = normalizeBranch(value);
  const lookup = createSectionLookup(sections);
  const targetSection = value?.targetSection ?? value?.targetSectionTitle;
  if (targetSection === "送信完了" || targetSection === "__submit__") return { ...branch, targetSectionId: "__submit__" };
  if (typeof targetSection === "string" && lookup.has(targetSection)) return { ...branch, targetSectionId: lookup.get(targetSection) };
  return branch;
}

function toAuthoringForm(value) {
  const sections = normalizeSections(value.sections);
  return {
    version: value.version ?? 1,
    title: value.title,
    description: value.description,
    settings: value.settings ?? createDefaultSettings(),
    sections: sections.map((section) => ({ title: section.title, description: section.description })),
    questions: value.questions.map((question) => {
      const branch = normalizeBranch(question.branch);
      const authoringQuestion = {
        section: getSectionTitle(sections, question.sectionId),
        type: question.type,
        title: question.title,
        description: question.description,
        required: question.required,
      };
      if (["radio", "checkbox", "select"].includes(question.type)) authoringQuestion.options = question.options;
      if (branch.enabled) {
        authoringQuestion.branch = {
          enabled: true,
          option: branch.option,
          targetSection: branch.targetSectionId === "__submit__" ? "送信完了" : getSectionTitle(sections, branch.targetSectionId),
        };
      }
      return authoringQuestion;
    }),
  };
}

function normalizeBranch(value) {
  return {
    enabled: Boolean(value?.enabled),
    option: typeof value?.option === "string" ? value.option : "",
    targetSectionId: typeof value?.targetSectionId === "string" ? value.targetSectionId : "",
  };
}

function getTemplateSections(template) {
  if (template.questions.length <= 6) return createDefaultSections();
  return [
    { id: "section-1", title: "基本情報", description: "回答者と概要を確認します。" },
    { id: "section-2", title: "希望・選択", description: "希望内容や選択項目を確認します。" },
    { id: "section-3", title: "詳細確認", description: "補足事項を入力します。" },
  ];
}

function getSectionIdForTemplateQuestion(template, index) {
  if (template.questions.length <= 6) return "section-1";
  if (index < Math.ceil(template.questions.length / 3)) return "section-1";
  if (index < Math.ceil((template.questions.length * 2) / 3)) return "section-2";
  return "section-3";
}

function createBlankForm() {
  return {
    version: 1,
    title: "無題のフォーム",
    description: "フォームの説明を入力してください。",
    settings: createDefaultSettings(),
    sections: createDefaultSections(),
    questions: [{ id: safeId(), sectionId: "section-1", type: "shortText", title: "氏名", description: "", required: true, options: [], branch: normalizeBranch() }],
  };
}

function createFormFromTemplate(template) {
  return {
    version: 1,
    title: template.title,
    description: template.description,
    settings: createDefaultSettings(),
    sections: getTemplateSections(template),
    questions: template.questions.map((question, index) => withIds({ ...question, sectionId: getSectionIdForTemplateQuestion(template, index) })),
  };
}

function createFormFromActionItem(item) {
  const template = templates.find((candidate) => candidate.id === item?.templateId) ?? templates[0];
  return {
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

function getRespondentActionId() {
  const match = window.location.hash.match(/^#\/respond\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function getRespondentFormFromHash() {
  const actionId = getRespondentActionId();
  if (!actionId) return null;
  const item = actionItems.find((candidate) => candidate.id === actionId) ?? createdForms.find((candidate) => candidate.id === actionId);
  return item ? createFormFromActionItem(item) : null;
}

function getRespondentUrl(item) {
  return `${window.location.origin}${window.location.pathname}#/respond/${encodeURIComponent(item.id)}`;
}

function getStoredLoginEmail() {
  return localStorage.getItem("form-builder-demo-email") || "login@example.com";
}

function createQuestion(type = "shortText") {
  const hasOptions = ["radio", "checkbox", "select"].includes(type);
  return { id: safeId(), sectionId: "section-1", type, title: "新しい質問", description: "", required: false, options: hasOptions ? ["選択肢1", "選択肢2"] : [], branch: normalizeBranch() };
}

function normalizeForm(value) {
  if (!value || typeof value !== "object") throw new Error("JSONの形式が不正です。");
  const sections = normalizeSections(value.sections);
  const sectionLookup = createSectionLookup(sections);
  return {
    version: value.version ?? 1,
    title: value.title ?? "無題のフォーム",
    description: value.description ?? "",
    settings: normalizeSettings(value.settings),
    sections,
    questions: Array.isArray(value.questions) ? value.questions.map((q) => ({
      id: q.id ?? safeId(),
      sectionId: q.sectionId ?? sectionLookup.get(q.section) ?? sectionLookup.get(q.sectionTitle) ?? sections[0]?.id ?? "section-1",
      type: q.type ?? "shortText",
      title: q.title ?? "無題の質問",
      description: q.description ?? "",
      required: Boolean(q.required),
      options: Array.isArray(q.options) ? q.options : [],
      branch: normalizeImportBranch(q.branch, sections),
    })) : [],
  };
}

export default function FormBuilder() {
  const respondentForm = getRespondentFormFromHash();
  const [screen, setScreen] = useState("loginEmail");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [homeTab, setHomeTab] = useState("actions");
  const [hoveredTemplateId, setHoveredTemplateId] = useState(templates[0].id);
  const [form, setForm] = useState(createBlankForm);
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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const submitEmail = (event) => { event.preventDefault(); setScreen("loginPassword"); };
  const submitPassword = (event) => {
    event.preventDefault();
    localStorage.setItem("form-builder-demo-email", email || "login@example.com");
    setScreen("home");
  };
  const logout = () => { setPassword(""); setScreen("loginEmail"); };

  const startBlank = () => { setForm(createBlankForm()); setScreen("edit"); };
  const startFromTemplate = (template) => { setForm(createFormFromTemplate(template)); setScreen("edit"); };
  const openResponseDashboard = (item) => { setResponseItem(item); setScreen("responses"); };
  const openRecipientManagement = (item) => { setRecipientItem(item); setScreen("recipients"); };
  const openCreatedForm = (item, next = "edit") => {
    const template = templates.find((candidate) => candidate.id === item.templateId) ?? templates[0];
    setForm({
      ...createFormFromTemplate(template),
      title: item.title,
      settings: createDefaultSettings({
        visibility: item.visibility ?? "limited",
        deadline: item.deadline ?? "",
        acceptingResponses: item.acceptingResponses ?? true,
        headerImageUrl: item.headerImageUrl ?? "",
        confirmationType: item.confirmationType ?? "default",
        thankYouTitle: item.thankYouTitle ?? "ご回答ありがとうございました",
        thankYouMessage: item.thankYouMessage ?? "回答を受け付けました。",
      }),
    });
    setScreen(next);
  };

  const updateFormSettings = (patch) => setForm((current) => ({
    ...current,
    settings: createDefaultSettings({ ...current.settings, ...patch }),
  }));

  const updateQuestion = (qid, patch) => setForm((current) => ({ ...current, questions: current.questions.map((q) => q.id === qid ? { ...q, ...patch } : q) }));
  const addQuestion = () => setForm((current) => ({
    ...current,
    questions: [...current.questions, { ...createQuestion(), sectionId: current.sections?.[0]?.id ?? "section-1" }],
  }));
  const deleteQuestion = (qid) => setForm((current) => ({ ...current, questions: current.questions.filter((q) => q.id !== qid) }));
  const updateOption = (qid, index, value) => setForm((current) => ({ ...current, questions: current.questions.map((q) => q.id !== qid ? q : { ...q, options: q.options.map((option, i) => i === index ? value : option) }) }));
  const addOption = (qid) => setForm((current) => ({ ...current, questions: current.questions.map((q) => q.id !== qid ? q : { ...q, options: [...q.options, `選択肢${q.options.length + 1}`] }) }));
  const deleteOption = (qid, index) => setForm((current) => ({ ...current, questions: current.questions.map((q) => q.id !== qid ? q : { ...q, options: q.options.filter((_, i) => i !== index) }) }));
  const changeType = (qid, type) => {
    const hasOptions = ["radio", "checkbox", "select"].includes(type);
    updateQuestion(qid, { type, options: hasOptions ? ["選択肢1", "選択肢2"] : [], branch: normalizeBranch() });
  };
  const addSection = () => setForm((current) => ({ ...current, sections: [...(current.sections ?? createDefaultSections()), createSection(`セクション ${(current.sections?.length ?? 1) + 1}`)] }));
  const updateSection = (sectionId, patch) => setForm((current) => ({ ...current, sections: (current.sections ?? createDefaultSections()).map((section) => section.id === sectionId ? { ...section, ...patch } : section) }));
  const deleteSection = (sectionId) => setForm((current) => {
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
    setForm((current) => {
      const oldIndex = current.questions.findIndex((q) => q.id === active.id);
      const newIndex = current.questions.findIndex((q) => q.id === over.id);
      return { ...current, questions: arrayMove(current.questions, oldIndex, newIndex) };
    });
  };

  const openJson = () => { setJsonText(prettyJson); setJsonError(""); setJsonTab("json"); setJsonOpen(true); };
  const importJson = () => {
    try {
      if (jsonText.length > maxJsonImportLength) throw new Error("JSONが大きすぎます。200KB以内にしてください。");
      setForm(normalizeForm(JSON.parse(jsonText))); setJsonOpen(false); setScreen("edit");
    }
    catch (error) { setJsonError(error.message); }
  };
  const copyJson = async () => navigator.clipboard?.writeText(jsonText || prettyJson);

  if (respondentForm) return <RespondentFormPage form={respondentForm} respondentEmail={getStoredLoginEmail()} />;

  if (screen === "loginEmail") return <LoginEmailPage email={email} setEmail={setEmail} onSubmit={submitEmail} />;
  if (screen === "loginPassword") return <LoginPasswordPage email={email} password={password} setPassword={setPassword} onSubmit={submitPassword} onBack={() => setScreen("loginEmail")} />;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <button type="button" onClick={() => setScreen("home")} className="text-left">
            <h1 className="text-lg font-bold text-slate-900">フォーム管理</h1>
            <p className="text-xs text-slate-500">Googleフォーム風ビルダー v0.6</p>
          </button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {screen !== "home" && <Button variant="outline" size="sm" className="gap-2" onClick={() => setScreen("home")}><FaHouse />管理トップ</Button>}
            {screen === "edit" && <Button variant="outline" size="sm" className="gap-2" onClick={() => setSettingsOpen(true)}><FaGear />設定</Button>}
            {screen === "edit" && <Button variant="outline" size="sm" className="gap-2" onClick={() => setScreen("preview")}><FaEye />プレビュー</Button>}
            {screen === "preview" && <Button variant="outline" size="sm" className="gap-2" onClick={() => setScreen("edit")}><FaPen />編集に戻る</Button>}
            {screen !== "audit" && <Button variant="outline" size="sm" className="gap-2" onClick={() => setScreen("audit")}><FaRegClock />監査ログ</Button>}
            {screen !== "states" && <Button variant="outline" size="sm" className="gap-2" onClick={() => setScreen("states")}><FaEye />状態切替</Button>}
            <Button variant="outline" size="sm" className="gap-2" onClick={openJson}><FaCode />JSON</Button>
            <Button variant="ghost" size="sm" className="hidden gap-2 md:flex"><FaUser />{email || "login@example.com"}</Button>
            <Button variant="ghost" size="sm" className="gap-2" onClick={logout}><FaRightFromBracket />ログアウト</Button>
            {screen === "edit" && <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={addQuestion}><FaPlus />質問追加</Button>}
          </div>
        </div>
      </header>

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
          createdForms={createdForms}
          onOpenCreated={openCreatedForm}
          onShareCreated={setShareItem}
          onOpenResponses={openResponseDashboard}
          onOpenVersions={setVersionItem}
          onOpenPublish={setPublishItem}
          onOpenRecipients={openRecipientManagement}
          onOpenNotifications={setNotificationItem}
          onOpenReview={setReviewItem}
        />
      )}
      {screen === "edit" && <EditPage form={form} setForm={setForm} sensors={sensors} onDragEnd={onDragEnd} updateQuestion={updateQuestion} addQuestion={addQuestion} deleteQuestion={deleteQuestion} changeType={changeType} updateOption={updateOption} addOption={addOption} deleteOption={deleteOption} addSection={addSection} updateSection={updateSection} deleteSection={deleteSection} />}
      {screen === "preview" && <PreviewPage form={form} />}
      {screen === "responses" && <ResponseDashboardPage item={responseItem ?? createdForms[0]} onBack={() => setScreen("home")} onPreview={(item) => openCreatedForm(item, "preview")} />}
      {screen === "recipients" && <RecipientManagementPage item={recipientItem ?? createdForms[0]} onBack={() => setScreen("home")} onOpenNotifications={setNotificationItem} />}
      {screen === "audit" && <AuditLogPage onBack={() => setScreen("home")} />}
      {screen === "states" && <StateSwitchPage onBack={() => setScreen("home")} />}

      <FormSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={form.settings ?? createDefaultSettings()}
        onChange={updateFormSettings}
      />

      <ShareLinkDialog item={shareItem} onOpenChange={(open) => !open && setShareItem(null)} />

      <VersionHistoryDialog item={versionItem} onOpenChange={(open) => !open && setVersionItem(null)} onPreview={(item) => openCreatedForm(item, "preview")} />
      <PublishControlDialog item={publishItem} onOpenChange={(open) => !open && setPublishItem(null)} onShare={(item) => { setPublishItem(null); setShareItem(item); }} />
      <NotificationSettingsDialog item={notificationItem} onOpenChange={(open) => !open && setNotificationItem(null)} />
      <PrePublishReviewDialog item={reviewItem} onOpenChange={(open) => !open && setReviewItem(null)} onOpenPublish={(item) => { setReviewItem(null); setPublishItem(item); }} onOpenNotifications={(item) => { setReviewItem(null); setNotificationItem(item); }} />

      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
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
              {jsonError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{jsonError}</p>}
            </div>
          ) : <JsonGuide />}

          <DialogFooter>
            {jsonTab === "json" && <Button variant="outline" onClick={() => setJsonText(prettyJson)}>現在のフォームを再読込</Button>}
            {jsonTab === "json" && <Button variant="outline" onClick={copyJson}><FaCopy className="mr-2" />コピー</Button>}
            <Button variant="outline" onClick={() => setJsonOpen(false)}>閉じる</Button>
            {jsonTab === "json" && <Button className="bg-purple-600 hover:bg-purple-700" onClick={importJson}>JSONを反映</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormHeaderCard({ form }) {
  const settings = form.settings ?? createDefaultSettings();

  return (
    <Card className="overflow-hidden border-t-8 border-t-purple-600">
      {settings.headerImageUrl && (
        <img className="h-48 w-full object-cover" src={settings.headerImageUrl} alt="フォームヘッダー" referrerPolicy="no-referrer" />
      )}
      <CardHeader>
        <CardTitle className="text-3xl">{form.title}</CardTitle>
        <p className="text-sm text-slate-600">{form.description}</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-600">
            <FaGlobe className="text-purple-600" />
            <span>公開範囲: {getVisibilityLabel(settings.visibility)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-600">
            <FaCalendarDays className="text-purple-600" />
            <span>公開期限: {formatDeadline(settings.deadline)}</span>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function JsonTabButton({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`px-4 py-2 text-sm font-medium ${active ? "border-b-2 border-purple-600 text-purple-700" : "text-slate-500 hover:text-slate-900"}`}>
      {children}
    </button>
  );
}

function JsonGuide() {
  const sampleJson = `{
  "version": 1,
  "title": "研修参加申請フォーム",
  "description": "受講希望者の情報と希望日程を確認します。",
  "settings": {
    "visibility": "organization",
    "deadline": "2026-07-31T17:00",
    "acceptingResponses": true,
    "confirmationType": "custom",
    "thankYouTitle": "申請を受け付けました",
    "thankYouMessage": "事務局で確認後、メールで連絡します。"
  },
  "sections": [
    { "title": "基本情報", "description": "回答者情報を入力します。" },
    { "title": "希望内容", "description": "参加希望を入力します。" }
  ],
  "questions": [
    { "section": "基本情報", "type": "shortText", "title": "氏名", "required": true },
    { "section": "希望内容", "type": "radio", "title": "希望日程", "required": true, "options": ["7月15日", "7月22日"] }
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
            <li><code>radio</code>: 単一選択</li>
            <li><code>checkbox</code>: 複数選択</li>
            <li><code>select</code>: プルダウン</li>
          </ul>
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

function SubmissionComplete({ settings }) {
  const custom = settings.confirmationType === "custom";

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-8">
      <Card className="border-t-8 border-t-purple-600">
        <CardContent className="space-y-4 p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-50 text-green-600"><FaCheck /></div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{custom ? settings.thankYouTitle : "送信が完了しました"}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{custom ? settings.thankYouMessage : "回答を受け付けました。"}</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function RespondentFormPage({ form, respondentEmail }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-1 px-4 py-4 md:px-8">
          <h1 className="text-lg font-bold text-slate-900">フォーム回答</h1>
          <p className="text-sm text-slate-500">ログイン中: {respondentEmail}</p>
        </div>
      </header>
      <AnswerForm form={form} submitLabel="回答を送信" />
    </div>
  );
}

function LoginEmailPage({ email, setEmail, onSubmit }) {
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

function LoginPasswordPage({ email, password, setPassword, onSubmit, onBack }) {
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

function HomePage({ templates, hoveredTemplate, hoveredTemplateId, setHoveredTemplateId, onStartBlank, onStartTemplate, homeTab, setHomeTab, actionItems, createdForms, onOpenCreated, onShareCreated, onOpenResponses, onOpenVersions, onOpenPublish, onOpenRecipients, onOpenNotifications, onOpenReview }) {
  return (
    <main className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <section className="rounded-2xl bg-gradient-to-r from-purple-700 to-violet-500 p-8 text-white shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold">フォームを作成・管理</h2>
            <p className="mt-2 max-w-2xl text-sm text-purple-50">空のフォームから始めるか、用途別テンプレートを選んで作成できます。</p>
          </div>
          <Button size="lg" className="gap-2 bg-white text-purple-700 hover:bg-purple-50" onClick={onStartBlank}><FaFileCirclePlus />新規フォーム作成</Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FaLayerGroup />テンプレートから作成</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {templates.map((template) => {
              const Icon = template.icon;
              const active = hoveredTemplateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onMouseEnter={() => setHoveredTemplateId(template.id)}
                  onFocus={() => setHoveredTemplateId(template.id)}
                  onClick={() => onStartTemplate(template)}
                  className={`rounded-xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-purple-400 ring-2 ring-purple-100" : "border-slate-200"}`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="rounded-lg bg-purple-50 p-3 text-purple-600"><Icon /></div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{template.tag}</span>
                  </div>
                  <div className="font-semibold text-slate-900">{template.title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{template.description}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <TemplatePreview template={hoveredTemplate} onStartTemplate={onStartTemplate} />
      </section>

      <section className="space-y-4">
        <div className="flex gap-2 border-b">
          <TabButton active={homeTab === "actions"} count={actionItems.length} onClick={() => setHomeTab("actions")}>回答中</TabButton>
          <TabButton active={homeTab === "created"} count={createdForms.length} onClick={() => setHomeTab("created")}>作成済み</TabButton>
        </div>
        {homeTab === "actions" ? <ActionList items={actionItems} /> : <CreatedList items={createdForms} onOpen={onOpenCreated} onShare={onShareCreated} onResponses={onOpenResponses} onVersions={onOpenVersions} onPublish={onOpenPublish} onRecipients={onOpenRecipients} onNotifications={onOpenNotifications} onReview={onOpenReview} />}
      </section>
    </main>
  );
}

function FormSettingsDialog({ open, onOpenChange, settings, onChange }) {
  const selectedVisibility = visibilityOptions.find((option) => option.value === settings.visibility) ?? visibilityOptions[1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl"><FaGear />フォーム設定</DialogTitle>
          <DialogDescription>公開範囲、見た目、送信完了画面を設定できます。</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><FaGlobe className="text-purple-600" />公開範囲</label>
            <Select value={settings.visibility} onValueChange={(value) => onChange({ visibility: value })}>
              <SelectTrigger className="w-full"><SelectValue>{getVisibilityLabel(settings.visibility)}</SelectValue></SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">{selectedVisibility.description}</p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><FaCalendarDays className="text-purple-600" />公開期限</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input type="datetime-local" value={settings.deadline} onChange={(event) => onChange({ deadline: event.target.value })} />
              <Button type="button" variant="outline" onClick={() => onChange({ deadline: "" })}>期限なし</Button>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border bg-white p-4">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={settings.acceptingResponses} onChange={(event) => onChange({ acceptingResponses: event.target.checked })} />
              回答を受け付ける
            </label>
            <p className="text-xs text-slate-500">オフにすると、回答者には受付停止画面を表示します。</p>
          </div>

          <div className="space-y-2 border-t pt-5">
            <label className="text-sm font-medium text-slate-700">ヘッダー画像</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={settings.headerImageUrl} onChange={(event) => onChange({ headerImageUrl: event.target.value })} placeholder="画像URLを入力" />
              <Button type="button" variant="outline" onClick={() => onChange({ headerImageUrl: sampleHeaderImageUrl })}>サンプル</Button>
              <Button type="button" variant="outline" onClick={() => onChange({ headerImageUrl: "" })}>削除</Button>
            </div>
            {settings.headerImageUrl && <img className="h-28 w-full rounded-md object-cover" src={settings.headerImageUrl} alt="ヘッダー画像プレビュー" referrerPolicy="no-referrer" />}
          </div>

          <div className="space-y-3 border-t pt-5">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={settings.confirmationType === "custom"} onChange={(event) => onChange({ confirmationType: event.target.checked ? "custom" : "default" })} />
              送信完了画面にお礼メッセージを表示する
            </label>
            <p className="text-xs text-slate-500">オフの場合はデフォルトの送信完了画面を表示します。</p>
            {settings.confirmationType === "custom" && (
              <div className="space-y-3 rounded-lg bg-slate-50 p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">お礼タイトル</label>
                  <Input value={settings.thankYouTitle} onChange={(event) => onChange({ thankYouTitle: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">お礼メッセージ</label>
                  <Textarea className="min-h-24" value={settings.thankYouMessage} onChange={(event) => onChange({ thankYouMessage: event.target.value })} />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium uppercase text-slate-400">公開範囲</div>
              <div className="mt-1 font-medium text-slate-800">{getVisibilityLabel(settings.visibility)}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-slate-400">公開期限</div>
              <div className="mt-1 font-medium text-slate-800">{formatDeadline(settings.deadline)}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-slate-400">回答受付</div>
              <div className="mt-1 font-medium text-slate-800">{settings.acceptingResponses ? "受付中" : "停止中"}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-slate-400">ヘッダー画像</div>
              <div className="mt-1 font-medium text-slate-800">{settings.headerImageUrl ? "設定あり" : "未設定"}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-slate-400">送信完了画面</div>
              <div className="mt-1 font-medium text-slate-800">{confirmationTypeOptions.find((option) => option.value === settings.confirmationType)?.label}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => onOpenChange(false)}>完了</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShareLinkDialog({ item, onOpenChange }) {
  const shareUrl = item ? getRespondentUrl(item) : "";

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>フォーム共有</DialogTitle>
          <DialogDescription>回答者に渡すリンクを確認できます。</DialogDescription>
        </DialogHeader>
        {item && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="font-medium text-slate-900">{item.title}</div>
              <p className="mt-1 text-sm text-slate-500">公開範囲: {getVisibilityLabel(item.visibility)} / 期限: {formatDeadline(item.deadline ?? toDeadlineInputValue(item.due))}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">回答リンク</label>
              <Input readOnly value={shareUrl} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => navigator.clipboard?.writeText(shareUrl)}>コピー</Button>
          <a className="inline-flex h-9 items-center justify-center rounded-md bg-purple-600 px-3 text-sm font-medium text-white transition hover:bg-purple-700" href={shareUrl} target="_blank" rel="noreferrer">回答画面を開く</a>
          <Button variant="outline" onClick={() => onOpenChange(false)}>閉じる</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplatePreview({ template, onStartTemplate }) {
  return (
    <Card className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">テンプレートプレビュー</CardTitle>
        <p className="text-sm text-slate-500">{template.title}</p>
      </CardHeader>
      <CardContent className="max-h-[70vh] space-y-3 overflow-y-auto pr-3 lg:max-h-[calc(100vh-14rem)]">
        <div className="rounded-xl border-t-8 border-t-purple-600 bg-white p-4 shadow-sm">
          <div className="text-xl font-bold">{template.title}</div>
          <p className="mt-2 text-sm text-slate-500">{template.description}</p>
        </div>
        {template.questions.map((question) => (
          <div key={question.title} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="font-medium">{question.title}{question.required && <span className="ml-1 text-red-500">*</span>}</div>
            <p className="mt-1 text-xs text-slate-500">{questionTypes.find((type) => type.value === question.type)?.label}</p>
          </div>
        ))}
        <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => onStartTemplate(template)}>このテンプレートを使う</Button>
      </CardContent>
    </Card>
  );
}

function TabButton({ active, count, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`relative px-4 py-3 text-sm font-medium ${active ? "border-b-2 border-purple-600 text-purple-700" : "text-slate-500 hover:text-slate-900"}`}>
      {children}
      <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-600"}`}>{count}</span>
    </button>
  );
}

function ActionList({ items }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <FaBell className="text-purple-600" />
                <h3 className="font-semibold">{item.title}</h3>
                <span className="rounded-full bg-red-50 px-2 py-1 text-xs text-red-600">{item.status}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>依頼元: {item.requester}</span>
                <span><FaRegClock className="mr-1 inline" />回答期限: {item.due}</span>
                <span><FaGlobe className="mr-1 inline" />公開範囲: {getVisibilityLabel(item.visibility)}</span>
              </div>
            </div>
            <a className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-purple-600 px-3 text-sm font-medium text-white transition hover:bg-purple-700" href={getRespondentUrl(item)} target="_blank" rel="noreferrer">回答を開く</a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CreatedList({ items, onOpen, onShare, onResponses, onVersions, onPublish, onRecipients, onNotifications, onReview }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <FaCheck className="text-green-600" />
                  <h3 className="font-semibold">{item.title}</h3>
                  <span className={`rounded-full px-2 py-1 text-xs ${getStatusClassName(item.status)}`}>{item.status}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span><FaRegClock className="mr-1 inline" />更新: {item.updatedAt}</span>
                  <span>回答数: {item.responses}</span>
                  <span><FaGlobe className="mr-1 inline" />{getVisibilityLabel(item.visibility)}</span>
                  <span>期限: {formatDeadline(item.deadline)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <Button variant="outline" onClick={() => onResponses(item)}>回答</Button>
                <Button variant="outline" onClick={() => onRecipients(item)}>回答者</Button>
                <Button variant="outline" onClick={() => onNotifications(item)}>通知</Button>
                <Button variant="outline" onClick={() => onVersions(item)}>版管理</Button>
                <Button variant="outline" onClick={() => onReview(item)}>公開レビュー</Button>
                <Button variant="outline" onClick={() => onPublish(item)}>公開設定</Button>
                <Button variant="outline" onClick={() => onShare(item)}>共有</Button>
                <Button variant="outline" onClick={() => onOpen(item, "preview")}>プレビュー</Button>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => onOpen(item, "edit")}>編集</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ResponseDashboardPage({ item, onBack, onPreview }) {
  const responses = getResponsesForItem(item);
  const answerKeys = getResponseAnswerKeys(responses);
  const [selectedResponseId, setSelectedResponseId] = useState(responses[0]?.id ?? "");
  const selectedResponse = responses.find((response) => response.id === selectedResponseId) ?? responses[0];
  const waitingCount = responses.filter((response) => response.status.includes("待ち") || response.status === "差し戻し").length;

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <button type="button" className="text-sm text-purple-700 hover:underline" onClick={onBack}>作成済み一覧へ戻る</button>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">回答管理</h2>
          <p className="text-sm text-slate-500">{item.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => onPreview(item)}>回答画面プレビュー</Button>
          <Button variant="outline" disabled={responses.length === 0} onClick={() => navigator.clipboard?.writeText(buildResponsesCsv(item))}>CSVをコピー</Button>
          <Button className="bg-purple-600 hover:bg-purple-700" disabled={responses.length === 0} onClick={() => downloadResponsesCsv(item)}>CSVダウンロード</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="総回答数" value={`${responses.length}件`} />
        <MetricCard label="確認待ち" value={`${waitingCount}件`} />
        <MetricCard label="公開範囲" value={getVisibilityLabel(item.visibility)} />
        <MetricCard label="回答期限" value={formatDeadline(item.deadline)} />
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">回答一覧</CardTitle>
            <p className="text-sm text-slate-500">回答者、送信日時、主要回答を確認します。</p>
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">まだ回答はありません。</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-2">回答者</th>
                      <th className="px-3 py-2">送信日時</th>
                      <th className="px-3 py-2">ステータス</th>
                      {answerKeys.slice(0, 3).map((key) => <th key={key} className="px-3 py-2">{key}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response) => (
                      <tr key={response.id} className={`cursor-pointer border-b hover:bg-purple-50 ${selectedResponse?.id === response.id ? "bg-purple-50" : ""}`} onClick={() => setSelectedResponseId(response.id)}>
                        <td className="px-3 py-3 font-medium text-slate-800">{response.respondent}</td>
                        <td className="px-3 py-3 text-slate-500">{response.submittedAt}</td>
                        <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs ${getStatusClassName(response.status)}`}>{response.status}</span></td>
                        {answerKeys.slice(0, 3).map((key) => <td key={key} className="max-w-48 truncate px-3 py-3 text-slate-600">{response.answers[key] ?? "-"}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">回答詳細</CardTitle>
            <p className="text-sm text-slate-500">一覧で選択した回答の確認画面です。</p>
          </CardHeader>
          <CardContent>
            {selectedResponse ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-4 text-sm">
                  <div className="font-medium text-slate-900">{selectedResponse.respondent}</div>
                  <div className="mt-1 text-slate-500">{selectedResponse.submittedAt}</div>
                  <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs ${getStatusClassName(selectedResponse.status)}`}>{selectedResponse.status}</span>
                </div>
                <div className="space-y-3">
                  {Object.entries(selectedResponse.answers).map(([key, value]) => (
                    <div key={key} className="border-b pb-3">
                      <div className="text-xs font-medium text-slate-500">{key}</div>
                      <div className="mt-1 text-sm text-slate-900">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline">確認済みにする</Button>
                  <Button variant="outline">差し戻し</Button>
                </div>
              </div>
            ) : <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">回答を選択してください。</div>}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function MetricCard({ label, value }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
}

function RecipientManagementPage({ item, onBack, onOpenNotifications }) {
  const recipients = getRecipientsForItem(item);
  const [filter, setFilter] = useState("all");
  const counts = getRecipientCounts(recipients);
  const filteredRecipients = filter === "all" ? recipients : recipients.filter((recipient) => recipient.status === filter);

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <button type="button" className="text-sm text-purple-700 hover:underline" onClick={onBack}>作成済み一覧へ戻る</button>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">回答者管理</h2>
          <p className="text-sm text-slate-500">{item.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">CSV取り込み</Button>
          <Button variant="outline">対象者を追加</Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => onOpenNotifications(item)}>通知設定へ</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="対象者" value={`${counts.total}名`} />
        <MetricCard label="回答済み" value={`${counts.answered}名`} />
        <MetricCard label="未回答" value={`${counts.pending}名`} />
        <MetricCard label="公開範囲" value={getVisibilityLabel(item.visibility)} />
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">対象者一覧</CardTitle>
            <p className="text-sm text-slate-500">配布先、回答状況、最終連絡日時を確認します。</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {["all", "未送信", "未回答", "リマインド済み", "回答済み"].map((status) => (
                <Button key={status} variant={filter === status ? "default" : "outline"} size="sm" className={filter === status ? "bg-purple-600 hover:bg-purple-700" : ""} onClick={() => setFilter(status)}>{status === "all" ? "すべて" : status}</Button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b text-xs text-slate-500">
                  <tr><th className="px-3 py-2">氏名/グループ</th><th className="px-3 py-2">メール</th><th className="px-3 py-2">部署</th><th className="px-3 py-2">状態</th><th className="px-3 py-2">最終連絡</th></tr>
                </thead>
                <tbody>
                  {filteredRecipients.map((recipient) => (
                    <tr key={recipient.email} className="border-b">
                      <td className="px-3 py-3 font-medium text-slate-900">{recipient.name}</td>
                      <td className="px-3 py-3 text-slate-600">{recipient.email}</td>
                      <td className="px-3 py-3 text-slate-600">{recipient.department}</td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs ${getStatusClassName(recipient.status)}`}>{recipient.status}</span></td>
                      <td className="px-3 py-3 text-slate-500">{recipient.lastContact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">CSV取り込み仕様</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="rounded-lg bg-slate-50 p-3">必須列: 氏名, メールアドレス, 部署</div>
              <div className="rounded-lg bg-slate-50 p-3">重複メールは上書き確認ダイアログを表示</div>
              <div className="rounded-lg bg-red-50 p-3 text-red-700">エラー例: 3行目のメールアドレスが不正です。</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">一括操作</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline">未回答者へ再送</Button>
              <Button variant="outline">対象者をCSV出力</Button>
              <Button variant="outline">選択者を除外</Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function NotificationSettingsDialog({ item, onOpenChange }) {
  const rules = getNotificationRulesForItem(item);
  const recipients = getRecipientsForItem(item);
  const counts = getRecipientCounts(recipients);
  const primaryRule = rules[0];

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto" style={{ width: "92vw", maxWidth: "1100px" }}>
        <DialogHeader>
          <DialogTitle>通知・リマインド設定</DialogTitle>
          <DialogDescription>回答依頼、未回答リマインド、受付終了通知の仕様確認用モックです。</DialogDescription>
        </DialogHeader>
        {item && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="font-medium text-slate-900">{item.title}</div>
                <p className="mt-1 text-sm text-slate-500">対象者 {counts.total}名 / 未回答 {counts.pending}名 / 期限 {formatDeadline(item.deadline)}</p>
              </div>
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.label} className="rounded-lg border bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <label className="flex items-start gap-3">
                        <input type="checkbox" checked={rule.enabled} readOnly />
                        <span>
                          <span className="block font-medium text-slate-900">{rule.label}</span>
                          <span className="block text-sm text-slate-500">{rule.timing} / {rule.channel}</span>
                        </span>
                      </label>
                      <span className={`rounded-full px-2 py-1 text-xs ${rule.enabled ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{rule.enabled ? "有効" : "無効"}</span>
                    </div>
                    <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">件名: {rule.subject}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">通知文面プレビュー</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-md bg-slate-50 p-3"><div className="text-xs text-slate-500">件名</div><div className="mt-1 font-medium">{primaryRule?.subject ?? "通知件名"}</div></div>
                  <div className="rounded-md bg-slate-50 p-3 leading-6 text-slate-600">
                    {item.title} の回答をお願いします。回答期限は {formatDeadline(item.deadline)} です。リンクからフォームを開いて送信してください。
                  </div>
                  <Button variant="outline" className="w-full">テスト送信</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">送信対象</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <div>初回依頼: {counts.total}名</div>
                  <div>未回答リマインド: {counts.pending}名</div>
                  <div>回答完了通知: 回答者本人</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>閉じる</Button>
          <Button variant="outline">下書き保存</Button>
          <Button className="bg-purple-600 hover:bg-purple-700">設定を反映</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrePublishReviewDialog({ item, onOpenChange, onOpenPublish, onOpenNotifications }) {
  const summary = item ? getPublishReviewSummary(item) : null;
  const checklist = item ? [
    { label: "フォームタイトルと説明", ok: Boolean(item.title) },
    { label: "質問と必須項目", ok: summary.requiredCount > 0 },
    { label: "回答者または公開範囲", ok: summary.recipientCount > 0 || item.visibility !== "private" },
    { label: "通知設定", ok: summary.enabledNotifications > 0 },
    { label: "回答期限", ok: Boolean(item.deadline) },
    { label: "送信完了メッセージ", ok: Boolean(item.thankYouMessage) || item.confirmationType !== "custom" },
  ] : [];

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto" style={{ width: "92vw", maxWidth: "1100px" }}>
        <DialogHeader>
          <DialogTitle>公開前レビュー</DialogTitle>
          <DialogDescription>公開直前に確認する項目と、公開後に変わる状態をまとめた画面です。</DialogDescription>
        </DialogHeader>
        {item && summary && (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-5">
              <MetricCard label="セクション" value={`${summary.sectionCount}`} />
              <MetricCard label="質問" value={`${summary.questionCount}`} />
              <MetricCard label="必須" value={`${summary.requiredCount}`} />
              <MetricCard label="対象者" value={`${summary.recipientCount}`} />
              <MetricCard label="通知" value={`${summary.enabledNotifications}`} />
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <Card>
                <CardHeader><CardTitle className="text-lg">公開前チェック</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {checklist.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                      <span>{item.label}</span>
                      <span className={`rounded-full px-2 py-1 text-xs ${item.ok ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{item.ok ? "OK" : "要確認"}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">公開後の状態</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <div className="rounded-lg bg-slate-50 p-3">公開範囲: {getVisibilityLabel(item.visibility)}</div>
                  <div className="rounded-lg bg-slate-50 p-3">回答期限: {formatDeadline(item.deadline)}</div>
                  <div className="rounded-lg bg-slate-50 p-3">回答リンク: {getRespondentUrl(item)}</div>
                  <div className="rounded-lg bg-amber-50 p-3 text-amber-700">公開後に質問を変更する場合は新しい版として保存します。</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        <DialogFooter>
          {item && <Button variant="outline" onClick={() => onOpenNotifications(item)}>通知設定</Button>}
          {item && <Button variant="outline" onClick={() => onOpenPublish(item)}>公開設定</Button>}
          <Button variant="outline" onClick={() => onOpenChange(false)}>閉じる</Button>
          <Button className="bg-purple-600 hover:bg-purple-700">この内容で公開</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AuditLogPage({ onBack }) {
  const [filter, setFilter] = useState("all");
  const actions = ["all", ...Array.from(new Set(auditLogSamples.map((log) => log.action)))];
  const filteredLogs = filter === "all" ? auditLogSamples : auditLogSamples.filter((log) => log.action === filter);

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <button type="button" className="text-sm text-purple-700 hover:underline" onClick={onBack}>管理トップへ戻る</button>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">監査ログ</h2>
          <p className="text-sm text-slate-500">公開、JSONインポート、CSV出力、通知送信などの操作履歴を確認します。</p>
        </div>
        <Button variant="outline">監査ログCSV出力</Button>
      </div>
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => <Button key={action} variant={filter === action ? "default" : "outline"} size="sm" className={filter === action ? "bg-purple-600 hover:bg-purple-700" : ""} onClick={() => setFilter(action)}>{action === "all" ? "すべて" : action}</Button>)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b text-xs text-slate-500"><tr><th className="px-3 py-2">日時</th><th className="px-3 py-2">操作ユーザー</th><th className="px-3 py-2">操作</th><th className="px-3 py-2">対象</th><th className="px-3 py-2">詳細</th></tr></thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={`${log.time}-${log.action}`} className="border-b">
                    <td className="px-3 py-3 text-slate-500">{log.time}</td>
                    <td className="px-3 py-3 font-medium text-slate-900">{log.actor}</td>
                    <td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{log.action}</span></td>
                    <td className="px-3 py-3 text-slate-700">{log.target}</td>
                    <td className="px-3 py-3 text-slate-600">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function StateSwitchPage({ onBack }) {
  const [scenarioId, setScenarioId] = useState(stateScenarios[0].id);
  const scenario = stateScenarios.find((candidate) => candidate.id === scenarioId) ?? stateScenarios[0];

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">
      <div>
        <button type="button" className="text-sm text-purple-700 hover:underline" onClick={onBack}>管理トップへ戻る</button>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">状態切替パネル</h2>
        <p className="text-sm text-slate-500">画面仕様書用に、空状態・権限エラー・期限切れなどを切り替えて確認します。</p>
      </div>
      <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader><CardTitle className="text-lg">表示する状態</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stateScenarios.map((candidate) => (
              <button key={candidate.id} type="button" onClick={() => setScenarioId(candidate.id)} className={`w-full rounded-lg border p-3 text-left transition ${scenarioId === candidate.id ? "border-purple-400 bg-purple-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                <div className="font-medium text-slate-900">{candidate.title}</div>
                <div className="mt-1 text-xs text-slate-500">{candidate.description}</div>
              </button>
            ))}
          </CardContent>
        </Card>
        <StateScenarioPreview scenario={scenario} />
      </section>
    </main>
  );
}

function StateScenarioPreview({ scenario }) {
  if (scenario.id === "emptyResponses") return <EmptyResponsesScenario />;
  if (scenario.id === "deadlineExpired") return <StateMessage title="回答期限を過ぎています" tone="warning" message="公開期限を過ぎているため、このフォームには回答できません。必要な場合はフォーム管理者へお問い合わせください。" />;
  if (scenario.id === "noPermission") return <StateMessage title="権限がありません" tone="danger" message="このフォームは組織内限定です。別のアカウントでログインしている場合は、許可されたアカウントで再度アクセスしてください。" />;
  if (scenario.id === "alreadyAnswered") return <StateMessage title="回答済みです" tone="success" message="このフォームは1人1回のみ回答できます。回答内容を修正したい場合はフォーム管理者へ連絡してください。" />;
  if (scenario.id === "jsonError") return <StateMessage title="JSONを反映できません" tone="danger" message="questions[2].type が不正です。shortText, paragraph, radio, checkbox, select のいずれかを指定してください。" />;
  return <StateMessage title="CSVを取り込めません" tone="danger" message="必須列「メールアドレス」が見つかりません。CSVテンプレートを確認してから再度取り込んでください。" />;
}

function EmptyResponsesScenario() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">回答はまだありません</CardTitle>
        <p className="text-sm text-slate-500">公開済みフォームに回答が1件も届いていない状態です。</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard label="総回答数" value="0件" />
          <MetricCard label="未回答者" value="18名" />
          <MetricCard label="次回通知" value="明日 09:00" />
        </div>
        <div className="rounded-lg border border-dashed bg-slate-50 p-8 text-center">
          <div className="font-medium text-slate-900">回答一覧に表示するデータがありません</div>
          <p className="mt-2 text-sm text-slate-500">回答依頼を送信するか、未回答者へリマインドを送信してください。</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline">通知設定を確認</Button>
            <Button className="bg-purple-600 hover:bg-purple-700">リマインド送信</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StateMessage({ title, message, tone }) {
  const toneClass = tone === "success" ? "border-green-500 bg-green-50 text-green-700" : tone === "warning" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-red-500 bg-red-50 text-red-700";
  return (
    <Card className={`border-l-4 ${toneClass}`}>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6">{message}</p>
        <div className="rounded-lg bg-white/70 p-4 text-sm text-slate-600">画面遷移図では、この状態から「管理トップへ戻る」「再試行」「管理者へ問い合わせ」などの導線を検討します。</div>
      </CardContent>
    </Card>
  );
}

function VersionHistoryDialog({ item, onOpenChange, onPreview }) {
  const versions = getVersionsForItem(item);
  const currentVersion = versions[0];
  const previousVersion = versions[1];

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto" style={{ width: "92vw", maxWidth: "1100px" }}>
        <DialogHeader>
          <DialogTitle>版管理</DialogTitle>
          <DialogDescription>公開版、下書き版、過去版を比較するためのモック画面です。</DialogDescription>
        </DialogHeader>
        {item && (
          <div className="space-y-5">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="font-medium text-slate-900">{item.title}</div>
              <p className="mt-1 text-sm text-slate-500">現在の状態: {item.status} / 最終更新: {item.updatedAt}</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="space-y-3">
                {versions.map((version) => (
                  <div key={version.version} className="rounded-lg border bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-slate-900">{version.version}</div>
                      <span className={`rounded-full px-2 py-1 text-xs ${getStatusClassName(version.status)}`}>{version.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{version.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>更新者: {version.editor}</span>
                      <span>更新: {version.updatedAt}</span>
                      <span>質問: {version.questions}</span>
                      <span>回答: {version.responses}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 rounded-lg bg-slate-50 p-4">
                <div className="font-medium text-slate-900">版比較</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <VersionCompareColumn title="現在" version={currentVersion} />
                  <VersionCompareColumn title="ひとつ前" version={previousVersion} />
                </div>
                <div className="rounded-md bg-white p-3 text-sm text-slate-600">
                  公開後に質問を増やす場合は、新しい版として公開し、回答一覧では回答時点の版を保持する想定です。
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          {item && <Button variant="outline" onClick={() => onPreview(item)}>現在版をプレビュー</Button>}
          <Button variant="outline" onClick={() => onOpenChange(false)}>閉じる</Button>
          <Button className="bg-purple-600 hover:bg-purple-700">下書きから新しい版を作成</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VersionCompareColumn({ title, version }) {
  return (
    <div className="rounded-lg bg-white p-4 text-sm">
      <div className="text-xs font-medium text-slate-500">{title}</div>
      {version ? (
        <div className="mt-2 space-y-2">
          <div className="font-semibold text-slate-900">{version.version}</div>
          <div>{version.summary}</div>
          <div className="text-slate-500">質問 {version.questions} / 回答 {version.responses}</div>
        </div>
      ) : <div className="mt-2 text-slate-400">比較対象なし</div>}
    </div>
  );
}

function PublishControlDialog({ item, onOpenChange, onShare }) {
  const shareUrl = item ? getRespondentUrl(item) : "";

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>公開設定・権限</DialogTitle>
          <DialogDescription>公開前確認、回答リンク、共同編集者の見え方を確認できます。</DialogDescription>
        </DialogHeader>
        {item && (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <MetricCard label="公開状態" value={item.status} />
              <MetricCard label="公開範囲" value={getVisibilityLabel(item.visibility)} />
              <MetricCard label="期限" value={formatDeadline(item.deadline)} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-4">
                <div className="rounded-lg border bg-white p-4">
                  <div className="font-medium text-slate-900">公開前チェック</div>
                  <div className="mt-3 space-y-2">
                    {publishChecklist.map((label, index) => (
                      <label key={label} className="flex items-center gap-3 text-sm text-slate-700">
                        <input type="checkbox" checked={index < 5 || item.status === "公開中"} readOnly />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <div className="font-medium text-slate-900">回答リンク</div>
                  <Input className="mt-3" readOnly value={shareUrl} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => navigator.clipboard?.writeText(shareUrl)}>リンクをコピー</Button>
                    <Button variant="outline" onClick={() => onShare(item)}>共有ダイアログ</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border bg-white p-4">
                  <div className="font-medium text-slate-900">公開ルール</div>
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-md bg-slate-50 p-3"><div className="text-xs text-slate-500">回答受付</div><div className="mt-1 font-medium">{item.acceptingResponses === false ? "停止中" : "受付中"}</div></div>
                    <div className="rounded-md bg-slate-50 p-3"><div className="text-xs text-slate-500">1人1回回答</div><div className="mt-1 font-medium">有効</div></div>
                    <div className="rounded-md bg-slate-50 p-3"><div className="text-xs text-slate-500">回答後編集</div><div className="mt-1 font-medium">不可</div></div>
                    <div className="rounded-md bg-slate-50 p-3"><div className="text-xs text-slate-500">期限後表示</div><div className="mt-1 font-medium">受付停止画面</div></div>
                  </div>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <div className="font-medium text-slate-900">共同編集者</div>
                  <div className="mt-3 space-y-3">
                    {collaboratorSamples.map((collaborator) => (
                      <div key={collaborator.name} className="flex flex-col gap-1 rounded-md bg-slate-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <div><span className="font-medium text-slate-900">{collaborator.name}</span><span className="ml-2 text-xs text-slate-500">{collaborator.role}</span></div>
                        <div className="text-xs text-slate-500">{collaborator.permission}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>閉じる</Button>
          <Button variant="outline">下書き保存</Button>
          <Button className="bg-purple-600 hover:bg-purple-700">公開する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LegacyEditPage({ form, setForm, sensors, onDragEnd, updateQuestion, addQuestion, deleteQuestion, changeType, updateOption, addOption, deleteOption }) {
  return <main className="mx-auto max-w-5xl space-y-4 p-4 md:p-8"><Card className="border-t-8 border-t-purple-600"><CardHeader><CardTitle className="text-2xl">フォーム作成</CardTitle></CardHeader><CardContent className="space-y-4"><Input className="text-xl font-semibold" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></CardContent></Card><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={form.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}><div className="space-y-4">{form.questions.map((question, index) => <SortableQuestion key={question.id} question={question} index={index} updateQuestion={updateQuestion} deleteQuestion={deleteQuestion} changeType={changeType} updateOption={updateOption} addOption={addOption} deleteOption={deleteOption} />)}</div></SortableContext></DndContext><div className="flex justify-center pb-12"><Button onClick={addQuestion} className="gap-2 bg-purple-600 hover:bg-purple-700"><FaPlus />質問追加</Button></div></main>;
}

function SortableQuestion(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.question.id });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? "relative z-10 opacity-80" : ""}><QuestionCard {...props} attributes={attributes} listeners={listeners} isDragging={isDragging} /></div>;
}

function LegacyQuestionCard({ question, index, updateQuestion, deleteQuestion, changeType, updateOption, addOption, deleteOption, attributes, listeners, isDragging }) {
  const hasOptions = ["radio", "checkbox", "select"].includes(question.type);
  return <Card className={`border-l-4 border-l-purple-500 ${isDragging ? "shadow-2xl ring-2 ring-purple-300" : ""}`}><CardHeader className="flex flex-row items-center justify-between"><div className="flex items-center gap-3"><button className="cursor-grab rounded p-2 text-slate-400 hover:bg-slate-100" {...attributes} {...listeners}><FaGripVertical /></button><CardTitle className="text-base text-slate-500">質問 {index + 1}</CardTitle></div><Button variant="ghost" size="icon" onClick={() => deleteQuestion(question.id)}><FaTrash /></Button></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]"><Input value={question.title} onChange={(event) => updateQuestion(question.id, { title: event.target.value })} /><Select value={question.type} onValueChange={(value) => changeType(question.id, value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{questionTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select></div><Input value={question.description} onChange={(event) => updateQuestion(question.id, { description: event.target.value })} placeholder="説明文（任意）" />{hasOptions ? <div className="space-y-2">{question.options.map((option, optionIndex) => <div key={optionIndex} className="flex items-center gap-2"><span className="w-6 text-center text-sm text-slate-500">{question.type === "checkbox" ? "□" : question.type === "radio" ? "○" : optionIndex + 1}</span><Input value={option} onChange={(event) => updateOption(question.id, optionIndex, event.target.value)} /><Button variant="ghost" size="icon" disabled={question.options.length <= 1} onClick={() => deleteOption(question.id, optionIndex)}><FaTrash /></Button></div>)}<Button variant="outline" size="sm" onClick={() => addOption(question.id)}>選択肢追加</Button></div> : <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-slate-500">回答欄が表示されます</div>}<div className="flex justify-end border-t pt-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(question.id, { required: event.target.checked })} />必須</label></div></CardContent></Card>;
}

function LegacyPreviewPage({ form }) {
  const [submitted, setSubmitted] = useState(false);
  const settings = form.settings ?? createDefaultSettings();

  if (submitted) return <SubmissionComplete settings={settings} />;

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
      <FormHeaderCard form={form} />

      {form.questions.map((question) => (
        <Card key={question.id}>
          <CardContent className="space-y-3 pt-6">
            <div className="font-medium">{question.title}{question.required && <span className="ml-1 text-red-500">*</span>}</div>
            {question.description && <p className="text-sm text-slate-500">{question.description}</p>}
            <PreviewControl question={question} />
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end pb-12"><Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setSubmitted(true)}>送信</Button></div>
    </main>
  );
}
function LegacyPreviewControl({ question }) {
  if (question.type === "paragraph") return <Textarea placeholder="回答を入力" />;
  if (["radio", "checkbox"].includes(question.type)) return <div className="space-y-2">{question.options.map((option) => <label key={option} className="flex items-center gap-2 text-sm"><input type={question.type === "radio" ? "radio" : "checkbox"} name={question.id} />{option}</label>)}</div>;
  if (question.type === "select") return <select className="w-full rounded-md border bg-white px-3 py-2 text-sm"><option>選択してください</option>{question.options.map((option) => <option key={option}>{option}</option>)}</select>;
  return <Input placeholder="回答を入力" />;
}

void LegacyEditPage;
void LegacyQuestionCard;
void LegacyPreviewPage;
void LegacyPreviewControl;

function EditPage({ form, setForm, sensors, onDragEnd, updateQuestion, addQuestion, deleteQuestion, changeType, updateOption, addOption, deleteOption, addSection, updateSection, deleteSection }) {
  const sections = normalizeSections(form.sections);

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4 md:p-8">
      <Card className="border-t-8 border-t-purple-600">
        <CardHeader><CardTitle className="text-2xl">フォーム作成</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input className="text-xl font-semibold" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">セクション</CardTitle>
          <Button variant="outline" size="sm" className="gap-2" onClick={addSection}><FaPlus />セクション追加</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {sections.map((section, index) => (
            <div key={section.id} className="grid gap-2 rounded-lg border bg-white p-3 md:grid-cols-[120px_1fr_1fr_auto] md:items-center">
              <div className="text-sm font-medium text-slate-500">セクション {index + 1}</div>
              <Input value={section.title} onChange={(event) => updateSection(section.id, { title: event.target.value })} />
              <Input value={section.description} onChange={(event) => updateSection(section.id, { description: event.target.value })} placeholder="説明（任意）" />
              <Button variant="ghost" size="icon" disabled={sections.length <= 1} onClick={() => deleteSection(section.id)}><FaTrash /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={form.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {form.questions.map((question, index) => (
              <SortableQuestion
                key={question.id}
                question={question}
                index={index}
                sections={sections}
                updateQuestion={updateQuestion}
                deleteQuestion={deleteQuestion}
                changeType={changeType}
                updateOption={updateOption}
                addOption={addOption}
                deleteOption={deleteOption}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex justify-center pb-12"><Button onClick={addQuestion} className="gap-2 bg-purple-600 hover:bg-purple-700"><FaPlus />質問追加</Button></div>
    </main>
  );
}

function QuestionCard({ question, index, sections, updateQuestion, deleteQuestion, changeType, updateOption, addOption, deleteOption, attributes, listeners, isDragging }) {
  const hasOptions = ["radio", "checkbox", "select"].includes(question.type);
  const branchCapable = ["radio", "select"].includes(question.type) && question.options.length > 0;
  const branch = normalizeBranch(question.branch);
  const sectionTitle = sections.find((section) => section.id === question.sectionId)?.title ?? "未分類";

  const updateBranch = (patch) => updateQuestion(question.id, { branch: { ...branch, ...patch } });

  return (
    <Card className={`border-l-4 border-l-purple-500 ${isDragging ? "shadow-2xl ring-2 ring-purple-300" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="cursor-grab rounded p-2 text-slate-400 hover:bg-slate-100" {...attributes} {...listeners}><FaGripVertical /></button>
          <div>
            <CardTitle className="text-base text-slate-500">質問 {index + 1}</CardTitle>
            <p className="mt-1 text-xs text-slate-400">{sectionTitle}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => deleteQuestion(question.id)}><FaTrash /></Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <Input value={question.title} onChange={(event) => updateQuestion(question.id, { title: event.target.value })} />
          <Select value={question.type} onValueChange={(value) => changeType(question.id, value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{questionTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <Input value={question.description} onChange={(event) => updateQuestion(question.id, { description: event.target.value })} placeholder="説明文（任意）" />
          <select className="h-9 rounded-md border bg-white px-3 text-sm" value={question.sectionId ?? sections[0]?.id} onChange={(event) => updateQuestion(question.id, { sectionId: event.target.value })}>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
          </select>
        </div>

        {hasOptions ? (
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-2">
                <span className="w-6 text-center text-sm text-slate-500">{question.type === "checkbox" ? "□" : question.type === "radio" ? "○" : optionIndex + 1}</span>
                <Input value={option} onChange={(event) => updateOption(question.id, optionIndex, event.target.value)} />
                <Button variant="ghost" size="icon" disabled={question.options.length <= 1} onClick={() => deleteOption(question.id, optionIndex)}><FaTrash /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addOption(question.id)}>選択肢追加</Button>
          </div>
        ) : <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-slate-500">回答欄が表示されます</div>}

        {branchCapable && (
          <div className="space-y-3 rounded-lg bg-slate-50 p-4">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={branch.enabled} onChange={(event) => updateBranch({ enabled: event.target.checked })} />
              回答によって次のセクションを変える
            </label>
            {branch.enabled && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">条件となる回答</label>
                  <select className="h-9 w-full rounded-md border bg-white px-3 text-sm" value={branch.option} onChange={(event) => updateBranch({ option: event.target.value })}>
                    <option value="">選択してください</option>
                    {question.options.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">移動先</label>
                  <select className="h-9 w-full rounded-md border bg-white px-3 text-sm" value={branch.targetSectionId} onChange={(event) => updateBranch({ targetSectionId: event.target.value })}>
                    <option value="">次のセクション</option>
                    {sections.filter((section) => section.id !== question.sectionId).map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
                    <option value="__submit__">送信完了へ</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end border-t pt-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(question.id, { required: event.target.checked })} />必須
          </label>
        </div>
      </CardContent>
    </Card>
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

function UnavailableFormPage({ form }) {
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
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 px-3 py-2">公開範囲: {getVisibilityLabel(settings.visibility)}</div>
            <div className="rounded-md bg-slate-50 px-3 py-2">公開期限: {formatDeadline(settings.deadline)}</div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function isAnswered(question, value) {
  if (question.type === "checkbox") return Array.isArray(value) && value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
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

function AnswerProgress({ questions, values, currentSectionIndex, totalSections }) {
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

function AnswerForm({ form, submitLabel = "送信" }) {
  const [sectionId, setSectionId] = useState((form.sections ?? createDefaultSections())[0]?.id ?? "section-1");
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const settings = form.settings ?? createDefaultSettings();
  const sections = normalizeSections(form.sections);
  const currentSectionIndex = Math.max(0, sections.findIndex((section) => section.id === sectionId));
  const currentSection = sections[currentSectionIndex] ?? sections[0];
  const currentQuestions = form.questions.filter((question) => (question.sectionId ?? "section-1") === currentSection.id);
  const unavailableReason = getUnavailableReason(settings);

  if (submitted) return <SubmissionComplete settings={settings} />;
  if (unavailableReason) return <UnavailableFormPage form={form} />;

  const setQuestionValue = (question, value) => {
    setValues((current) => ({ ...current, [question.id]: value }));
    setErrors((current) => ({ ...current, [question.id]: "" }));
  };

  const validateCurrentSection = () => {
    const nextErrors = {};
    currentQuestions.forEach((question) => {
      if (question.required && !isAnswered(question, values[question.id])) nextErrors[question.id] = "この質問は必須です。";
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateCurrentSection()) return;
    const branchTarget = getBranchTarget(currentQuestions, values);
    if (branchTarget === "__submit__") { setSubmitted(true); return; }
    if (branchTarget && sections.some((section) => section.id === branchTarget)) { setSectionId(branchTarget); return; }
    if (currentSectionIndex >= sections.length - 1) { setSubmitted(true); return; }
    setSectionId(sections[currentSectionIndex + 1].id);
  };

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
      <FormHeaderCard form={form} />
      <AnswerProgress questions={form.questions} values={values} currentSectionIndex={currentSectionIndex} totalSections={sections.length} />

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
              <span>{question.title}</span>
              {question.required ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">必須</span> : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">任意</span>}
            </div>
            {question.description && <p className="text-sm text-slate-500">{question.description}</p>}
            <PreviewControl question={question} value={values[question.id]} onChange={(value) => setQuestionValue(question, value)} />
            {errors[question.id] && <p className="text-sm text-red-600">{errors[question.id]}</p>}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-between gap-2 pb-12">
        <Button variant="outline" disabled={currentSectionIndex === 0} onClick={() => setSectionId(sections[currentSectionIndex - 1].id)}>戻る</Button>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={goNext}>{currentSectionIndex >= sections.length - 1 ? submitLabel : "次へ"}</Button>
      </div>
    </main>
  );
}

function PreviewPage({ form }) {
  return <AnswerForm form={form} submitLabel="送信" />;
}

function PreviewControl({ question, value, onChange }) {
  const update = onChange ?? (() => {});
  if (question.type === "paragraph") return <Textarea placeholder="回答を入力" value={value ?? ""} onChange={(event) => update(event.target.value)} />;
  if (question.type === "radio") return <div className="space-y-2">{question.options.map((option) => <label key={option} className="flex items-center gap-2 text-sm"><input type="radio" name={question.id} checked={value === option} onChange={() => update(option)} />{option}</label>)}</div>;
  if (question.type === "checkbox") {
    const currentValue = Array.isArray(value) ? value : [];
    return <div className="space-y-2">{question.options.map((option) => <label key={option} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={currentValue.includes(option)} onChange={(event) => update(event.target.checked ? [...currentValue, option] : currentValue.filter((item) => item !== option))} />{option}</label>)}</div>;
  }
  if (question.type === "select") return <select className="w-full rounded-md border bg-white px-3 py-2 text-sm" value={value ?? ""} onChange={(event) => update(event.target.value)}><option value="">選択してください</option>{question.options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
  return <Input placeholder="回答を入力" value={value ?? ""} onChange={(event) => update(event.target.value)} />;
}
