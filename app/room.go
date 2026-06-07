package app

import (
	"log"
	"slices"
	"time"

	"github.com/thingsdb/go-thingsdb"
)

func OnEmitHandler(room *thingsdb.Room, event string, args []any) {
	if workspaceID, ok := room.Data.(string); ok {
		wsConns := currentSettings.WM.GetConnections(workspaceID)
		payload := WSEmitPayload{
			WorkspaceID: workspaceID,
			RoomID:      room.Id(),
			Scope: 		 room.Scope(),
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

func OnDeleteHandler(room *thingsdb.Room) {
	if workspaceID, ok := room.Data.(string); ok {
		for _, w := range currentSettings.Workspaces {
			if w.ID == workspaceID {
				for idx, r := range w.Rooms {
					if r.Id == room.Id() {
						log.Printf("Watched room ID %d in scope %s removed", r.Id, r.Scope)
						w.Rooms = slices.Delete(w.Rooms, idx, idx+1)
						break
					}
				}
				break
			}
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
	r.OnDelete = OnDeleteHandler
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
