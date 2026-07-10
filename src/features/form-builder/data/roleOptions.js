export const roleOptions = [
  { value: "owner", label: "管理者", canEdit: true, canPublish: true, canManage: true },
  { value: "editor", label: "編集者", canEdit: true, canPublish: false, canManage: false },
  { value: "viewer", label: "閲覧者", canEdit: false, canPublish: false, canManage: false },
];
