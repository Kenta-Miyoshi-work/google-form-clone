import { useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaArrowDown, FaArrowUp, FaCopy, FaGripVertical, FaPalette, FaPlus, FaTrash } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { questionTypes } from "../../data/mockData";
import { createDefaultSettings, normalizeBranch, normalizeQuestion, normalizeSections, normalizeVisibilityCondition, questionHasOptions } from "../../utils/formBuilderUtils";

export function SortableQuestion(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.question.id });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? "relative z-10 opacity-80" : ""}><QuestionCard {...props} attributes={attributes} listeners={listeners} isDragging={isDragging} /></div>;
}

export function EditPage({ form, setForm, sensors, onDragEnd, updateQuestion, addQuestion, deleteQuestion, duplicateQuestion, moveQuestion, changeType, updateOption, addOption, deleteOption, addSection, updateSection, deleteSection }) {
  const sections = normalizeSections(form.sections);
  const settings = createDefaultSettings(form.settings);
  const updateSettings = (patch) => setForm((current) => ({ ...current, settings: createDefaultSettings({ ...current.settings, ...patch }) }));

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4 md:p-8">
      <Card className="border-t-8 border-t-purple-600">
        <CardHeader><CardTitle className="text-2xl">フォーム作成</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input className="text-xl font-semibold" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </CardContent>
      </Card>

      <details className="rounded-lg border bg-white shadow-sm">
        <summary className="flex cursor-pointer items-center justify-between gap-3 px-6 py-4 text-sm font-medium text-slate-800 marker:hidden">
          <span className="flex items-center gap-2"><FaPalette className="text-purple-600" />見た目と回答ルール</span>
          <span className="text-xs text-slate-500">テーマ、進捗、回答ルール</span>
        </summary>
        <div className="space-y-5 px-6 pb-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">テーマカラー</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-9 w-12 rounded-md border bg-white" value={settings.themeColor} onChange={(event) => updateSettings({ themeColor: event.target.value })} />
                <Input value={settings.themeColor} onChange={(event) => updateSettings({ themeColor: event.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">背景色</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-9 w-12 rounded-md border bg-white" value={settings.backgroundColor} onChange={(event) => updateSettings({ backgroundColor: event.target.value })} />
                <Input value={settings.backgroundColor} onChange={(event) => updateSettings({ backgroundColor: event.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">送信ボタン文言</label>
              <Input value={settings.submitButtonLabel} onChange={(event) => updateSettings({ submitButtonLabel: event.target.value })} />
            </div>
          </div>

          <div className="grid gap-3 text-sm md:grid-cols-3">
            <label className="flex items-center gap-3 rounded-lg border bg-white p-3"><input type="checkbox" checked={settings.showProgress} onChange={(event) => updateSettings({ showProgress: event.target.checked })} />進捗バーを表示</label>
            <label className="flex items-center gap-3 rounded-lg border bg-white p-3"><input type="checkbox" checked={settings.collectEmail} onChange={(event) => updateSettings({ collectEmail: event.target.checked })} />メールアドレスを収集</label>
            <label className="flex items-center gap-3 rounded-lg border bg-white p-3"><input type="checkbox" checked={settings.anonymousResponses} onChange={(event) => updateSettings({ anonymousResponses: event.target.checked })} />匿名回答</label>
            <label className="flex items-center gap-3 rounded-lg border bg-white p-3"><input type="checkbox" checked={settings.limitOneResponse} onChange={(event) => updateSettings({ limitOneResponse: event.target.checked })} />1人1回のみ</label>
            <label className="flex items-center gap-3 rounded-lg border bg-white p-3"><input type="checkbox" checked={settings.allowEditAfterSubmit} onChange={(event) => updateSettings({ allowEditAfterSubmit: event.target.checked })} />送信後の編集を許可</label>
            <label className="flex items-center gap-3 rounded-lg border bg-white p-3"><input type="checkbox" checked={settings.sendReceipt} onChange={(event) => updateSettings({ sendReceipt: event.target.checked })} />回答コピーを送信</label>
          </div>

          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-medium text-slate-700">必須表示</label>
              <select className="h-9 w-full rounded-md border bg-white px-3" value={settings.requiredMarkStyle} onChange={(event) => updateSettings({ requiredMarkStyle: event.target.value })}>
                <option value="badge">バッジで表示</option>
                <option value="asterisk">質問名に * を表示</option>
              </select>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-slate-600">
              公開設定ダイアログのヘッダー画像・完了メッセージと合わせて、回答画面の見た目とルールをここで調整できます。
            </div>
          </div>
        </div>
      </details>

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
                questions={form.questions}
                index={index}
                sections={sections}
                updateQuestion={updateQuestion}
                deleteQuestion={deleteQuestion}
                changeType={changeType}
                updateOption={updateOption}
                addOption={addOption}
                deleteOption={deleteOption}
                duplicateQuestion={duplicateQuestion}
                moveQuestion={moveQuestion}
                totalQuestions={form.questions.length}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex justify-center pb-12"><Button onClick={addQuestion} className="gap-2 bg-purple-600 hover:bg-purple-700"><FaPlus />質問追加</Button></div>
    </main>
  );
}

export function QuestionCard({ question: rawQuestion, questions, index, sections, updateQuestion, deleteQuestion, duplicateQuestion, moveQuestion, changeType, updateOption, addOption, deleteOption, totalQuestions, attributes, listeners, isDragging }) {
  const question = normalizeQuestion(rawQuestion);
  const [bulkOptions, setBulkOptions] = useState("");
  const [bulkRows, setBulkRows] = useState("");
  const [bulkColumns, setBulkColumns] = useState("");
  const hasOptions = questionHasOptions(question.type);
  const branchCapable = ["radio", "select"].includes(question.type) && question.options.length > 0;
  const branch = normalizeBranch(question.branch);
  const visibilityCondition = normalizeVisibilityCondition(question.visibilityCondition);
  const sectionTitle = sections.find((section) => section.id === question.sectionId)?.title ?? "未分類";
  const branchOptions = question.allowOther ? [...question.options, "その他"] : question.options;
  const conditionSources = questions.map((candidate) => normalizeQuestion(candidate)).filter((candidate) => candidate.id !== question.id && questionHasOptions(candidate.type));
  const selectedConditionSource = conditionSources.find((candidate) => candidate.id === visibilityCondition.questionId);

  const updateBranch = (patch) => updateQuestion(question.id, { branch: { ...branch, ...patch } });
  const parseLines = (value) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const applyBulkOptions = () => {
    const nextOptions = parseLines(bulkOptions);
    if (nextOptions.length === 0) return;
    updateQuestion(question.id, { options: [...question.options, ...nextOptions] });
    setBulkOptions("");
  };
  const applyBulkRows = () => {
    const nextRows = parseLines(bulkRows);
    if (nextRows.length === 0) return;
    updateQuestion(question.id, { rows: [...question.rows, ...nextRows] });
    setBulkRows("");
  };
  const applyBulkColumns = () => {
    const nextColumns = parseLines(bulkColumns);
    if (nextColumns.length === 0) return;
    updateQuestion(question.id, { columns: [...question.columns, ...nextColumns] });
    setBulkColumns("");
  };
  const moveOption = (optionIndex, direction) => {
    const nextIndex = direction === "up" ? optionIndex - 1 : optionIndex + 1;
    if (nextIndex < 0 || nextIndex >= question.options.length) return;
    const nextOptions = [...question.options];
    [nextOptions[optionIndex], nextOptions[nextIndex]] = [nextOptions[nextIndex], nextOptions[optionIndex]];
    updateQuestion(question.id, { options: nextOptions });
  };

  return (
    <Card className={`border-l-4 border-l-purple-500 ${isDragging ? "shadow-2xl ring-2 ring-purple-300" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <button aria-label={`質問${index + 1}をドラッグして並べ替え`} className="cursor-grab rounded p-2 text-slate-400 hover:bg-slate-100" {...attributes} {...listeners}><FaGripVertical /></button>
          <div>
            <CardTitle className="text-base text-slate-500">質問 {index + 1}</CardTitle>
            <p className="mt-1 text-xs text-slate-400">{sectionTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button aria-label={`質問${index + 1}を上へ移動`} variant="ghost" size="icon" disabled={index === 0} onClick={() => moveQuestion(question.id, "up")}><FaArrowUp /></Button>
          <Button aria-label={`質問${index + 1}を下へ移動`} variant="ghost" size="icon" disabled={index >= totalQuestions - 1} onClick={() => moveQuestion(question.id, "down")}><FaArrowDown /></Button>
          <Button aria-label={`質問${index + 1}を複製`} variant="ghost" size="icon" onClick={() => duplicateQuestion(question.id)}><FaCopy /></Button>
          <Button aria-label={`質問${index + 1}を削除`} variant="ghost" size="icon" onClick={() => deleteQuestion(question.id)}><FaTrash /></Button>
        </div>
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

        <div className="grid gap-3 rounded-lg bg-slate-50 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">プレースホルダー</label>
            <Input value={question.placeholder} onChange={(event) => updateQuestion(question.id, { placeholder: event.target.value })} placeholder="例: 山田 太郎" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">回答例</label>
            <Input value={question.example} onChange={(event) => updateQuestion(question.id, { example: event.target.value })} placeholder="回答者に見せる入力例" />
          </div>
          <label className="flex items-center gap-3 text-sm text-slate-700 md:col-span-2">
            <input type="checkbox" checked={question.showDescription} onChange={(event) => updateQuestion(question.id, { showDescription: event.target.checked })} />
            回答画面に説明文を表示する
          </label>
        </div>

        {hasOptions ? (
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-2">
                <span className="w-6 text-center text-sm text-slate-500">{question.type === "checkbox" ? "□" : question.type === "radio" ? "○" : optionIndex + 1}</span>
                <Input value={option} onChange={(event) => updateOption(question.id, optionIndex, event.target.value)} />
                <Button aria-label={`選択肢${optionIndex + 1}を上へ移動`} variant="ghost" size="icon" disabled={optionIndex === 0} onClick={() => moveOption(optionIndex, "up")}><FaArrowUp /></Button>
                <Button aria-label={`選択肢${optionIndex + 1}を下へ移動`} variant="ghost" size="icon" disabled={optionIndex >= question.options.length - 1} onClick={() => moveOption(optionIndex, "down")}><FaArrowDown /></Button>
                <Button aria-label={`選択肢${optionIndex + 1}を削除`} variant="ghost" size="icon" disabled={question.options.length <= 1} onClick={() => deleteOption(question.id, optionIndex)}><FaTrash /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addOption(question.id)}>選択肢追加</Button>
            <div className="grid gap-3 rounded-lg bg-slate-50 p-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">選択肢を一括追加</label>
                <Textarea className="min-h-20" value={bulkOptions} onChange={(event) => setBulkOptions(event.target.value)} placeholder="1行に1つずつ貼り付け" />
              </div>
              <Button variant="outline" size="sm" onClick={applyBulkOptions}>追加</Button>
            </div>
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <label className="flex items-center gap-2"><input type="checkbox" checked={question.allowOther} onChange={(event) => updateQuestion(question.id, { allowOther: event.target.checked })} />「その他」を追加</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={question.randomizeOptions} onChange={(event) => updateQuestion(question.id, { randomizeOptions: event.target.checked })} />選択肢をランダム表示</label>
            </div>
          </div>
        ) : <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-slate-500">回答欄が表示されます</div>}

        {question.type === "rating" && (
          <div className="grid gap-3 rounded-lg bg-slate-50 p-4 md:grid-cols-4">
            <div className="space-y-2"><label className="text-xs font-medium text-slate-500">最小値</label><Input type="number" value={question.scaleMin} onChange={(event) => updateQuestion(question.id, { scaleMin: Number(event.target.value) })} /></div>
            <div className="space-y-2"><label className="text-xs font-medium text-slate-500">最大値</label><Input type="number" value={question.scaleMax} onChange={(event) => updateQuestion(question.id, { scaleMax: Number(event.target.value) })} /></div>
            <div className="space-y-2"><label className="text-xs font-medium text-slate-500">最小ラベル</label><Input value={question.scaleMinLabel} onChange={(event) => updateQuestion(question.id, { scaleMinLabel: event.target.value })} /></div>
            <div className="space-y-2"><label className="text-xs font-medium text-slate-500">最大ラベル</label><Input value={question.scaleMaxLabel} onChange={(event) => updateQuestion(question.id, { scaleMaxLabel: event.target.value })} /></div>
          </div>
        )}

        {question.type === "matrix" && (
          <div className="space-y-3 rounded-lg bg-slate-50 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">行</label>
                {question.rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-2">
                    <Input value={row} onChange={(event) => updateQuestion(question.id, { rows: question.rows.map((item, itemIndex) => itemIndex === rowIndex ? event.target.value : item) })} />
                    <Button aria-label={`行${rowIndex + 1}を削除`} variant="ghost" size="icon" disabled={question.rows.length <= 1} onClick={() => updateQuestion(question.id, { rows: question.rows.filter((_, itemIndex) => itemIndex !== rowIndex) })}><FaTrash /></Button>
                  </div>
                ))}
                <Textarea className="min-h-20" value={bulkRows} onChange={(event) => setBulkRows(event.target.value)} placeholder="行を一括追加" />
                <Button variant="outline" size="sm" onClick={applyBulkRows}>行を追加</Button>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">列</label>
                {question.columns.map((column, columnIndex) => (
                  <div key={columnIndex} className="flex items-center gap-2">
                    <Input value={column} onChange={(event) => updateQuestion(question.id, { columns: question.columns.map((item, itemIndex) => itemIndex === columnIndex ? event.target.value : item) })} />
                    <Button aria-label={`列${columnIndex + 1}を削除`} variant="ghost" size="icon" disabled={question.columns.length <= 1} onClick={() => updateQuestion(question.id, { columns: question.columns.filter((_, itemIndex) => itemIndex !== columnIndex) })}><FaTrash /></Button>
                  </div>
                ))}
                <Textarea className="min-h-20" value={bulkColumns} onChange={(event) => setBulkColumns(event.target.value)} placeholder="列を一括追加" />
                <Button variant="outline" size="sm" onClick={applyBulkColumns}>列を追加</Button>
              </div>
            </div>
          </div>
        )}

        {question.type === "file" && (
          <div className="grid gap-3 rounded-lg bg-slate-50 p-4 md:grid-cols-[1fr_160px]">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">許可するファイル種別</label>
              <Input value={question.fileTypes.join(", ")} onChange={(event) => updateQuestion(question.id, { fileTypes: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">最大ファイル数</label>
              <Input type="number" min="1" value={question.maxFiles} onChange={(event) => updateQuestion(question.id, { maxFiles: Number(event.target.value) })} />
            </div>
          </div>
        )}

        {question.type === "consent" && (
          <div className="space-y-2 rounded-lg bg-slate-50 p-4">
            <label className="text-xs font-medium text-slate-500">同意文</label>
            <Textarea className="min-h-20" value={question.consentText} onChange={(event) => updateQuestion(question.id, { consentText: event.target.value })} />
          </div>
        )}

        <div className="grid gap-3 rounded-lg bg-slate-50 p-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">回答形式</label>
            <select className="h-9 w-full rounded-md border bg-white px-3 text-sm" value={question.validation.format} onChange={(event) => updateQuestion(question.id, { validation: { ...question.validation, format: event.target.value } })}>
              <option value="none">指定なし</option>
              <option value="email">メール</option>
              <option value="url">URL</option>
              <option value="tel">電話番号</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">最小/最小値</label>
            <Input value={question.type === "number" ? question.validation.min : question.validation.minLength} onChange={(event) => updateQuestion(question.id, { validation: { ...question.validation, [question.type === "number" ? "min" : "minLength"]: event.target.value } })} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">最大/最大値</label>
            <Input value={question.type === "number" ? question.validation.max : question.validation.maxLength} onChange={(event) => updateQuestion(question.id, { validation: { ...question.validation, [question.type === "number" ? "max" : "maxLength"]: event.target.value } })} />
          </div>
          <div className="space-y-2 md:col-span-3">
            <label className="text-xs font-medium text-slate-500">エラーメッセージ</label>
            <Input value={question.validation.errorMessage} onChange={(event) => updateQuestion(question.id, { validation: { ...question.validation, errorMessage: event.target.value } })} placeholder="未入力なら標準メッセージ" />
          </div>
        </div>

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
                    {branchOptions.map((option) => <option key={option} value={option}>{option}</option>)}
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

        <div className="space-y-3 rounded-lg bg-slate-50 p-4">
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={visibilityCondition.enabled} onChange={(event) => updateQuestion(question.id, { visibilityCondition: { ...visibilityCondition, enabled: event.target.checked } })} />
            他の回答に応じてこの質問を表示する
          </label>
          {visibilityCondition.enabled && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">参照する質問</label>
                <select className="h-9 w-full rounded-md border bg-white px-3 text-sm" value={visibilityCondition.questionId} onChange={(event) => updateQuestion(question.id, { visibilityCondition: { ...visibilityCondition, questionId: event.target.value, option: "" } })}>
                  <option value="">選択してください</option>
                  {conditionSources.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">表示する回答</label>
                <select className="h-9 w-full rounded-md border bg-white px-3 text-sm" value={visibilityCondition.option} onChange={(event) => updateQuestion(question.id, { visibilityCondition: { ...visibilityCondition, option: event.target.value } })}>
                  <option value="">選択してください</option>
                  {(selectedConditionSource?.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t pt-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(question.id, { required: event.target.checked })} />必須
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
