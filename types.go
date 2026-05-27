package main

type UserInfoAccess struct {
	Privileges string `msgpack:"privileges"`
	Scope      string `msgpack:"scope"`
}

type UserInfo struct {
	Access []UserInfoAccess `msgpack:"access"`
}

type ProjectFile struct {
	Filename string `json:"filename"`
	Content  string `json:"content,omitempty"`
}
