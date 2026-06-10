package app

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true }, // Dev mode CORS fix
}

func writeResponse(wsConn *websocket.Conn, msg *WSMessage, payload any) error {
	payloadMap := map[string]any{
		"data": payload,
	}
	pkg := WSPackage{
		Id:      msg.Id,
		Type:    msg.Type,
		Payload: payloadMap,
	}
	return wsConn.WriteJSON(&pkg)
}

func writeError(wsConn *websocket.Conn, msg *WSMessage, err error) error {
	payloadMap := map[string]any{
		"error": err.Error(),
	}
	pkg := WSPackage{
		Id:      msg.Id,
		Type:    msg.Type,
		Payload: payloadMap,
	}
	log.Printf("Error: %v", err)
	return wsConn.WriteJSON(&pkg)
}

func ServeWs(httpRespWriter http.ResponseWriter, httpRequest *http.Request) {
	wsConn, err := upgrader.Upgrade(httpRespWriter, httpRequest, nil)
	if err != nil {
		return
	}
	defer func() {
		_ = wsConn.Close()
		currentSettings.WM.Unregister(wsConn)
	}()

	for {
		_, messageBytes, err := wsConn.ReadMessage()
		if err != nil {
			break
		}

		var msg WSMessage
		if err := json.Unmarshal(messageBytes, &msg); err != nil {
			continue
		}

		// ROUTE BY TYPE
		log.Printf("MSG TYPE START: %s", msg.Type)

		switch msg.Type {
		case "FETCH_WORKSPACES":
			_ = writeResponse(wsConn, &msg, currentSettings.FetchWorkspaces())
		case "UPDATE_WORKSPACE":
			var ws Workspace
			if err := json.Unmarshal(msg.Payload, &ws); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.UpdateWorkspace(&ws); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "ADD_WORKSPACE":
			var ws Workspace
			if err := json.Unmarshal(msg.Payload, &ws); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.AddWorkspace(&ws); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "REMOVE_WORKSPACE":
			var ws Workspace
			if err := json.Unmarshal(msg.Payload, &ws); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.RemoveWorkspace(ws.ID); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "CLOSE_WORKSPACE":
			var ws Workspace
			if err := json.Unmarshal(msg.Payload, &ws); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.CloseWorkspace(ws.ID); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "FETCH_FILES":
			var ws Workspace
			if err := json.Unmarshal(msg.Payload, &ws); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchFiles(ws.ID); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_SCOPES":
			var ws Workspace
			if err := json.Unmarshal(msg.Payload, &ws); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchScopes(ws.ID, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_FILE_SCOPES":
			var ws Workspace
			if err := json.Unmarshal(msg.Payload, &ws); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchFileScopes(ws.ID); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_ROOMS":
			var ws Workspace
			if err := json.Unmarshal(msg.Payload, &ws); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchRooms(ws.ID, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "UPDATE_FILE_SCOPE":
			var updateFileScope UpdateFileScope
			if err := json.Unmarshal(msg.Payload, &updateFileScope); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.UpdateFileScope(&updateFileScope); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "UPDATE_FILE_CONTENT":
			var updateFileContent UpdateFileContent
			if err := json.Unmarshal(msg.Payload, &updateFileContent); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.UpdateFileContent(&updateFileContent); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "CREATE_FILE":
			var createFile CreateFile
			if err := json.Unmarshal(msg.Payload, &createFile); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.CreateFile(&createFile); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "RENAME_FILE":
			var renameFile RenameFile
			if err := json.Unmarshal(msg.Payload, &renameFile); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.RenameFile(&renameFile); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "DELETE_FILE":
			var deleteFile DeleteFile
			if err := json.Unmarshal(msg.Payload, &deleteFile); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.DeleteFile(&deleteFile); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "UPDATE_EXEC_ARGS":
			var updateQueryVars UpdateQueryVars
			if err := json.Unmarshal(msg.Payload, &updateQueryVars); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.UpdateQueryVars(&updateQueryVars); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "EXEC_CODE":
			var execCode ExecCode
			if err := UnmarshalSafeNumbers(msg.Payload, &execCode); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.ExecCode(&execCode, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "RUN_PROCEDURE":
			var runProcedure RunProcedure
			if err := UnmarshalSafeNumbers(msg.Payload, &runProcedure); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.RunProcedure(&runProcedure, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "GET_NODE_INFO":
			var scope ForScope
			if err := json.Unmarshal(msg.Payload, &scope); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.GetNodeInfo(&scope, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "GET_NODE_COUNTERS":
			var scope ForScope
			if err := json.Unmarshal(msg.Payload, &scope); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.GetNodeCounters(&scope, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "RESET_NODE_COUNTERS":
			var scope ForScope
			if err := json.Unmarshal(msg.Payload, &scope); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.ResetNodeCounters(&scope, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "SHUTDOWN_NODE":
			var scope ForScope
			if err := json.Unmarshal(msg.Payload, &scope); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.ShutdownNode(&scope, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "SET_NODE_LOG_LEVEL":
			var data SetNodeLogLevel
			if err := json.Unmarshal(msg.Payload, &data); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.SetNodeLogLevel(&data, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "JOIN_ROOM":
			var data JoinRoom
			if err := json.Unmarshal(msg.Payload, &data); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.JoinRoom(&data, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "UPDATE_ROOM":
			var data JoinRoom
			if err := json.Unmarshal(msg.Payload, &data); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.UpdateRoom(&data, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "LEAVE_ROOM":
			var data LeaveRoom
			if err := json.Unmarshal(msg.Payload, &data); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.LeaveRoom(&data, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "FETCH_TASKS":
			var scope ForScope
			if err := json.Unmarshal(msg.Payload, &scope); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchTasks(&scope, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_PROCEDURES":
			var scope ForScope
			if err := json.Unmarshal(msg.Payload, &scope); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchProcedures(&scope, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_ENUMS":
			var scope ForScope
			if err := json.Unmarshal(msg.Payload, &scope); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchEnums(&scope, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_TYPES":
			var scope ForScope
			if err := json.Unmarshal(msg.Payload, &scope); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchTypes(&scope, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_BACKUPS":
			var scope ForScope
			if err := json.Unmarshal(msg.Payload, &scope); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchBackups(&scope, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_MODULES":
			var scope ForScope
			if err := json.Unmarshal(msg.Payload, &scope); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchModules(&scope, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_HISTORY":
			var scope ForScope
			if err := json.Unmarshal(msg.Payload, &scope); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchHistory(&scope, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_COMMIT":
			var req CommitReq
			if err := json.Unmarshal(msg.Payload, &req); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchCommit(&req, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_USERS":
			var wsId WorkspaceID
			if err := json.Unmarshal(msg.Payload, &wsId); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchUsers(&wsId, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_USER":
			var wsId WorkspaceID
			if err := json.Unmarshal(msg.Payload, &wsId); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchUser(&wsId, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_TASK":
			var req TaskReq
			if err := json.Unmarshal(msg.Payload, &req); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchTask(&req, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_THING":
			var req ThingReq
			if err := json.Unmarshal(msg.Payload, &req); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchThing(&req, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		default:
			_ = writeError(wsConn, &msg, fmt.Errorf("unknown msg Type: %s", msg.Type))
		}

		log.Printf("MSG TYPE END: %s", msg.Type)
	}
}
