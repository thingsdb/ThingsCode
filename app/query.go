package app

import (
	"github.com/thingsdb/go-thingsdb"
	"github.com/vmihailenco/msgpack/v5"
)

func GetNodeInfo(conn *thingsdb.Conn, scope string) (*NodeInfo, error) {
	var nodeInfo NodeInfo
	res, err := conn.QueryRaw(scope, "node_info();", nil)
	if err != nil {
		return nil, err
	}
	if err := msgpack.Unmarshal(res, &nodeInfo); err != nil {
		return nil, err
	}
	return &nodeInfo, nil
}

func ShutdownNode(conn *thingsdb.Conn, scope string) error {
	_, err := conn.QueryRaw(scope, "shutdown();", nil)
	return err
}
