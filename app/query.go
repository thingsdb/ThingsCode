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

func FetchTasks(conn *thingsdb.Conn, scope string) ([]Task, error) {
	var tasks []Task
	res, err := conn.QueryRaw(scope, `
		// TiCode query tasks
		assert(tasks().len() <= 40, 'too many tasks; use "tasks()" instead');
		tasks().map(|task| {
			id: task.id(),
			owner: task.owner(),
			at: task.at(),
			error: task.err(),
		});
	`, nil)
	if err != nil {
		return nil, err
	}
	if err := msgpack.Unmarshal(res, &tasks); err != nil {
		return nil, err
	}
	return tasks, nil
}

func FetchProcedures(conn *thingsdb.Conn, scope string) ([]Procedure, error) {
	var procedures []Procedure
	res, err := conn.QueryRaw(scope, "procedures_info();", nil)
	if err != nil {
		return nil, err
	}
	if err := msgpack.Unmarshal(res, &procedures); err != nil {
		return nil, err
	}
	return procedures, nil
}

func FetchEnums(conn *thingsdb.Conn, scope string) ([]*Enum, error) {
	var enums []*Enum
	res, err := conn.QueryRaw(scope, "enums_info();", nil)
	if err != nil {
		return nil, err
	}
	if err := msgpack.Unmarshal(res, &enums); err != nil {
		return nil, err
	}
	for _, enum := range enums {
		enum.Type = CategorizeType(enum.Members[0][1])
	}
	return enums, nil
}

func FetchTypes(conn *thingsdb.Conn, scope string) ([]*Type, error) {
	var types []*Type
	res, err := conn.QueryRaw(scope, "types_info();", nil)
	if err != nil {
		return nil, err
	}
	if err := msgpack.Unmarshal(res, &types); err != nil {
		return nil, err
	}
	return types, nil
}

func FetchUsers(conn *thingsdb.Conn) ([]*User, error) {
	var users []*User
	res, err := conn.QueryRaw("/t", "users_info();", nil)
	if err != nil {
		return nil, err
	}
	if err := msgpack.Unmarshal(res, &users); err != nil {
		return nil, err
	}
	return users, nil
}

func FetchUser(conn *thingsdb.Conn) (*User, error) {
	var user *User
	res, err := conn.QueryRaw("/t", "user_info();", nil)
	if err != nil {
		return nil, err
	}
	if err := msgpack.Unmarshal(res, &user); err != nil {
		return nil, err
	}
	return user, nil
}

func FetchTask(conn *thingsdb.Conn, scope string, taskId uint64) (*TaskDetail, error) {
	var taskDetail TaskDetail
	res, err := conn.QueryRaw(scope, `
	    task = task(task_id);
		{
			id: task.id(),
			owner: task.owner(),
			at: task.at(),
			error: task.err(),
			closure: str(task.closure()),
		};
	`, map[string]any{"task_id": taskId})
	if err != nil {
		return nil, err
	}
	if err := msgpack.Unmarshal(res, &taskDetail); err != nil {
		return nil, err
	}
	return &taskDetail, nil
}

func FetchThing(conn *thingsdb.Conn, scope string, thingsId uint64) (any, error) {
	if thingsId == 1 {
		// Thing ID 1 is always the root for containers, except for old ThingsDB
		// collections. However, in an old ThingsDB collecion there is no "1",
		// so we can in this case just return the root.
		return conn.Query(scope, "root();", nil)
	}
	return conn.Query(scope, "thing(id);", map[string]any{"id": thingsId})
}
