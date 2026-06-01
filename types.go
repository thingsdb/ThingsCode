package main

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
	NodeID int `msgpack:"node_id"`
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
