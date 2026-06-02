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

func GetNodeCounters(conn *thingsdb.Conn, scope string) (*NodeCounters, error) {
	var nodeCounters NodeCounters
	res, err := conn.QueryRaw(scope, "counters();", nil)
	if err != nil {
		return nil, err
	}
	if err := msgpack.Unmarshal(res, &nodeCounters); err != nil {
		return nil, err
	}
	return &nodeCounters, nil
}

func ResetNodeCounters(conn *thingsdb.Conn, scope string) error {
	_, err := conn.QueryRaw(scope, "reset_counters();", nil)
	return err
}

func ShutdownNode(conn *thingsdb.Conn, scope string) error {
	_, err := conn.QueryRaw(scope, "shutdown();", nil)
	return err
}

func SetLogLevel(conn *thingsdb.Conn, scope string, level int) error {
	args := map[string]any{
		"n": level,
	}
	_, err := conn.QueryRaw(scope, "set_log_level(n);", args)
	return err
}
