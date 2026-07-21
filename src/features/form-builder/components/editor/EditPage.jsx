import { useMemo, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaArrowDown, FaArrowUp, FaChevronDown, FaCopy, FaGripVertical, FaPlus, FaTrash } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { questionTypes } from "../../data/mockData";
import { DEFAULT_FORM_DESCRIPTION, DEFAULT_FORM_TITLE, DEFAULT_QUESTION_TITLE, normalizeQuestion, questionHasOptions } from "../../utils/formBuilderUtils";

const selectableQuestionTypes = questionTypes.filter((type) => type.value !== "file");

const collaboratorDepartments = [
  {
    id: "org-sales",
    label: "営業本部",
    members: [
      { id: "user-yamada", label: "山田 花子" },
      { id: "user-sato", label: "佐藤 健" },
    ],
  },
  {
    id: "org-dev",
    label: "開発本部",
    members: [
      { id: "user-suzuki", label: "鈴木 美咲" },
      { id: "user-tanaka", label: "田中 一郎" },
    ],
  },
  {
    id: "org-hr",
    label: "人事本部",
    members: [
      { id: "user-kobayashi", label: "小林 真由" },
      { id: "user-kato", label: "加藤 翔" },
    ],
  },
];

const allCollaboratorMembers = collaboratorDepartments.flatMap((department) => (
  department.members.map((member) => ({ ...member, departmentId: department.id, departmentLabel: department.label }))
));
const collaboratorMemberIdSet = new Set(allCollaboratorMembers.map((member) => member.id));

function getCollaboratorMemberIds(departmentId) {
  return collaboratorDepartments.find((department) => department.id === departmentId)?.members.map((member) => member.id) ?? [];
}

function normalizeCollaboratorIds(value) {
  const source = Array.isArray(value) ? value : [];
  const selectedSet = new Set();
  source.forEach((targetId) => {
    if (collaboratorMemberIdSet.has(targetId)) {
      selectedSet.add(targetId);
      return;
    }
    getCollaboratorMemberIds(targetId).forEach((memberId) => selectedSet.add(memberId));
  });
  return Array.from(selectedSet);
}

export function SortableQuestion(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.question.id });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? "relative z-10 opacity-80" : ""}><QuestionCard {...props} attributes={attributes} listeners={listeners} isDragging={isDragging} /></div>;
}

