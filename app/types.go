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
	NodeID              int     `msgpack:"node_id" json:"nodeId"`
	Status              string  `msgpack:"status" json:"status"`
	Version             string  `msgpack:"version" json:"version"`
	Uptime              float64 `msgpack:"uptime" json:"uptime"`
	Architecture        string  `msgpack:"architecture" json:"architecture"`
	ArchiveFiles        int     `msgpack:"archive_files" json:"archiveFiles"`
	ArchivedInMemory    int     `msgpack:"archived_in_memory" json:"archivedInMemory"`
	CacheExpirationTime int     `msgpack:"cache_expiration_time" json:"cacheExpirationTime"`
}

// {
//     "cached_names": 272,
//     "cached_queries": 0,
//     "changes_in_queue": 0,
//     "client_port": 9201,
//     "commit_history": "disabled",
//     "connected_clients": 0,
//     "db_stored_change_id": 74324,
//     "global_committed_change_id": 75247,
//     "global_stored_change_id": 75247,
//     "http_api_port": 9211,
//     "http_status_port": 8081,
//     "ip_support": "ALL",
//     "libcleri_version": "1.0.2a",
//     "libpcre2_version": "10.39",
//     "libuv_version": "1.43.0",
//     "libwebsockets_version": "4.3.99-v1.4.16-249-g432858e7",
//     "local_committed_change_id": 75247,
//     "local_stored_change_id": 75247,
//     "log_level": "WARNING",
//     "modules_path": "/var/thingsdb-modules/node1",
//     "msgpack_version": "3.2.1",
//     "next_change_id": 75248,
//     "next_free_id": 1398,
//     "node_id": 1,
//     "node_name": "playground",
//     "node_port": 9221,
//     "platform": "linux",
//     "python_interpreter": "python",
//     "result_size_limit": 20971520,
//     "scheduled_backups": 1,
//     "status": "READY",
//     "storage_path": "/var/thingsdb/node1/",
//     "syntax_version": "v1",
//     "threshold_query_cache": 160,
//     "uptime": 8765601.074270448,
//     "version": "1.8.4",
//     "yajl_version": "2.1.0",
//     "zone": 0
// }

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

	// FileScopes only for local JSON, webserver by own request
	FileScopes map[string]string `json:"fileScopes"`
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
