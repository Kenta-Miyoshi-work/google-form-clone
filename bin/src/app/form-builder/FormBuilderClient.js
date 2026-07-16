"use client";

import dynamic from "next/dynamic";

const FormBuilder = dynamic(() => import("@/features/form-builder/FormBuilder"), {
  ssr: false,
  loading: () => <div className="p-6 text-sm text-slate-500">フォームビルダーを読み込み中...</div>,
});

export default function FormBuilderClient() {
  return <FormBuilder />;
}