export function EditPage({ form, setForm, activeTab, publishValidation = { formTitleError: "", questionTitleErrors: {} }, sensors, onDragEnd, updateQuestion, addQuestion, duplicateQuestion, deleteQuestion, moveQuestion, changeType, updateOption, addOption, deleteOption }) {
  const [collaboratorSearch, setCollaboratorSearch] = useState("");
  const [expandedDepartmentIds, setExpandedDepartmentIds] = useState([]);
  const creatorName = form.settings?.creatorName || "〇〇さん";
  const selectedCollaboratorIds = useMemo(() => {
    return normalizeCollaboratorIds(form.settings?.collaboratorIds);
  }, [form.settings?.collaboratorIds]);

  const filteredCollaboratorDepartments = collaboratorDepartments.filter((department) => {
    if (!collaboratorSearch.trim()) return true;
    const keyword = collaboratorSearch.toLowerCase();
    return department.label.toLowerCase().includes(keyword) || department.members.some((member) => member.label.toLowerCase().includes(keyword));
  });

  const selectedCollaborators = allCollaboratorMembers.filter((member) => selectedCollaboratorIds.includes(member.id));

  const saveCollaboratorIds = (nextIds) => {
    setForm({
      ...form,
      settings: {
        ...form.settings,
        collaboratorIds: nextIds,
      },
    });
  };

  const toggleDepartmentCollaborators = (departmentId) => {
    const memberIds = getCollaboratorMemberIds(departmentId);
    const selectedSet = new Set(selectedCollaboratorIds);
    const allSelected = memberIds.every((memberId) => selectedSet.has(memberId));
    if (allSelected) {
      memberIds.forEach((memberId) => selectedSet.delete(memberId));
    } else {
      memberIds.forEach((memberId) => selectedSet.add(memberId));
    }
    saveCollaboratorIds(Array.from(selectedSet));
    setExpandedDepartmentIds((current) => {
      const currentSet = new Set(current);
      currentSet.add(departmentId);
      return Array.from(currentSet);
    });
  };

  const toggleCollaboratorMember = (memberId) => {
    const selectedSet = new Set(selectedCollaboratorIds);
    if (selectedSet.has(memberId)) selectedSet.delete(memberId);
    else selectedSet.add(memberId);
    saveCollaboratorIds(Array.from(selectedSet));
  };

  const toggleDepartmentExpanded = (departmentId) => {
    setExpandedDepartmentIds((current) => current.includes(departmentId)
      ? current.filter((id) => id !== departmentId)
      : [...current, departmentId]);
  };

  return (
    <main className="w-full space-y-4 p-2 md:p-4">
      <section className="space-y-4">
        {activeTab === "builder" && (
          <>
            <Card className="border-t-8 border-t-purple-600">
              <CardHeader><CardTitle className="text-2xl">フォーム作成</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input
                  id="authoring-form-title"
                  className="text-xl"
                  value={form.title}
                  placeholder={DEFAULT_FORM_TITLE}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                />
                {publishValidation.formTitleError && <p className="text-sm text-red-600">{publishValidation.formTitleError}</p>}
                <Textarea
                  className=""
                  value={form.description}
                  placeholder={DEFAULT_FORM_DESCRIPTION}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
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
                      questionDomId={`question-card-${question.id}`}
                      updateQuestion={updateQuestion}
                      deleteQuestion={deleteQuestion}
                      changeType={changeType}
                      updateOption={updateOption}
                      addOption={addOption}
                      deleteOption={deleteOption}
                      duplicateQuestion={duplicateQuestion}
                      moveQuestion={moveQuestion}
                      totalQuestions={form.questions.length}
                      titleError={publishValidation.questionTitleErrors[question.id]}
                    />
                  ))}
                  {form.questions.length === 0 && (
                    <Card>
                      <CardContent className="p-6 text-center text-sm text-slate-500">質問がまだありません。</CardContent>
                    </Card>
                  )}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex flex-col items-center gap-3 pb-12">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button onClick={addQuestion} className="gap-2 bg-purple-600 hover:bg-purple-700"><FaPlus />質問を追加</Button>
              </div>
            </div>
          </>
        )}

        {activeTab === "collaborator" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">共同編集設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <div className="text-sm font-medium text-purple-900">アンケート作成者</div>
                <div className="mt-2 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">{creatorName}</span>
                    {/* <span className="ml-2 text-xs text-slate-500">作成者</span> */}
                  </div>
                  {/* <div className="text-xs text-purple-700">固定メンバー（共同編集者設定では変更不可）</div> */}
                </div>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <div className="font-medium text-slate-900">共同編集者</div>
                <p className="mt-1 text-sm text-slate-500">公開設定・権限ポップアップにあった共同編集者設定をここで管理します。アンケート作成者はこの一覧とは別に管理されます。</p>
                <div className="mt-3 space-y-3">
                  <Input value={collaboratorSearch} onChange={(event) => setCollaboratorSearch(event.target.value)} placeholder="氏名・組織名で検索" />
                  <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border bg-white p-2">
                    {filteredCollaboratorDepartments.map((department) => {
                      const memberIds = department.members.map((member) => member.id);
                      const selectedCount = memberIds.filter((memberId) => selectedCollaboratorIds.includes(memberId)).length;
                      const isChecked = selectedCount > 0 && selectedCount === memberIds.length;
                      const isPartiallyChecked = selectedCount > 0 && selectedCount < memberIds.length;
                      const isExpanded = expandedDepartmentIds.includes(department.id);
                      const showMembers = isExpanded || selectedCount > 0 || Boolean(collaboratorSearch.trim());

                      return (
                        <div key={department.id} className="rounded-md border border-slate-200 bg-white">
                          <div className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-slate-50">
                            <label className="flex flex-1 items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleDepartmentCollaborators(department.id)}
                              />
                              <span>{department.label}</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">
                                {isPartiallyChecked ? `${selectedCount}/${memberIds.length} 選択` : `${memberIds.length}名`}
                              </span>
                              <button
                                type="button"
                                aria-label={`${department.label}のメンバーを${showMembers ? "閉じる" : "開く"}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                                onClick={() => toggleDepartmentExpanded(department.id)}
                              >
                                <FaChevronDown className={showMembers ? "rotate-180 transition-transform" : "transition-transform"} />
                              </button>
                            </div>
                          </div>
                          {showMembers && (
                            <div className="border-t bg-slate-50 px-2 py-2">
                              <div className="space-y-1">
                                {department.members.map((member) => (
                                  <label key={member.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-white">
                                    <span className="ml-6 flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={selectedCollaboratorIds.includes(member.id)}
                                        onChange={() => toggleCollaboratorMember(member.id)}
                                      />
                                      <span>{member.label}</span>
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {filteredCollaboratorDepartments.length === 0 && <p className="px-2 py-3 text-xs text-slate-500">候補が見つかりません。</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">選択中の共同編集者</div>
                {selectedCollaborators.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">共同編集者が選択されていません。</div>
                ) : (
                  <div className={`space-y-2 ${selectedCollaborators.length > 6 ? "max-h-80 overflow-y-auto pr-1" : ""}`}>
                    {selectedCollaborators.map((collaborator) => (
                      <div key={collaborator.id} className="flex flex-col gap-1 rounded-md bg-slate-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <div><span className="font-medium text-slate-900">{collaborator.label}</span><span className="ml-2 text-xs text-slate-500">{collaborator.departmentLabel}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}

export function QuestionCard({ question: rawQuestion, index, questionDomId, titleError, updateQuestion, deleteQuestion, duplicateQuestion, moveQuestion, changeType, updateOption, addOption, deleteOption, totalQuestions, attributes, listeners, isDragging }) {
  const question = normalizeQuestion(rawQuestion);
  const hasOptions = questionHasOptions(question.type);
  const questionTypeLabel = questionTypes.find((type) => type.value === question.type)?.label ?? "記述式";
  const [draggingOptionIndex, setDraggingOptionIndex] = useState(null);

  const moveOptionTo = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= question.options.length || toIndex >= question.options.length) return;
    const nextOptions = [...question.options];
    [nextOptions[fromIndex], nextOptions[toIndex]] = [nextOptions[toIndex], nextOptions[fromIndex]];
    updateQuestion(question.id, { options: nextOptions });
  };

  return (
    <Card id={questionDomId} className={`scroll-mt-24 border-l-4 border-l-purple-500 ${isDragging ? "shadow-2xl ring-2 ring-purple-300" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <button aria-label={`質問${index + 1}をドラッグして並べ替え`} className="cursor-grab rounded p-2 text-slate-400 hover:bg-slate-100" {...attributes} {...listeners}><FaGripVertical /></button>
          <div>
            <CardTitle className="text-base text-slate-500">質問 {index + 1}</CardTitle>
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
          <Input
            id={`authoring-question-title-${question.id}`}
            className="text-slate-900"
            value={question.title}
            placeholder={DEFAULT_QUESTION_TITLE}
            onChange={(event) => updateQuestion(question.id, { title: event.target.value })}
          />
          <Select value={question.type} onValueChange={(value) => changeType(question.id, value)}>
            <SelectTrigger><SelectValue>{questionTypeLabel}</SelectValue></SelectTrigger>
            <SelectContent>{selectableQuestionTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {titleError && <p className="text-sm text-red-600">{titleError}</p>}

        {hasOptions && (
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <div
                key={optionIndex}
                draggable
                onDragStart={() => setDraggingOptionIndex(optionIndex)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggingOptionIndex === null) return;
                  moveOptionTo(draggingOptionIndex, optionIndex);
                  setDraggingOptionIndex(null);
                }}
                onDragEnd={() => setDraggingOptionIndex(null)}
                className={`flex items-center gap-2 rounded-md px-1 py-1 ${draggingOptionIndex === optionIndex ? "bg-slate-100" : ""}`}
              >
                <button
                  type="button"
                  draggable
                  aria-label={`選択肢${optionIndex + 1}をドラッグして並べ替え`}
                  className="cursor-grab rounded p-2 text-slate-400 hover:bg-slate-100"
                >
                  <FaGripVertical />
                </button>
                <span className="w-6 text-center text-sm text-slate-500">{question.type === "checkbox" ? "□" : question.type === "radio" ? "○" : optionIndex + 1}</span>
                <Input value={option} placeholder={`選択肢${optionIndex + 1}`} onChange={(event) => updateOption(question.id, optionIndex, event.target.value)} />
                <Button aria-label={`選択肢${optionIndex + 1}を削除`} variant="ghost" size="icon" disabled={question.options.length <= 1} onClick={() => deleteOption(question.id, optionIndex)}><FaTrash /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addOption(question.id)}>選択肢追加</Button>
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <label className="flex items-center gap-2"><input type="checkbox" checked={question.randomizeOptions} onChange={(event) => updateQuestion(question.id, { randomizeOptions: event.target.checked })} />選択肢をランダム表示</label>
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

        <div className="flex justify-end border-t pt-3">
          <button
            type="button"
            role="switch"
            aria-checked={question.required}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            onClick={() => updateQuestion(question.id, { required: !question.required })}>
            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${question.required ? "bg-purple-600" : "bg-slate-300"}`}>
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${question.required ? "translate-x-5" : "translate-x-0.5"}`} />
            </span>
            必須
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
