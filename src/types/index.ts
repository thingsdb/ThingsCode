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
  data?: unknown;
  error?: string;
  warning?: string;
  ts: number;
}

export interface ProjectFile {
  filename: string;
  content: string;
  result?: Result;
  queryVars?: string;
}

export interface NodeStatus {
  Id: number;
  Status: string;
}

export interface NodeInfo {
  nodeId: number;
  status: string;
  uptime: number;
  version: string;
}

export interface Warning {
  Msg: string;
  Code: number;
  Timestamp: number;
}

export type StudioTab = 'result' | 'events' | 'log';
export type WebsocketStatus = 'connecting' | 'connected' | 'disconnected';
