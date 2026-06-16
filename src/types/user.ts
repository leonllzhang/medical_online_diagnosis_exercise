export interface User {
  id: string;
  name: string;
  phone: string;
  department: string;
  roleId: string | null;
  roleName?: string | null;
  isAdmin: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  configs: RoleConfig[];
}

export interface RoleConfig {
  id?: string;
  chapterId: number;
  chapterTitle: string;
  questionCount: number;
}
