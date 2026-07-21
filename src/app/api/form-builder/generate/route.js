import { ProxyAgent } from "undici";

const supportedQuestionTypes = ["shortText", "radio", "checkbox", "file"];

export const runtime = "nodejs";

const responseSchemaDescription = `{
  "version": 1,
  "title": "フォーム名",
  "description": "フォームの目的",
  "settings": {
    "visibility": "limited | organization | public | private",
    "deadline": "YYYY-MM-DDTHH:mm または空文字",
    "acceptingResponses": true,
    "themeColor": "#7c3aed",
    "backgroundColor": "#f1f5f9",
    "showProgress": true,
    "collectEmail": true,
    "limitOneResponse": false,
    "allowEditAfterSubmit": false,
    "sendReceipt": false,
    "submitButtonLabel": "送信",
    "confirmationType": "default | custom",
    "thankYouTitle": "ご回答ありがとうございました",
    "thankYouMessage": "回答を受け付けました。"
  },
  "sections": [
    { "title": "セクション名", "description": "セクション説明" }
  ],
  "questions": [
    {
      "section": "sectionsに存在するセクション名",
      "type": "shortText | radio | checkbox | file",
      "title": "質問文",
      "description": "補足説明",
      "required": true,
      "placeholder": "入力例",
      "example": "回答例",
      "options": ["選択肢1", "選択肢2"],
      "allowOther": false,
      "randomizeOptions": false,
      "fileTypes": ["PDF", "画像"],
      "maxFiles": 1,
      "validation": { "format": "none", "minLength": "", "maxLength": "", "min": "", "max": "", "errorMessage": "" }
    }
  ]
}`;

function buildPrompt({ prompt, currentDate, currentForm }) {
  const currentFormPrompt = currentForm
    ? `\n\n現在のフォーム:\n${JSON.stringify(currentForm)}\n\n現在のフォームがある場合は、ユーザーが依頼した変更だけを反映し、依頼されていないタイトル、説明、セクション、質問、設定はできるだけ維持してください。`
    : "";

  return `あなたは業務フォーム設計の専門家です。ユーザーの要望から、Googleフォーム風のフォーム定義JSONを作成してください。\n\n現在日付: ${currentDate || "未指定"}\n\n必須ルール:\n- JSONオブジェクトだけを返してください。Markdown、説明文、コードフェンスは不要です。\n- id、sectionIdなど内部IDは書かないでください。\n- sectionsのtitleは一意にしてください。\n- questionsのsectionはsectionsに存在するtitleだけを指定してください。\n- typeは ${supportedQuestionTypes.join(", ")} のいずれかだけを使ってください。\n- radioとcheckboxにはoptionsを2件以上入れてください。\n- shortTextには必要に応じてplaceholder、example、validationを入れてください。\n- fileにはfileTypesとmaxFilesを入れてください。\n- 質問数は要望に指定がなければ5から10問程度にしてください。\n- 日本語の業務画面でそのまま使える、具体的で重複の少ない質問にしてください。\n\n出力形式:\n${responseSchemaDescription}\n\nユーザー要望:\n${prompt}${currentFormPrompt}`;
}

function extractJson(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) throw new Error("AIから空の応答が返りました。");

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = fenceMatch ? fenceMatch[1].trim() : trimmed;

  try {
    return JSON.parse(jsonText);
  } catch (e) {
    const start = jsonText.indexOf("{");
    const end = jsonText.lastIndexOf("}");
    if (start < 0 || end <= start) {
      throw new Error("AIの応答からJSONを抽出できませんでした。");
    }
    return JSON.parse(jsonText.slice(start, end + 1));
  }
}

function validateGeneratedForm(value) {
  const errors = [];

  if (!value || typeof value !== "object") {
    return ["JSONルートはオブジェクトにしてください。"];
  }

  if (!value.title || typeof value.title !== "string") {
    errors.push("title は必須です。");
  }

  if (!Array.isArray(value.sections) || value.sections.length === 0) {
    errors.push("sections は1件以上必要です。");
  }

  if (!Array.isArray(value.questions) || value.questions.length === 0) {
    errors.push("questions は1件以上必要です。");
  }

  const sectionNames = new Set(
    (Array.isArray(value.sections) ? value.sections : []).map((section) => section?.title).filter(Boolean)
  );

  if (Array.isArray(value.sections) && sectionNames.size !== value.sections.length) {
    errors.push("sections.title は重複しないようにしてください。");
  }

  (Array.isArray(value.questions) ? value.questions : []).forEach((question, index) => {
    const label = `questions[${index}]`;

    if (!supportedQuestionTypes.includes(question?.type)) {
      errors.push(`${label}.type は対応していない形式です。`);
    }

    if (!question?.title || typeof question.title !== "string") {
      errors.push(`${label}.title は必須です。`);
    }

    if (!question?.section || typeof question.section !== "string") {
      errors.push(`${label}.section は必須です。`);
    } else if (!sectionNames.has(question.section)) {
      errors.push(`${label}.section は sections に存在しません。`);
    }

    if (["radio", "checkbox"].includes(question?.type) && (!Array.isArray(question.options) || question.options.length < 2)) {
      errors.push(`${label}.options は2件以上必要です。`);
    }

    if (question?.type === "file" && Number(question.maxFiles ?? 1) < 1) {
      errors.push(`${label}.maxFiles は1以上にしてください。`);
    }
  });

  return errors;
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
    ? `AI生成サービスからエラーが返りました。(HTTP ${status}: ${message})`
    : `AI生成サービスからエラーが返りました。(HTTP ${status})`;
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return jsonResponse({ error: "AI生成のAPIキーが設定されていません。" }, 500);
    }

    const body = await request.json();

    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const currentForm = body?.currentForm && typeof body.currentForm === "object" ? body.currentForm : null;

    if (!prompt) {
      return jsonResponse({ error: "フォーム要望を入力してください。" }, 400);
    }

    if (prompt.length > 4000) {
      return jsonResponse({ error: "要望は4000文字以内で入力してください。" }, 400);
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
                  text: buildPrompt({
                    prompt,
                    currentDate: body?.currentDate,
                    currentForm,
                  }),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const geminiPayload = await geminiResponse.json().catch(() => ({}));

    if (!geminiResponse.ok) {
      console.error(
        "Gemini error:",
        JSON.stringify({ status: geminiResponse.status, model, error: geminiPayload?.error }, null, 2).replace(/AIza[\w-]+/g, "[redacted]")
      );

      return jsonResponse({ error: getGeminiErrorMessage(geminiPayload, geminiResponse.status), model }, 502);
    }

    const text = geminiPayload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";

    const form = extractJson(text);
    const validationErrors = validateGeneratedForm(form);

    if (validationErrors.length > 0) {
      return jsonResponse({ error: validationErrors.join("\n") }, 422);
    }

    return jsonResponse({ form, model }, 200);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "AI生成に失敗しました。" }, 500);
  }
}