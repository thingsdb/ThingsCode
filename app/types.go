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
	NodesInfo     []NodeInfo `msgpack:"nodes_info"`
	UserInfo      UserInfo   `msgpack:"user_info"`
	RequireCommit bool       `msgpack:"require_commit"`
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
	Id     uint64         `json:"id,omitempty"`
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
	Type           string    `json:"type,omitempty"`

	// Room & FileScopes only for local JSON, webserver by own request
	FileScopes map[string]string `json:"fileScopes"`
	Rooms      []*Room           `json:"rooms"`
	mu         sync.RWMutex      `json:"-"`
	conn       *thingsdb.Conn    `json:"-"`
}

type WorkspaceID struct {
	ID string `json:"id"`
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
	Scope       string    `json:"scope"`
	Ts          time.Time `json:"ts"`
	Event       string    `json:"event"`
	Args        []any     `json:"args"`
}

type WSRoomDeletePayload struct {
	WorkspaceID string `json:"workspaceID"`
	RoomID      uint64 `json:"roomId"`
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

type RunProcedure struct {
	ID    string         `json:"id"`
	Scope string         `json:"scope"`
	Name  string         `json:"name"`
	Args  map[string]any `json:"args"`
}

type Result struct {
	Data    any       `json:"data"`
	Warning string    `json:"warning,omitempty"`
	Error   string    `json:"error,omitempty"`
	Ts      time.Time `json:"ts"`
}

type ForScope struct {
	ID    string `json:"id"`
	Scope string `json:"scope"`
}

type TaskReq struct {
	ID     string `json:"id"`
	Scope  string `json:"scope"`
	TaskId uint64 `json:"taskId"`
}

type ThingReq struct {
	ID       string `json:"id"`
	Scope    string `json:"scope"`
	ThingsID uint64 `json:"thingId"`
}

type CommitReq struct {
	ID       string `json:"id"`
	Scope    string `json:"scope"`
	CommitID uint64 `json:"commitId"`
}

type TaskDetail struct {
	Id      uint64 `msgpack:"id" json:"id"`
	Owner   string `msgpack:"owner" json:"owner"`
	Closure string `msgpack:"closure" json:"closure"`
	At      string `msgpack:"at" json:"at,omitempty"`
	Error   string `msgpack:"error" json:"error,omitempty"`
}

type SetNodeLogLevel struct {
	ID       string `json:"id"`
	Scope    string `json:"scope"`
	LogLevel int    `json:"logLevel"`
}

type JoinRoom struct {
	ID    string `json:"id"`
	Scope string `json:"scope"`
	Name  string `json:"name"`
	Code  string `json:"code"`
}

type LeaveRoom struct {
	ID    string `json:"id"`
	Scope string `json:"scope"`
	Name  string `json:"name"`
}

type Task struct {
	ID    uint64 `msgpack:"id" json:"id"`
	Owner string `msgpack:"owner" json:"owner"`
	At    string `msgpack:"at" json:"at,omitempty"`
	Error string `msgpack:"error" json:"error,omitempty"`
}

type Procedure struct {
	Name            string   `msgpack:"name" json:"name"`
	WithSideEffects bool     `msgpack:"with_side_effects" json:"withSideEffects"`
	CreatedAt       uint64   `msgpack:"created_at" json:"createdAt"`
	Definition      string   `msgpack:"definition" json:"definition,omitempty"`
	Doc             string   `msgpack:"doc" json:"doc,omitempty"`
	Arguments       []string `msgpack:"arguments" json:"arguments"`
}

type Enum struct {
	Name       string  `msgpack:"name" json:"name"`
	Default    string  `msgpack:"default" json:"default"`
	CreatedAt  uint64  `msgpack:"created_at" json:"createdAt"`
	ModifiedAt uint64  `msgpack:"modified_at,omitempty" json:"modifiedAt,omitempty"`
	Members    [][]any `msgpack:"members" json:"members"`
	Type       string  `json:"type"`
	Methods    map[string]struct {
		WithSideEffects bool     `msgpack:"with_side_effects" json:"withSideEffects"`
		Definition      string   `msgpack:"definition" json:"definition"`
		Doc             string   `msgpack:"doc" json:"doc,omitempty"`
		Arguments       []string `msgpack:"arguments" json:"arguments"`
	} `msgpack:"methods" json:"methods"`
}

type Type struct {
	Name       string  `msgpack:"name" json:"name"`
	CreatedAt  uint64  `msgpack:"created_at" json:"createdAt"`
	ModifiedAt uint64  `msgpack:"modified_at,omitempty" json:"modifiedAt,omitempty"`
	HideId     bool    `msgpack:"hide_id" json:"hideId"`
	WrapOnly   bool    `msgpack:"wrap_only" json:"wrapOnly"`
	AutoIndex  bool    `msgpack:"auto_index" json:"autoIndex"`
	Fields     [][]any `msgpack:"fields" json:"fields"`
	Methods    map[string]struct {
		WithSideEffects bool     `msgpack:"with_side_effects" json:"withSideEffects"`
		Definition      string   `msgpack:"definition" json:"definition"`
		Doc             string   `msgpack:"doc" json:"doc,omitempty"`
		Arguments       []string `msgpack:"arguments" json:"arguments"`
	} `msgpack:"methods" json:"methods"`
	Relations map[string]struct {
		Type       string `msgpack:"type" json:"type"`
		Property   string `msgpack:"property" json:"property"`
		Definition string `msgpack:"definition" json:"definition"`
	} `msgpack:"relations" json:"relations"`
}

type User struct {
	Name        string `msgpack:"name" json:"name"`
	CreatedAt   uint64 `msgpack:"created_at" json:"createdAt"`
	HasPassword bool   `msgpack:"has_password" json:"hasPassword"`
	Access      []struct {
		Privileges string `msgpack:"privileges" json:"privileges"`
		Scope      string `msgpack:"scope" json:"scope"`
	} `msgpack:"access" json:"access"`
	Tokens []struct {
		CreatedOn      string `msgpack:"created_on" json:"createdOn"`
		ExpirationTime string `msgpack:"expiration_time" json:"expirationTime"`
		Key            string `msgpack:"key" json:"key"`
		Status         string `msgpack:"status" json:"status"`
	} `msgpack:"tokens" json:"tokens"`
	Whitelists struct {
		Procedures []string `msgpack:"procedures,omitempty" json:"procedures,omitempty"`
		Rooms      []string `msgpack:"rooms,omitempty" json:"rooms,omitempty"`
	} `msgpack:"whitelists" json:"whitelists"`
}

type Commit struct {
	ID        uint64 `msgpack:"id" json:"id"`
	By        string `msgpack:"by" json:"by"`
	CreatedOn string `msgpack:"created_on" json:"createdOn"`
	Message   string `msgpack:"message" json:"message"`
	ErrMsg    string `msgpack:"err_msg,omitempty" json:"errMsg,omitempty"`
	Code      string `msgpack:"code,omitempty" json:"code,omitempty"`
}

type Backup struct {
	ID            uint64   `msgpack:"id" json:"id"`
	CreatedAt     uint64   `msgpack:"created_at" json:"createdAt"`
	FileTemplate  string   `msgpack:"file_template" json:"fileTemplate"`
	Files         []string `msgpack:"files" json:"files"`
	NextRun       string   `msgpack:"next_run,omitempty" json:"nextRun,omitempty"`
	Repeat        *uint64  `msgpack:"repeat,omitempty" json:"repeat,omitempty"`
	MaxFiles      *uint64  `msgpack:"max_files,omitempty" json:"maxFiles,omitempty"`
	ResultCode    *int64   `msgpack:"result_code,omitempty" json:"resultCode,omitempty"`
	ResultMessage string   `msgpack:"result_message,omitempty" json:"resultMessage,omitempty"`
}

type Module struct {
	Name            string  `msgpack:"name" json:"name"`
	CreatedAt       uint64  `msgpack:"created_at" json:"createdAt"`
	Status          string  `msgpack:"status" json:"status"`
	Version         string  `msgpack:"version,omitempty" json:"version,omitempty"`
	Scope           string  `msgpack:"scope,omitempty" json:"scope,omitempty"`
	File            string  `msgpack:"file,omitempty" json:"file,omitempty"`
	Doc             string  `msgpack:"doc,omitempty" json:"doc,omitempty"`
	Conf            any     `msgpack:"conf,omitempty" json:"conf,omitempty"`
	Exposes         any     `msgpack:"exposes,omitempty" json:"exposes,omitempty"`
	Restarts        *uint64 `msgpack:"restarts,omitempty" json:"restarts,omitempty"`
	Tasks           *uint64 `msgpack:"tasks,omitempty" json:"tasks,omitempty"`
	GithubOwner     string  `msgpack:"github_owner,omitempty" json:"githubOwner,omitempty"`
	GithubRef       string  `msgpack:"github_ref,omitempty" json:"githubRef,omitempty"`
	GithubRepo      string  `msgpack:"github_repo,omitempty" json:"githubRepo,omitempty"`
	GithubWithToken *bool   `msgpack:"github_with_token,omitempty" json:"githubWithToken,omitempty"`
}

type Scope struct {
	Name          string `json:"name"`
	RequireCommit bool   `json:"requireCommit"`
}
