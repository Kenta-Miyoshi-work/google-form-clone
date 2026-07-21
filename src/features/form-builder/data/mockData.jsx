import { FaBell, FaBriefcase, FaBullhorn, FaLayerGroup, FaUser } from "react-icons/fa6";

export const questionTypes = [
  { value: "shortText", label: "記述式" },
  { value: "radio", label: "ラジオボタン" },
  { value: "checkbox", label: "チェックボックス" },
  { value: "file", label: "ファイル添付" },
];

export const visibilityOptions = [
  { value: "private", label: "非公開", description: "作成者だけが確認できます。" },
  { value: "limited", label: "リンクを知っている人", description: "URLを知っている人が回答できます。" },
  { value: "organization", label: "組織内", description: "社内ユーザーだけが回答できます。" },
  { value: "public", label: "全体公開", description: "誰でも回答できます。" },
];

export const confirmationTypeOptions = [
  { value: "default", label: "デフォルト" },
  { value: "custom", label: "お礼メッセージを表示" },
];

export const sampleHeaderImageUrl = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80";
export const maxJsonImportLength = 200000;
export const llmPromptExample = `Googleフォーム風のフォーム定義JSONを作ってください。
目的: 研修参加申請フォーム
対象者: 社内の受講希望者
出力条件:
- JSONだけを出力する
- idやsectionIdなど内部IDは書かない
- sectionsはtitleとdescriptionだけを書く
- questionsはsection, type, title, description, required, placeholder, example, options, validationを書く
- typeはshortText, radio, checkbox, fileのいずれか
- 選択式ではallowOther, randomizeOptionsを書ける
- fileではfileTypesとmaxFilesを書ける
- 分岐が必要な場合はbranch.enabled, branch.option, branch.targetSectionを書く
- targetSectionはセクション名、送信完了に進める場合は「送信完了」と書く
- settingsには公開範囲、期限、受付状態、テーマ色、進捗表示、回答ルール、送信完了メッセージを含める`;

