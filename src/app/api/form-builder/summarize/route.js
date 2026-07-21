import { ProxyAgent } from "undici";

export const runtime = "nodejs";

function getAiMode() {
  return (process.env.NEXT_PUBLIC_AI_MODE || process.env.AI_MODE || "").trim().toLowerCase();
}

function buildSummaryPrompt({ questionTitle, answers }) {
  const formattedAnswers = answers.map((answer, index) => `${index + 1}. ${answer}`).join("\n");

  return [
    "あなたはアンケート分析の専門家です。",
    "以下の設問の自由記述回答を読み取り、全体傾向を日本語で簡潔に要約してください。",
    "出力ルール:",
    "- 回答内容の傾向を2から4文でまとめる",
    "- 特定個人を特定できる書き方は避ける",
    "- 箇条書きではなく文章で出力する",
    "- 先頭に見出しは付けない",
    "",
    `設問: ${questionTitle}`,
    "回答一覧:",
    formattedAnswers,
  ].join("\n");
}

function getProxyDispatcher() {
  const proxyUrl =
    process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;

  if (!proxyUrl) return undefined;

  const normalizedProxyUrl = /^https?:\/\//i.test(proxyUrl) ? proxyUrl : `http://${proxyUrl}`;

  return new ProxyAgent(normalizedProxyUrl);
}

function getGeminiErrorMessage(payload, status) {
  const message = typeof payload?.error?.message === "string" ? payload.error.message.replace(/AIza[\w-]+/g, "[redacted]").slice(0, 240) : "";

  return message
    ? `AI要約サービスからエラーが返りました。(HTTP ${status}: ${message})`
    : `AI要約サービスからエラーが返りました。(HTTP ${status})`;
}

function buildMockSummary({ questionTitle, answers }) {
  if (answers.length === 0) {
    return `${questionTitle}に関する有効な回答がありませんでした。`;
  }

  const uniqueAnswers = Array.from(new Set(answers));
  const sampleTexts = uniqueAnswers.slice(0, 3).map((text) => `「${text}」`).join("、");
  const overlapCount = Math.max(answers.length - uniqueAnswers.length, 0);
  const overlapText = overlapCount > 0
    ? `似た意見が${overlapCount}件あり、共通傾向が見られます。`
    : "回答内容は多様で、複数の観点が挙がっています。";

  return `設問「${questionTitle}」には${answers.length}件の回答があり、主な意見として${sampleTexts}が挙がりました。${overlapText}`;
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const questionTitle = typeof body?.questionTitle === "string" ? body.questionTitle.trim() : "";
    const answers = Array.isArray(body?.answers)
      ? body.answers.map((answer) => String(answer || "").trim()).filter(Boolean)
      : [];

    if (!questionTitle) {
      return jsonResponse({ error: "設問名が指定されていません。" }, 400);
    }

    if (questionTitle.length > 300) {
      return jsonResponse({ error: "設問名は300文字以内で入力してください。" }, 400);
    }

    if (answers.length > 80) {
      return jsonResponse({ error: "要約対象の回答は80件以内にしてください。" }, 400);
    }

    const totalLength = answers.reduce((sum, answer) => sum + answer.length, 0);
    if (totalLength > 12000) {
      return jsonResponse({ error: "回答文が長すぎるため、要約対象を減らしてください。" }, 400);
    }

    const mode = getAiMode();
    if (mode !== "live" || answers.length === 0) {
      return jsonResponse({ summary: buildMockSummary({ questionTitle, answers }), model: "mock" }, 200);
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return jsonResponse({ error: "AI要約のAPIキーが設定されていません。" }, 500);
    }

    const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.1-flash-lite";
    const dispatcher = getProxyDispatcher();

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        ...(dispatcher ? { dispatcher } : {}),
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: buildSummaryPrompt({ questionTitle, answers }),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.25,
          },
        }),
      }
    );

    const geminiPayload = await geminiResponse.json().catch(() => ({}));

    if (!geminiResponse.ok) {
      console.error(
        "Gemini summary error:",
        JSON.stringify({ status: geminiResponse.status, model, error: geminiPayload?.error }, null, 2).replace(/AIza[\w-]+/g, "[redacted]")
      );

      return jsonResponse({ error: getGeminiErrorMessage(geminiPayload, geminiResponse.status), model }, 502);
    }

    const summary = geminiPayload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim() || "";

    if (!summary) {
      return jsonResponse({ error: "AI要約結果が空でした。" }, 502);
    }

    return jsonResponse({ summary, model }, 200);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "AI要約に失敗しました。" }, 500);
  }
}
