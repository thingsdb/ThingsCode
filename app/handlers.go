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