export const templates = [
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

export const actionItems = [
  { id: "a1", title: "研修参加申請フォーム", requester: "人材開発チーム", due: "2026/07/12", status: "未回答", visibility: "organization", templateId: "training", headerImageUrl: sampleHeaderImageUrl, confirmationType: "custom", thankYouTitle: "申請を受け付けました", thankYouMessage: "研修事務局で内容を確認し、参加可否をメールでお知らせします。" },
  { id: "a2", title: "満足度アンケート", requester: "イベント事務局", due: "2026/07/15", status: "未回答", visibility: "limited", templateId: "survey" },
  { id: "a9", title: "エラー確認用アンケート", requester: "フォーム品質管理チーム", due: "2026/07/30", status: "未回答", visibility: "organization", templateId: "survey", simulateSystemError: true },
  { id: "a7", title: "Q2 研修申込（第2回）", requester: "人材開発チーム", due: "2026/07/01", status: "期限切れ", visibility: "organization", templateId: "training" },
  { id: "a6", title: "デモ回答用アンケート", requester: "フォーム体験チーム", due: "2026/07/22", status: "未回答", visibility: "organization", templateId: "survey" },
  { id: "a8", title: "デモ確認用アンケート", requester: "教育企画チーム", due: "2026/07/09", status: "回答済み", visibility: "organization", templateId: "survey", reviewSubmittedAt: "2026/07/09 16:40", reviewAnswers: { 全体の満足度: "満足", よかった点: "内容, 資料", 改善してほしい点: "質疑応答の時間を増やしてほしい", 資料の分かりやすさ: "分かりやすい", 今後の参加意向: "参加したい" } },
  { id: "a4", title: "社内設備利用アンケート", requester: "総務チーム", due: "2026/07/08", status: "回答済み", visibility: "organization", templateId: "equipmentAudit", reviewSubmittedAt: "2026/07/08 14:20", reviewAnswers: { 氏名: "山田 太郎", 所属部署: "営業部", 現在利用中の備品: "ノートPC, モニター, ヘッドセット", PCの状態: "問題なし", 不具合の詳細: "特になし", 利用頻度: "毎日", 返却予定の備品: "なし", 追加で必要な備品: "なし" } },
  { id: "a5", title: "備品購入希望ヒアリング", requester: "購買管理チーム", due: "2026/07/10", status: "回答済み", visibility: "private", templateId: "purchase", reviewSubmittedAt: "2026/07/10 10:05", reviewAnswers: { 申請者名: "山田 太郎", 所属部署: "営業部", 購入希望品名: "外付けモニター", 購入理由: "在宅勤務の作業効率改善", 概算金額: "38,000", 希望納期: "今月中", 上長への共有事項: "予算内で購入可能見込み" } },
  { id: "a3", title: "備品利用状況確認", requester: "総務チーム", due: "2026/07/19", status: "受付停止", visibility: "organization", templateId: "equipmentAudit", acceptingResponses: false },
];

export const createdForms = [
  { id: "c1", title: "研修参加申請フォーム", status: "公開中", updatedAt: "2026/07/08 18:20", responses: 12, visibility: "organization", deadline: "2026-07-31T17:00", templateId: "training", headerImageUrl: sampleHeaderImageUrl, confirmationType: "custom", thankYouTitle: "申請を受け付けました", thankYouMessage: "研修事務局で内容を確認し、参加可否をメールでお知らせします。" },
  { id: "c2", title: "満足度アンケート", status: "下書き", updatedAt: "2026/07/07 15:10", responses: 0, visibility: "limited", deadline: "", templateId: "survey" },
  { id: "c3", title: "備品購入依頼フォーム", status: "終了", updatedAt: "2026/07/05 09:45", responses: 3, visibility: "private", deadline: "2026-07-20T23:59", templateId: "purchase", acceptingResponses: false },
  { id: "c4", title: "集計確認用アンケート（10件回答）", status: "公開中", updatedAt: "2026/07/11 13:40", responses: 10, visibility: "organization", deadline: "2026-07-31T23:59", templateId: "survey" },
];

export const versionHistory = {
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
    { version: "v2", status: "終了", editor: "総務チーム", updatedAt: "2026/07/05 09:45", summary: "概算金額と希望納期を必須化", questions: 7, responses: 3 },
    { version: "v1", status: "公開終了", editor: "総務チーム", updatedAt: "2026/07/02 13:20", summary: "備品購入依頼の受付を開始", questions: 5, responses: 3 },
  ],
};

