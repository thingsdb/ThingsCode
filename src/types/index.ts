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
  data: unknown | null;
  error: string | null;
  warning: string | null;
  ts: number;
}

export interface ProjectFile {
  filename: string;
  content: string;
  result: Result | null;
  queryVars: string | null;
}

export type StudioTab = 'result' | 'rooms' | 'log';