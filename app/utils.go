package app

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/user"
	"path/filepath"
	"reflect"
	"slices"
	"strings"
)

// ExpandHomePath takes a directory string and converts any leading "~" into the absolute system home path.
func ExpandHomePath(path string) (string, error) {
	if !strings.HasPrefix(path, "~") {
		return path, nil
	}

	usr, err := user.Current()
	if err != nil {
		return "", fmt.Errorf("unable to determine system home user: %w", err)
	}

	homeDir := usr.HomeDir
	if path == "~" {
		return homeDir, nil
	}

	if strings.HasPrefix(path, "~/") {
		return strings.Replace(path, "~", homeDir, 1), nil
	}

	return "", fmt.Errorf("malformed path layout: path must be '~' or start with '~/ or not start with ~ at all'")
}

func convertBinary(v any) (any, bool) {
	var binaryFound bool

	switch val := v.(type) {
	case []byte:
		return base64.StdEncoding.EncodeToString(val), true

	case map[string]any:
		newMap := make(map[string]any)
		for k, item := range val {
			convertedItem, foundBinary := convertBinary(item)
			newMap[k] = convertedItem
			if foundBinary {
				binaryFound = true
			}
		}
		return newMap, binaryFound

	case []any:
		newSlice := make([]any, len(val))
		for i, item := range val {
			convertedItem, foundBinary := convertBinary(item)
			newSlice[i] = convertedItem
			if foundBinary {
				binaryFound = true
			}
		}
		return newSlice, binaryFound
	default:
		return v, false
	}
}

func QueryVarsPath(rootPath string, filename string) (string, bool) {
	if plainName, found := strings.CutSuffix(filename, ".ti"); found {
		queryVarsName := fmt.Sprintf(".ticode-%s-query-vars.json", plainName)
		queryVarsPath := filepath.Join(rootPath, queryVarsName)
		return queryVarsPath, true
	}
	return filename, false
}

func ResultPath(rootPath string, filename string) (string, bool) {
	if plainName, found := strings.CutSuffix(filename, ".ti"); found {
		queryVarsName := fmt.Sprintf(".ticode-%s-result.json", plainName)
		queryVarsPath := filepath.Join(rootPath, queryVarsName)
		return queryVarsPath, true
	}
	return filename, false
}

func isBinary(path string) (bool, error) {
	file, err := os.Open(path)
	if err != nil {
		return false, err
	}
	defer func() {
		_ = file.Close()
	}()

	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return false, err
	}

	sniffBuffer := buffer[:n]

	contentType := http.DetectContentType(sniffBuffer)
	if !strings.HasPrefix(contentType, "text/") && !strings.Contains(contentType, "javascript") && !strings.Contains(contentType, "json") {
		if contentType == "application/octet-stream" {
			if slices.Contains(sniffBuffer, 0x00) {
				return true, nil
			}
		} else {
			return true, nil
		}
	}
	return false, nil
}

// ScanWorkspaceFiles reads plain text files strictly at the root level (no subdirectories)
func ScanWorkspaceFiles(rootFolder string) ([]ProjectFile, error) {
	projectFiles := make([]ProjectFile, 0)

	rootFolder = filepath.Clean(rootFolder)

	entries, err := os.ReadDir(rootFolder)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		if entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		filePath := filepath.Join(rootFolder, entry.Name())

		binary, err := isBinary(filePath)
		if err != nil || binary {
			continue
		}

		contentBytes, err := os.ReadFile(filePath)
		if err != nil {
			continue
		}

		projectFile := ProjectFile{
			Filename: entry.Name(),
			Content:  string(contentBytes),
		}

		if resultPath, found := ResultPath(rootFolder, entry.Name()); found {
			if resultBin, err := os.ReadFile(resultPath); err == nil && len(resultBin) > 0 {
				var result Result
				if err := json.Unmarshal(resultBin, &result); err == nil {
					projectFile.Result = &result
				}
			}
		}

		if queryVarsPath, found := QueryVarsPath(rootFolder, entry.Name()); found {
			if queryVarsBin, err := os.ReadFile(queryVarsPath); err == nil && len(queryVarsBin) > 0 {
				projectFile.QueryVars = string(queryVarsBin)
			}
		}

		projectFiles = append(projectFiles, projectFile)
	}

	return projectFiles, nil
}

// UnmarshalSafeNumbers differ int and float for unpacking any
func UnmarshalSafeNumbers(data []byte, v any) error {
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.UseNumber()

	if err := decoder.Decode(v); err != nil {
		return fmt.Errorf("json decode failed: %w", err)
	}

	fixNumericTypes(reflect.ValueOf(v))
	return nil
}

func parseLosslessNumber(jn json.Number) any {
	s := jn.String()
	if strings.ContainsAny(s, ".eE") {
		if f, err := jn.Float64(); err == nil {
			return f
		}
	} else if i, err := jn.Int64(); err == nil {
		return i
	}
	return s
}

func fixNumericTypes(v reflect.Value) {
	if !v.IsValid() {
		return
	}
	switch v.Kind() {
	case reflect.Pointer, reflect.Interface:
		if v.IsNil() {
			return
		}
		elem := v.Elem()
		if jn, ok := elem.Interface().(json.Number); ok {
			v.Set(reflect.ValueOf(parseLosslessNumber(jn)))
			return
		}
		fixNumericTypes(elem)
	case reflect.Struct:
		for i := 0; i < v.NumField(); i++ {
			fixNumericTypes(v.Field(i))
		}
	case reflect.Map:
		iter := v.MapRange()
		for iter.Next() {
			val := iter.Value()
			if val.Kind() == reflect.Interface && !val.IsNil() {
				if jn, ok := val.Elem().Interface().(json.Number); ok {
					v.SetMapIndex(iter.Key(), reflect.ValueOf(parseLosslessNumber(jn)))
					continue
				}
			}
			fixNumericTypes(val)
		}
	case reflect.Slice, reflect.Array:
		for i := 0; i < v.Len(); i++ {
			fixNumericTypes(v.Index(i))
		}
	}
}

func CategorizeType(val any) string {
	if val == nil {
		return "nil"
	}

	t := reflect.TypeOf(val)
	switch t.Kind() {

	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64, reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return "int"

	case reflect.Float32, reflect.Float64:
		return "float"

	case reflect.String:
		return "str"

	case reflect.Slice, reflect.Array:
		if t.Elem().Kind() == reflect.Uint8 {
			return "bytes"
		}
		return "unknown"

	case reflect.Map:
		return "thing"

	default:
		return "unknown"
	}
}