export const responseSamples = {
  c1: [
    { id: "r-1001", respondent: "田中 一郎", submittedAt: "2026/07/09 09:12", status: "確認待ち", answers: { 氏名: "田中 一郎", 所属部署: "営業部", 希望日程: "7月15日", 参加目的: "基礎理解, 業務改善", 受講形式: "オンライン" } },
    { id: "r-1002", respondent: "鈴木 美咲", submittedAt: "2026/07/09 10:48", status: "確認済み", answers: { 氏名: "鈴木 美咲", 所属部署: "開発部", 希望日程: "7月22日", 参加目的: "チーム展開", 受講形式: "会場参加" } },
    { id: "r-1003", respondent: "加藤 翔", submittedAt: "2026/07/10 08:35", status: "差し戻し", answers: { 氏名: "加藤 翔", 所属部署: "人事部", 希望日程: "7月29日", 参加目的: "資格取得", 受講形式: "録画視聴" } },
  ],
  c2: [],
  c3: [
    { id: "r-2001", respondent: "伊藤 玲奈", submittedAt: "2026/07/05 11:02", status: "承認待ち", answers: { 申請者名: "伊藤 玲奈", 購入希望品名: "27インチモニター", 購入理由: "追加購入", 概算金額: "42,000円", 希望納期: "今月中" } },
    { id: "r-2002", respondent: "森 健太", submittedAt: "2026/07/05 12:18", status: "承認済み", answers: { 申請者名: "森 健太", 購入希望品名: "Webカメラ", 購入理由: "故障交換", 概算金額: "8,500円", 希望納期: "今週中" } },
    { id: "r-2003", respondent: "阿部 真央", submittedAt: "2026/07/05 16:44", status: "却下", answers: { 申請者名: "阿部 真央", 購入希望品名: "タブレット", 購入理由: "新規購入", 概算金額: "89,000円", 希望納期: "来月中" } },
  ],
  c4: [
    { id: "r-4001", respondent: "山田 花子", submittedAt: "2026/07/11 09:01", status: "確認済み", answers: { 全体の満足度: "満足", よかった点: "内容, 資料", 改善してほしい点: "特になし", 資料の分かりやすさ: "とても分かりやすい", 今後の参加意向: "参加したい" } },
    { id: "r-4002", respondent: "佐藤 健", submittedAt: "2026/07/11 09:08", status: "確認済み", answers: { 全体の満足度: "やや満足", よかった点: "進行, 質疑応答", 改善してほしい点: "事例をもう少し増やしてほしい", 資料の分かりやすさ: "分かりやすい", 今後の参加意向: "参加したい" } },
    { id: "r-4003", respondent: "田中 一郎", submittedAt: "2026/07/11 09:20", status: "確認待ち", answers: { 全体の満足度: "満足", よかった点: "内容", 改善してほしい点: "後半の時間がやや短かった", 資料の分かりやすさ: "分かりやすい", 今後の参加意向: "内容による" } },
    { id: "r-4004", respondent: "鈴木 美咲", submittedAt: "2026/07/11 09:33", status: "確認済み", answers: { 全体の満足度: "普通", よかった点: "資料", 改善してほしい点: "もう少しハンズオンが欲しい", 資料の分かりやすさ: "普通", 今後の参加意向: "内容による" } },
    { id: "r-4005", respondent: "高橋 直樹", submittedAt: "2026/07/11 09:45", status: "確認待ち", answers: { 全体の満足度: "満足", よかった点: "内容, 進行", 改善してほしい点: "録画共有があると助かる", 資料の分かりやすさ: "分かりやすい", 今後の参加意向: "参加したい" } },
    { id: "r-4006", respondent: "中村 葵", submittedAt: "2026/07/11 10:02", status: "確認済み", answers: { 全体の満足度: "やや満足", よかった点: "質疑応答", 改善してほしい点: "開始時にゴールを明確にしてほしい", 資料の分かりやすさ: "分かりやすい", 今後の参加意向: "参加したい" } },
    { id: "r-4007", respondent: "小林 悠", submittedAt: "2026/07/11 10:14", status: "確認済み", answers: { 全体の満足度: "満足", よかった点: "内容, 会場", 改善してほしい点: "配布資料を事前共有してほしい", 資料の分かりやすさ: "とても分かりやすい", 今後の参加意向: "参加したい" } },
    { id: "r-4008", respondent: "加藤 翔", submittedAt: "2026/07/11 10:27", status: "確認待ち", answers: { 全体の満足度: "やや満足", よかった点: "進行", 改善してほしい点: "オンライン参加枠を増やしてほしい", 資料の分かりやすさ: "普通", 今後の参加意向: "内容による" } },
    { id: "r-4009", respondent: "伊藤 玲奈", submittedAt: "2026/07/11 10:41", status: "確認済み", answers: { 全体の満足度: "普通", よかった点: "内容", 改善してほしい点: "質問時間を長めにしてほしい", 資料の分かりやすさ: "普通", 今後の参加意向: "内容による" } },
    { id: "r-4010", respondent: "森 健太", submittedAt: "2026/07/11 10:56", status: "確認済み", answers: { 全体の満足度: "満足", よかった点: "内容, 資料, 質疑応答", 改善してほしい点: "アンケート回答期限をもう少し長くしてほしい", 資料の分かりやすさ: "分かりやすい", 今後の参加意向: "参加したい" } },
  ],
};

export const collaboratorSamples = [
  { name: "山田 花子", role: "オーナー", permission: "編集・公開・回答閲覧" },
  { name: "佐藤 健", role: "編集者", permission: "編集・プレビュー" },
  { name: "人材開発チーム", role: "閲覧者", permission: "回答閲覧" },
];

