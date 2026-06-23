[![CI (golang)](https://github.com/thingsdb/ThingsCode/actions/workflows/ci-go.yaml/badge.svg)](https://github.com/thingsdb/ThingsCode/actions/workflows/ci-go.yaml)
[![CI (TypeScript)](https://github.com/thingsdb/ThingsCode/actions/workflows/ci-ts.yaml/badge.svg)](https://github.com/thingsdb/ThingsCode/actions/workflows/ci-ts.yaml)
[![Release Version](https://img.shields.io/github/release/thingsdb/ThingsCode)](https://github.com/thingsdb/ThingsCode/releases)

# ThingsDB Code

ThingsCode (or **ticode** for short) is the interactive development studio built for [ThingsDB](https://docs.thingsdb.io).

## Installation

**1. Download the latest version:**

- [Linux (amd64)](https://github.com/thingsdb/ThingsCode/releases/download/v1.0.5/ticode-linux-amd64-1.0.5.tar.gz)
- [Linux (arm64)](https://github.com/thingsdb/ThingsCode/releases/download/v1.0.5/ticode-linux-arm64-1.0.5.tar.gz)
- [Darwin (amd64)](https://github.com/thingsdb/ThingsCode/releases/download/v1.0.5/ticode-darwin-amd64-1.0.5.tar.gz)
- [Darwin (arm64)](https://github.com/thingsdb/ThingsCode/releases/download/v1.0.5/ticode-darwin-arm64-1.0.5.tar.gz)
- [Windows (amd64)](https://github.com/thingsdb/ThingsCode/releases/download/v1.0.5/ticode-windows-amd64-1.0.5.tar.gz)
- [Windows (arm64)](https://github.com/thingsdb/ThingsCode/releases/download/v1.0.5/ticode-windows-arm64-1.0.5.tar.gz)

**2. Extract the contents of the archive using a tool like `tar`. Here's an example for Linux (amd64):**

```bash
tar -xzvf ticode-linux-amd64-1.0.5.tar.gz
```

**3. Install:**

The following command will install `ticode` in path if supported by the OS.

```bash
sudo ./ticode install
```
## Screenshots

_(Join Rooms and listen for Events)_
<img width="863" height="219" alt="image" src="https://github.com/user-attachments/assets/91ba12e7-eae8-4df3-942b-db0c9093f3ca" />

_(Integrated Thing Explorer)_
<img width="956" height="486" alt="image" src="https://github.com/user-attachments/assets/90e60744-03bb-4cd8-b95b-e9d477127bc2" />

_(Navigate through Types)_
<img width="1020" height="451" alt="image" src="https://github.com/user-attachments/assets/4d690764-6908-44d6-9493-1d839cc297c6" />

_(Collection Graph)_
<img width="1195" height="741" alt="image" src="https://github.com/user-attachments/assets/98739d8c-a645-4f96-b587-b73358c14ff3" />


## Local development/custom build

**1. Install the dependencies:**

```bash
npm install
```

**2. Start the webserver:**

Start the webserver, the app will be available at [http://localhost:6213](http://localhost:6213).

```bash
npm run build && go build -o ticode . && ./ticode
```

For development, **also** start the dev server, the **dev** app will be available at [http://localhost:3000](http://localhost:3000).

```bash
npm run dev
```

> _(The DEV site will open the WebSocket connection hardcoded on `ws://localhost:6213` so keep the port default when stating `./ticode`)_

## Build the app for production:

```bash
npm run build
CGO_ENABLED=0 go build -trimpath -o ticode
```

Or, if you want to make a release and upload tar.gz files for all architecture:

```bash
npm run build

mkdir -p bin/darwin-amd64
GOOS=darwin GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -o bin/darwin-amd64/ticode
tar -zcf bin/ticode-darwin-amd64-1.0.5.tar.gz -C ./bin/darwin-amd64/ ticode

mkdir -p bin/darwin-arm64
GOOS=darwin GOARCH=arm64 CGO_ENABLED=0 go build -trimpath -o bin/darwin-arm64/ticode
tar -zcf bin/ticode-darwin-arm64-1.0.5.tar.gz -C ./bin/darwin-arm64/ ticode

mkdir -p bin/linux-amd64
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -o bin/linux-amd64/ticode
tar -zcf bin/ticode-linux-amd64-1.0.5.tar.gz -C ./bin/linux-amd64/ ticode

mkdir -p bin/linux-arm64
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -trimpath -o bin/linux-arm64/ticode
tar -zcf bin/ticode-linux-arm64-1.0.5.tar.gz -C ./bin/linux-arm64/ ticode

mkdir -p bin/windows-amd64
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -o bin/windows-amd64/ticode.exe
tar -zcf bin/ticode-windows-amd64-1.0.5.tar.gz -C ./bin/windows-amd64/ ticode.exe

mkdir -p bin/windows-arm64
GOOS=windows GOARCH=arm64 CGO_ENABLED=0 go build -trimpath -o bin/windows-arm64/ticode.exe
tar -zcf bin/ticode-windows-arm64-1.0.5.tar.gz -C ./bin/windows-arm64/ ticode.exe
```

## Update

NPM Packages:

```bash
npm update
```

GO Packages:

```bash
go get -u ./...
go mod tidy
```
