package app

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/thingsdb/go-thingsdb"
)

// UserInfoAccess -- from thingsdb UserInfo/Access
type UserInfoAccess struct {
	Privileges string `msgpack:"privileges"`
	Scope      string `msgpack:"scope"`
}

// UserInfo -- from thingsdb UserInfo
type UserInfo struct {
	Access []UserInfoAccess `msgpack:"access"`
}

// NodeInfo -- from thingsdb NodeInfo
type NodeInfo struct {
	Architecture            string  `msgpack:"architecture" json:"architecture"`
	ArchiveFiles            int     `msgpack:"archive_files" json:"archiveFiles"`
	ArchivedInMemory        int     `msgpack:"archived_in_memory" json:"archivedInMemory"`
	CacheExpirationTime     int     `msgpack:"cache_expiration_time" json:"cacheExpirationTime"`
	CachedNames             int64   `msgpack:"cached_names" json:"cachedNames"`
	CachedQueries           int     `msgpack:"cached_queries" json:"cachedQueries"`
	ChangesInQueue          int     `msgpack:"changes_in_queue" json:"changesInQueue"`
	ClientPort              int     `msgpack:"client_port" json:"clientPort"`
	CommitHistory           any     `msgpack:"commit_history" json:"commitHistory"`
	ConnectedClients        int     `msgpack:"connected_clients" json:"connectedClients"`
	DbStoredChangeId        int64   `msgpack:"db_stored_change_id" json:"dbStoredChangeId"`
	GlobalCommittedChangeId int64   `msgpack:"global_committed_change_id" json:"globalCommittedChangeId"`
	GlobalStoredChangeId    int64   `msgpack:"global_stored_change_id" json:"globalStoredChangeId"`
	HttpApiPort             any     `msgpack:"http_api_port" json:"httpApiPort"`
	HttpStatusPort          any     `msgpack:"http_status_port" json:"httpStatusPort"`
	IpSupport               string  `msgpack:"ip_support" json:"ipSupport"`
	LibcleriVersion         string  `msgpack:"libcleri_version" json:"libcleriVersion"`
	Libpcre2Version         string  `msgpack:"libpcre2_version" json:"libpcre2Version"`
	LibuvVersion            string  `msgpack:"libuv_version" json:"libuvVersion"`
	LibwebsocketsVersion    string  `msgpack:"libwebsockets_version" json:"libwebsocketsVersion"`
	LocalCommittedChangeId  int64   `msgpack:"local_committed_change_id" json:"localCommittedChangeId"`
	LocalStoredChangeId     int64   `msgpack:"local_stored_change_id" json:"localStoredChangeId"`
	LogLevel                string  `msgpack:"log_level" json:"logLevel"`
	ModulesPath             string  `msgpack:"modules_path" json:"modulesPath"`
	MsgpackVersion          string  `msgpack:"msgpack_version" json:"msgpackVersion"`
	NextChangeId            int64   `msgpack:"next_change_id" json:"nextChangeId"`
	NextFreeId              int64   `msgpack:"next_free_id" json:"nextFreeId"`
	NodeID                  int     `msgpack:"node_id" json:"nodeId"`
	NodeName                string  `msgpack:"node_name" json:"nodeName"`
	NodePort                int     `msgpack:"node_port" json:"nodePort"`
	Platform                string  `msgpack:"platform" json:"platform"`
	PythonInterpreter       string  `msgpack:"python_interpreter" json:"pythonInterpreter"`
	ResultSizeLimit         int64   `msgpack:"result_size_limit" json:"resultSizeLimit"`
	ScheduledBackups        int     `msgpack:"scheduled_backups" json:"scheduledBackups"`
	Status                  string  `msgpack:"status" json:"status"`
	StoragePath             string  `msgpack:"storage_path" json:"storagePath"`
	SyntaxVersion           string  `msgpack:"syntax_version" json:"syntaxVersion"`
	ThresholdQueryCache     int64   `msgpack:"threshold_query_cache" json:"thresholdQueryCache"`
	Uptime                  float64 `msgpack:"uptime" json:"uptime"`
	Version                 string  `msgpack:"version" json:"version"`
	YajlVersion             string  `msgpack:"yajl_version" json:"yajlVersion"`
	Zone                    int     `msgpack:"zone" json:"zone"`
}