export const publishChecklist = ["フォームタイトルと説明", "必須質問の設定", "公開範囲", "公開期限", "送信完了メッセージ", "回答リンクの確認"];

export const recipientSamples = {
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
  c4: [
    { name: "山田 花子", email: "yamada@example.com", department: "営業部", status: "回答済み", lastContact: "2026/07/11 08:50" },
    { name: "佐藤 健", email: "sato@example.com", department: "開発部", status: "回答済み", lastContact: "2026/07/11 08:50" },
    { name: "田中 一郎", email: "tanaka@example.com", department: "営業部", status: "回答済み", lastContact: "2026/07/11 08:50" },
    { name: "鈴木 美咲", email: "suzuki@example.com", department: "開発部", status: "回答済み", lastContact: "2026/07/11 08:50" },
    { name: "高橋 直樹", email: "takahashi@example.com", department: "人事部", status: "回答済み", lastContact: "2026/07/11 08:50" },
    { name: "中村 葵", email: "nakamura@example.com", department: "総務部", status: "回答済み", lastContact: "2026/07/11 08:50" },
    { name: "小林 悠", email: "kobayashi@example.com", department: "総務部", status: "回答済み", lastContact: "2026/07/11 08:50" },
    { name: "加藤 翔", email: "kato@example.com", department: "人事部", status: "回答済み", lastContact: "2026/07/11 08:50" },
    { name: "伊藤 玲奈", email: "ito@example.com", department: "経理部", status: "回答済み", lastContact: "2026/07/11 08:50" },
    { name: "森 健太", email: "mori@example.com", department: "開発部", status: "回答済み", lastContact: "2026/07/11 08:50" },
    { name: "阿部 真央", email: "abe@example.com", department: "営業部", status: "未回答", lastContact: "2026/07/11 09:30" },
    { name: "橋本 結衣", email: "hashimoto@example.com", department: "人事部", status: "未回答", lastContact: "2026/07/11 09:30" },
  ],
};

export const notificationRuleSamples = {
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
  c4: [
    { label: "回答依頼", timing: "公開直後", channel: "メール", enabled: true, subject: "集計確認用アンケートへの回答依頼" },
    { label: "未回答者リマインド", timing: "期限3日前 09:00", channel: "メール", enabled: true, subject: "未回答のアンケートがあります" },
  ],
};

export const auditLogSamples = [
  { time: "2026/07/10 09:15", actor: "山田 花子", action: "集計画面を確認", target: "研修参加申請フォーム", detail: "回答3件のステータスを確認" },
  { time: "2026/07/10 09:00", actor: "山田 花子", action: "リマインド送信", target: "研修参加申請フォーム", detail: "未回答者2名に送信" },
  { time: "2026/07/08 18:20", actor: "山田 花子", action: "フォーム公開", target: "研修参加申請フォーム", detail: "v3を組織内公開" },
  { time: "2026/07/08 18:05", actor: "佐藤 健", action: "JSONインポート", target: "研修参加申請フォーム", detail: "質問8件、セクション3件を反映" },
  { time: "2026/07/07 15:10", actor: "イベント事務局", action: "下書き保存", target: "満足度アンケート", detail: "通知設定は未送信" },
  { time: "2026/07/05 09:45", actor: "総務チーム", action: "受付停止", target: "備品購入依頼フォーム", detail: "非公開へ変更" },
];

export const stateScenarios = [
  { id: "emptyResponses", title: "回答0件", description: "集計で空状態を表示します。" },
  { id: "noPermission", title: "権限なし", description: "閲覧権限がない場合のエラー表示です。" },
  { id: "deadlineExpired", title: "期限切れ", description: "回答期限を過ぎた回答画面です。" },
  { id: "alreadyAnswered", title: "回答済み", description: "1人1回回答の再アクセス時です。" },
  { id: "jsonError", title: "JSON取込エラー", description: "LLM生成JSONの形式不備です。" },
  { id: "csvError", title: "CSV取込エラー", description: "回答者CSVの列不足です。" },
];
