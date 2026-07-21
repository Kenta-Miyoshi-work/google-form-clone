const mockForm = {
    version: 1,
    title: "AIデモフォーム",
    description: "GitHub Pagesでも確認できる固定レスポンスのフォームです。",
    settings: {
        visibility: "organization",
        deadline: "",
        acceptingResponses: true,
        themeColor: "#7c3aed",
        backgroundColor: "#f1f5f9",
        showProgress: true,
        collectEmail: false,
        limitOneResponse: false,
        allowEditAfterSubmit: false,
        sendReceipt: false,
        submitButtonLabel: "送信",
        confirmationType: "default",
        thankYouTitle: "ご回答ありがとうございました",
        thankYouMessage: "回答を受け付けました。",
    },
    sections: [{ title: "基本情報", description: "回答に必要な情報を入力してください。" }],
    questions: [
        {
            section: "基本情報",
            type: "shortText",
            title: "お名前",
            description: "回答者のお名前を入力してください。",
            required: true,
            placeholder: "山田 太郎",
        },
        {
            section: "基本情報",
            type: "radio",
            title: "満足度を教えてください",
            required: true,
            options: ["とても満足", "満足", "ふつう", "不満"],
        },
    ],
};

async function requestLiveForm({ prompt, currentForm }) {
    const response = await fetch("/api/form-builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, currentForm }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || "AI生成に失敗しました。");
    if (!result?.form) throw new Error("AI生成結果が取得できませんでした。");
    return result;
}

async function requestLiveSummary({ questionTitle, answers }) {
    const response = await fetch("/api/form-builder/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionTitle, answers }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || "AI要約に失敗しました。");
    if (!result?.summary || typeof result.summary !== "string") throw new Error("AI要約結果が取得できませんでした。");
    return result;
}

function buildMockSummary({ questionTitle, answers }) {
    const trimmedAnswers = (Array.isArray(answers) ? answers : [])
        .map((answer) => String(answer || "").trim())
        .filter(Boolean);

    if (trimmedAnswers.length === 0) {
        return `${questionTitle}に関する有効な回答がありませんでした。`;
    }

    const uniqueAnswers = Array.from(new Set(trimmedAnswers));
    const sampleTexts = uniqueAnswers.slice(0, 3).map((text) => `「${text}」`).join("、");
    const overlapCount = Math.max(trimmedAnswers.length - uniqueAnswers.length, 0);
    const overlapText = overlapCount > 0
        ? `似た意見が${overlapCount}件あり、共通傾向が見られます。`
        : "回答内容は多様で、複数の観点が挙がっています。";

    return `設問「${questionTitle}」には${trimmedAnswers.length}件の回答があり、主な意見として${sampleTexts}が挙がりました。${overlapText}`;
}

export function generateForm({ prompt, currentForm }) {
    const mode = process.env.NEXT_PUBLIC_AI_MODE?.trim().toLowerCase();

    if (mode === "live") {
        return requestLiveForm({ prompt, currentForm });
    }

    return Promise.resolve({ form: structuredClone(mockForm), model: "mock" });
}

export function summarizeTextAnswers({ questionTitle, answers }) {
    const mode = process.env.NEXT_PUBLIC_AI_MODE?.trim().toLowerCase();

    if (mode === "live") {
        return requestLiveSummary({ questionTitle, answers });
    }

    return Promise.resolve({ summary: buildMockSummary({ questionTitle, answers }), model: "mock" });
}
