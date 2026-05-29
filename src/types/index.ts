export interface Workspace {
  id: string;
  name: string;
  host: string;
  port: number;
  authType: 'credentials' | 'token';
  username?: string;
  password?: string;
  token?: string;
  ssl: boolean;
  workfolder: string;
  isTmp: boolean;
  isQuickConnect: boolean;
}

export interface Result {
  data: any | null;
  error: string | null;
  warning: string | null;
}

export interface ProjectFile {
  filename: string;
  content: string;
  result: Result | null;
  queryVars: string | null;
}

