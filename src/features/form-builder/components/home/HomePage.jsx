import { useState } from "react";
import { FaBell, FaBoxArchive, FaCheck, FaCopy, FaEllipsisVertical, FaFileCirclePlus, FaGlobe, FaLayerGroup, FaRegClock, FaTrash } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { questionTypes } from "../../data/mockData";
import { formatDeadline, getRespondentUrl, getResponsesForItem, getStatusClassName, getVisibilityLabel } from "../../utils/formBuilderUtils";

export function HomePage({ templates, hoveredTemplate, hoveredTemplateId, setHoveredTemplateId, onStartBlank, onStartTemplate, homeTab, setHomeTab, actionItems, createdForms, onOpenCreated, onShareCreated, onOpenResponses, onOpenVersions, onOpenPublish, onOpenRecipients, onOpenNotifications, onOpenReview, onDuplicate, onArchive, onDelete, currentRole }) {
  return (
    <main className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">フォームを作成・管理</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">テンプレート、回答依頼、作成済みフォームをここから確認します。</p>
          </div>
          <Button className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={onStartBlank}><FaFileCirclePlus />新規フォーム作成</Button>
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
        {homeTab === "actions" ? <ActionList items={actionItems} /> : <CreatedList items={createdForms} onOpen={onOpenCreated} onShare={onShareCreated} onResponses={onOpenResponses} onVersions={onOpenVersions} onPublish={onOpenPublish} onRecipients={onOpenRecipients} onNotifications={onOpenNotifications} onReview={onOpenReview} onDuplicate={onDuplicate} onArchive={onArchive} onDelete={onDelete} currentRole={currentRole} />}
      </section>
    </main>
  );
}

export function TemplatePreview({ template, onStartTemplate }) {
  const requiredCount = template.questions.filter((question) => question.required).length;
  const questionTypeCount = new Set(template.questions.map((question) => question.type)).size;

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
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-slate-50 p-2"><div className="font-semibold text-slate-900">{template.questions.length}</div><div className="text-slate-500">質問</div></div>
            <div className="rounded-lg bg-slate-50 p-2"><div className="font-semibold text-slate-900">{requiredCount}</div><div className="text-slate-500">必須</div></div>
            <div className="rounded-lg bg-slate-50 p-2"><div className="font-semibold text-slate-900">{questionTypeCount}</div><div className="text-slate-500">形式</div></div>
          </div>
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

export function TabButton({ active, count, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`relative px-4 py-3 text-sm font-medium ${active ? "border-b-2 border-purple-600 text-purple-700" : "text-slate-500 hover:text-slate-900"}`}>
      {children}
      <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-600"}`}>{count}</span>
    </button>
  );
}

export function ActionList({ items }) {
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

export function CreatedList({ items, onOpen, onShare, onResponses, onVersions, onPublish, onRecipients, onNotifications, onReview, onDuplicate, onArchive, onDelete, currentRole }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("updatedDesc");
  const filteredItems = items
    .filter((item) => statusFilter === "all" || item.status === statusFilter)
    .filter((item) => `${item.title} ${getVisibilityLabel(item.visibility)} ${item.status}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === "title" ? a.title.localeCompare(b.title, "ja") : sort === "deadline" ? String(a.deadline || "9999").localeCompare(String(b.deadline || "9999")) : String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const statusOptions = ["all", ...Array.from(new Set(items.map((item) => item.status)))];

  return (
    <div className="grid gap-3">
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px_180px]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="フォーム名、公開範囲、状態で検索" />
          <select className="h-9 rounded-md border bg-white px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusOptions.map((status) => <option key={status} value={status}>{status === "all" ? "すべての状態" : status}</option>)}
          </select>
          <select className="h-9 rounded-md border bg-white px-3 text-sm" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="updatedDesc">更新日が新しい順</option>
            <option value="deadline">期限が近い順</option>
            <option value="title">名前順</option>
          </select>
        </CardContent>
      </Card>
      {filteredItems.map((item) => (
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
                  <span>回答数: {getResponsesForItem(item).length}</span>
                  <span><FaGlobe className="mr-1 inline" />{getVisibilityLabel(item.visibility)}</span>
                  <span>期限: {formatDeadline(item.deadline)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Button className="bg-purple-600 hover:bg-purple-700" disabled={!currentRole.canEdit} onClick={() => onOpen(item, "edit")}>編集</Button>
                <Button variant="outline" onClick={() => onResponses(item)}>回答</Button>
                <Button variant="outline" onClick={() => onShare(item)}>共有</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger aria-label={`${item.title}のその他操作`} className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400">
                    <FaEllipsisVertical />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>管理操作</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onRecipients(item)}>回答者</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onNotifications(item)}>通知</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onVersions(item)}>版管理</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onReview(item)}>公開レビュー</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPublish(item)}>公開設定</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(item)}><FaCopy />複製</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onArchive(item)}><FaBoxArchive />アーカイブ</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(item)}><FaTrash />削除</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>確認</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onOpen(item, "preview")}>プレビュー</DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {filteredItems.length === 0 && <Card><CardContent className="p-6 text-center text-sm text-slate-500">条件に一致するフォームはありません。</CardContent></Card>}
    </div>
  );
}
