export type WorkspaceType = 'development' | 'staging' | 'production';

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
  type?: WorkspaceType;
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

export interface Room {
  scope: string;
  id?: number;
  name: string;
  code: string;
  errMsg?: string;
}

// NodeStatus is direct from go-thingsdb
export interface NodeStatus {
  Id: number;
  Status: string;
}

// Warning is direct from go-thingsdb
export interface Warning {
  Msg: string;
  Code: number;
  Timestamp: number;
}

export interface NodeInfo {
  nodeId: number;
  status: string;
  uptime: number;
  version: string;
  architecture: string;
  archiveFiles: number;
  archivedInMemory: number;
  cacheExpirationTime: number;
  cachedNames: number;
  cachedQueries: number;
  changesInQueue: number;
  clientPort: number;
  commitHistory?: string | number | null;
  connectedClients: number;
  dbStoredChangeId: number;
  globalCommittedChangeId: number;
  globalStoredChangeId: number;
  httpApiPort: number | string;
  httpStatusPort: number | string;
  ipSupport: string;
  libcleriVersion: string;
  libpcre2Version: string;
  libuvVersion: string;
  libwebsocketsVersion: string;
  localCommittedChangeId: number;
  localStoredChangeId: number;
  logLevel: string;
  modulesPath: string;
  msgpackVersion: string;
  nextChangeId: number;
  nextFreeId: number;
  nodeID: number;
  nodeName: string;
  nodePort: number;
  platform: string;
  pythonInterpreter: string;
  resultSizeLimit: number;
  scheduledBackups: number;
  storagePath: string;
  syntaxVersion: string;
  thresholdQueryCache: number;
  yajlVersion: string;
  zone: number;
}

export interface EmitEvent {
  workspaceID: string;
  roomId: number;
  scope: string;
  ts: number;
  event: string;
  args: unknown[];
}

export interface Task {
  id: number;
  at: string | null;
  owner: string;
  error: string | null;
}

export interface Procedure {
  name: string;
  withSideEffects: boolean;
  createdAt: number;
  definition?: string;  // only when having CHANGE permissions on scope
  doc?: string;  // only when docstring is available
  arguments: string[];
}

export interface Method {
  withSideEffects: boolean;
  definition: string;
  doc?: string;  // only when docstring is available
  arguments: string[];
}

export interface ThingId {
  [key: string]: number;
}

export interface Enum {
  name: string;
  default: string;
  createdAt: number;
  modifiedAt?: number;
  methods: Record<string, Method>;
  members: [string, string | number | ThingId][];
  type: EnumType;
}

export interface Relation {
  type: string;
  property: string;
  definition: string;
}

export interface Definition {
  [key: string]: string | Definition | Definition[];
}

export interface Type {
  name: string;
  createdAt: number;
  modifiedAt?: number;
  methods: Record<string, Method>;
  fields: [string, string | Definition | Definition[]][];
  relations: Record<string, Relation>;
  autoIndex: boolean;
  hideId: boolean;
  wrapOnly: boolean;
}

export interface UserAccess {
  privileges: string;
  scope: string;
}

export type TokenStatus = 'OK' | 'EXPIRED';

export interface UserToken {
  createdOn: string;  // e.g., "2026-06-09T13:46:18Z"
  expirationTime: string; // e.g., "2027-06-09T13:46:18+0200" or "never"
  key: string; // e.g. "bW7aKAJ0ROZwbDz8kpVzeZ"
  status: TokenStatus; // "OK" or "EXPIRED"
}

export interface Whitelists {
  procedures?: string[];
  rooms?: string[];
}

export interface User {
  name: string;
  createdAt: number;
  hasPassword: boolean;
  access: UserAccess[];
  tokens: UserToken[];
  whitelists: Whitelists;
}

export interface Commit {
  id: number;
  by: string;
  createdOn: string;  // e.g., "2026-06-09T13:46:18Z"
  message: string;
  errMsg?: string;
  code?: string;
}

export interface Scope {
	name: string;
	requireCommit: boolean;
}

export type StudioTab = 'result' | 'events' | 'log';
export type WebsocketStatus = 'connecting' | 'connected' | 'disconnected';
export type EnumType = 'int' | 'float' | 'str' | 'bytes' | 'thing';

export enum SearchIndexType {
  File = 'FILE',
  Scope = 'SCOPE',
}

export interface SearchRecord {
  id: string;
  name: string;
  type: SearchIndexType;
}

export type TreeNodeType =
  | string
  | number
  | boolean
  | null
  | ThingId
  | TreeNodeType[]
  | { [key: string]: TreeNodeType };