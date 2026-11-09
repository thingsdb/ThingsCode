package app

import (
	"github.com/thingsdb/go-thingsdb"
)

func GetNodeInfo(conn *thingsdb.Conn, scope string) (*NodeInfo, error) {
	var nodeInfo NodeInfo
	err := conn.QueryInto(scope, "node_info();", nil, &nodeInfo)
	return &nodeInfo, err
}

func GetNodeCounters(conn *thingsdb.Conn, scope string) (*NodeCounters, error) {
	var nodeCounters NodeCounters
	err := conn.QueryInto(scope, "counters();", nil, &nodeCounters)
	return &nodeCounters, err
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
	err := conn.QueryInto(scope, `
		// TiCode query tasks
		assert(tasks().len() <= 100, 'too many tasks; use "tasks()" instead');
		return tasks().map(|task| {
			id: task.id(),
			owner: task.owner(),
			at: task.at(),
			error: task.err(),
		}), 1;
	`, nil, &tasks)
	return tasks, err
}

func FetchProcedures(conn *thingsdb.Conn, scope string) ([]Procedure, error) {
	var procedures []Procedure
	err := conn.QueryInto(scope, "procedures_info();", nil, &procedures)
	return procedures, err
}

func FetchEnums(conn *thingsdb.Conn, scope string) ([]*Enum, error) {
	var enums []*Enum
	if err := conn.QueryInto(scope, "enums_info();", nil, &enums); err != nil {
		return nil, err
	}
	for _, enum := range enums {
		enum.Type = CategorizeType(enum.Members[0][1])
	}
	return enums, nil
}

func FetchTypes(conn *thingsdb.Conn, scope string) ([]*Type, error) {
	var types []*Type
	err := conn.QueryInto(scope, "types_info();", nil, &types)
	return types, err
}

func FetchBackups(conn *thingsdb.Conn, scope string) ([]*Backup, error) {
	var backups []*Backup
	err := conn.QueryInto(scope, "backups_info();", nil, &backups)
	return backups, err
}

func FetchModules(conn *thingsdb.Conn, scope string) ([]*Module, error) {
	var modules []*Module
	err := conn.QueryInto(scope, "modules_info();", nil, &modules)
	return modules, err
}

func FetchHistory(conn *thingsdb.Conn, scope string) ([]*Commit, error) {
	var commits []*Commit
	err := conn.QueryInto("/t", "history(options);", map[string]any{
		"options": map[string]any{
			"last":  100,
			"scope": scope,
		},
	}, &commits)
	return commits, err
}

func FetchCommit(conn *thingsdb.Conn, scope string, commitId uint64) (*Commit, error) {
	var commit *Commit
	err := conn.QueryInto("/t", "history(options);", map[string]any{
		"options": map[string]any{
			"id":     commitId,
			"scope":  scope,
			"detail": true,
		},
	}, &commit)
	return commit, err
}

func FetchUsers(conn *thingsdb.Conn) ([]*User, error) {
	var users []*User
	err := conn.QueryInto("/t", "users_info();", nil, &users)
	return users, err
}

func FetchUser(conn *thingsdb.Conn) (*User, error) {
	var user *User
	err := conn.QueryInto("/t", "user_info();", nil, &user)
	return user, err
}

func FetchTask(conn *thingsdb.Conn, scope string, taskId uint64) (*TaskDetail, error) {
	var taskDetail TaskDetail
	err := conn.QueryInto(scope, `
	    task = task(task_id);
		return {
			id: task.id(),
			owner: task.owner(),
			at: task.at(),
			error: task.err(),
			closure: str(task.closure()),
		}, 1;
	`, map[string]any{"task_id": taskId}, taskDetail)
	return &taskDetail, err
}

func FetchThing(conn *thingsdb.Conn, scope string, thingsId uint64) (any, error) {
	if thingsId == 1 {
		// Thing ID 1 is always the root for containers, except for old ThingsDB
		// collections. However, in an old ThingsDB collecion there is no "1",
		// so we can in this case just return the root.
		return conn.Query(scope, "return root(), 1;", nil)
	}
	return conn.Query(scope, "return thing(id), 1;", map[string]any{"id": thingsId})
}
