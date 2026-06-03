package app

import (
	"time"

	"github.com/thingsdb/go-thingsdb"
)

func OnEmitHandler(room *thingsdb.Room, event string, args []any) {
	if workspaceID, ok := room.Data.(string); ok {
		wsConns := currentSettings.WM.GetConnections(workspaceID)
		payload := WSEmitPayload{
			WorkspaceID: workspaceID,
			RoomID:      room.Id(),
			Ts:          time.Now(),
			Event:       event,
			Args:        args,
		}
		pkg := WSPackage{
			Type:    "ON_EMIT",
			Payload: &payload,
		}
		for _, wsConn := range wsConns {
			_ = wsConn.WriteJSON(&pkg)
		}
	}
}

func NewRoom(scope string, name string, code string) *Room {
	return &Room{
		Scope: scope,
		Name:  name,
		Code:  code,
	}
}

func (room *Room) Join(workspaceID string, conn *thingsdb.Conn) {
	r := thingsdb.NewRoom(room.Scope, room.Code)
	r.Data = workspaceID
	r.OnEmit = OnEmitHandler
	err := r.Join(conn, time.Second*3)
	if err == nil {
		room.Id = r.Id()
		room.Room = r
		room.ErrMsg = ""
	} else {
		room.Id = 0
		room.Room = nil
		room.ErrMsg = err.Error()
	}
}