type NodeCounters struct {
	AverageChangeDuration float64 `msgpack:"average_change_duration" json:"averageChangeDuration"`
	AverageQueryDuration  float64 `msgpack:"average_query_duration" json:"averageQueryDuration"`
	ChangesCommitted      int64   `msgpack:"changes_committed" json:"changesCommitted"`
	ChangesFailed         int64   `msgpack:"changes_failed" json:"changesFailed"`
	ChangesKilled         int64   `msgpack:"changes_killed" json:"changesKilled"`
	ChangesSkipped        int64   `msgpack:"changes_skipped" json:"changesSkipped"`
	ChangesUnaligned      int64   `msgpack:"changes_unaligned" json:"changesUnaligned"`
	ChangesWithGap        int64   `msgpack:"changes_with_gap" json:"changesWithGap"`
	GarbageCollected      int64   `msgpack:"garbage_collected" json:"garbageCollected"`
	LargestResultSize     int64   `msgpack:"largest_result_size" json:"largestResultSize"`
	LongestChangeDuration float64 `msgpack:"longest_change_duration" json:"longestChangeDuration"`
	LongestQueryDuration  float64 `json:"longestQueryDuration" msgpack:"longest_query_duration"`
	QueriesFromCache      int64   `msgpack:"queries_from_cache" json:"queriesFromCache"`
	QueriesSuccess        int64   `msgpack:"queries_success" json:"queriesSuccess"`
	QueriesWithError      int64   `msgpack:"queries_with_error" json:"queriesWithError"`
	QuorumLost            int64   `msgpack:"quorum_lost" json:"quorumLost"`
	StartedAt             int64   `msgpack:"started_at" json:"startedAt"` // Unix timestamp in seconds
	TasksSuccess          int64   `msgpack:"tasks_success" json:"tasksSuccess"`
	TasksWithError        int64   `msgpack:"tasks_with_error" json:"tasksWithError"`
	WastedCache           int64   `msgpack:"wasted_cache" json:"wastedCache"`
}

type UserInfoAndNodesInfo struct {
	NodesInfo []NodeInfo `msgpack:"nodes_info"`
	UserInfo  UserInfo   `msgpack:"user_info"`
}

// ProjectFile for returning fetched files
type ProjectFile struct {
	Filename  string  `json:"filename"`
	Content   string  `json:"content,omitempty"`
	QueryVars string  `json:"queryVars,omitempty"`
	Result    *Result `json:"result,omitempty"`
}

type AuthType string

const (
	AuthTypeCredentials AuthType = "credentials"
	AuthTypeToken       AuthType = "token"
)

type Room struct {
	Scope  string         `json:"scope"`
	Name   string         `json:"name"`
	Code   string         `json:"code"`
	ErrMsg string         `json:"errMsg,omitempty"`
	Room   *thingsdb.Room `json:"-"`
}

type Workspace struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Host           string    `json:"host"`
	Port           int       `json:"port"`
	AuthType       AuthType  `json:"authType"`
	Username       string    `json:"username,omitempty"`
	Password       string    `json:"password,omitempty"`
	Token          string    `json:"token,omitempty"`
	SSL            bool      `json:"ssl"`
	Workfolder     string    `json:"workfolder"`
	LastAccess     time.Time `json:"lastAcces"`
	IsTmp          bool      `json:"isTmp"`
	IsQuickConnect bool      `json:"isQuickConnect"`

	// Room & FileScopes only for local JSON, webserver by own request
	FileScopes map[string]string `json:"fileScopes"`
	Rooms      []Room            `json:"rooms"`
	mu         sync.RWMutex      `json:"-"`
	conn       *thingsdb.Conn    `json:"-"`
}

type WorkspaceRes struct {
	ID         string `json:"id"`
	Workfolder string `json:"workfolder"`
}

type WSMessage struct {
	Id      string          `json:"id,omitempty"`
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type WSPackage struct {
	Id      string `json:"id"`
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}

type WSEmitPayload struct {
	WorkspaceID string    `json:"workspaceID"`
	RoomID      uint64    `json:"roomId"`
	Ts          time.Time `json:"ts"`
	Event       string    `json:"event"`
	Args        []any     `json:"args"`
}

type Settings struct {
	mu         sync.RWMutex      `json:"-"`
	FilePath   string            `json:"-"`
	WM         *WorkspaceManager `json:"-"`
	Workspaces []*Workspace      `json:"workspaces"`
}

type UpdateFileScope struct {
	ID       string `json:"id"`
	Filename string `json:"filename"`
	Scope    string `json:"scope"`
}

type UpdateFileContent struct {
	ID       string `json:"id"`
	Filename string `json:"filename"`
	Content  string `json:"content"`
}

type CreateFile struct {
	ID       string `json:"id"`
	Filename string `json:"filename"`
}

type RenameFile struct {
	ID          string `json:"id"`
	Filename    string `json:"filename"`
	NewFilename string `json:"newFilename"`
}

type DeleteFile struct {
	ID       string `json:"id"`
	Filename string `json:"filename"`
}

type UpdateQueryVars struct {
	ID        string `json:"id"`
	Filename  string `json:"filename"`
	QueryVars string `json:"queryVars"`
}

type ExecCode struct {
	ID       string         `json:"id"`
	Filename string         `json:"filename"`
	Scope    string         `json:"scope"`
	Code     string         `json:"code"`
	Vars     map[string]any `json:"vars"`
}

type Result struct {
	Data    any       `json:"data,omitempty"`
	Warning string    `json:"warning,omitempty"`
	Error   string    `json:"error,omitempty"`
	Ts      time.Time `json:"ts"`
}

type Scope struct {
	ID    string `json:"id"`
	Scope string `json:"scope"`
}

type SetNodeLogLevel struct {
	ID       string `json:"id"`
	Scope    string `json:"scope"`
	LogLevel int    `json:"logLevel"`
}
