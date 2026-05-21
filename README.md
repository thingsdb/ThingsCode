# ThingsDB Code

## Setup

Install the dependencies:

```bash
npm install
```

## Get started

Start the webserver, the app will be available at [http://localhost:6213](http://localhost:6213).

```bash
npm run build && go build -o ticode . && ./ticode
```

For development, **also** start the dev server, the **dev** app will be available at [http://localhost:3000](http://localhost:3000).

```bash
npm run dev
```

## Build the app for production:

```bash
npm run build

mkdir -p bin/darwin-arm64
GOOS=darwin GOARCH=arm64 CGO_ENABLED=0 go build -o bin/darwin-arm64/ticode

mkdir -p bin/linux-amd64
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o bin/linux-amd64/ticode

mkdir -p bin/windows-amd64
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -o bin/windows-amd64/ticode.exe
```
