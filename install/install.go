package install

import (
	"fmt"
	"os"
	"runtime"
)

func Install() {
	switch runtime.GOOS {
	case "linux":
		instalLinux()
	default:
		fmt.Fprintf(os.Stderr, "Install on operation system '%s' not supported\n", runtime.GOOS)
		os.Exit(1)
	}
	fmt.Println("ThingsCode successfully installed!")
	os.Exit(0)
}

func dirExists(path string) bool {
	if info, err := os.Stat(path); err == nil {
		return info.IsDir()
	}
	return false
}

func copyBinFile(in, out string) error {
	i, e := os.Open(in)
	if e != nil {
		return e
	}
	defer func() {
		_ = i.Close()
	}()

	o, e := os.OpenFile(out, os.O_CREATE|os.O_WRONLY, 0755)
	if e != nil {
		return e
	}
	defer func() {
		_ = o.Close()
	}()

	_, err := o.ReadFrom(i)
	return err
}

func instalLinux() {

	if os.Getuid() != 0 {
		fmt.Fprintf(os.Stderr, "Must be root. Try:\n\n  sudo %s install\n", os.Args[0])
		os.Exit(1)
	}

	if dirExists("/usr/local/bin") {
		fn := "/usr/local/bin/ticode"
		if err := copyBinFile(os.Args[0], fn); err != nil {
			fmt.Fprintf(os.Stderr, "Failed to create '%s': %s\n", fn, err)
			os.Exit(1)
		}
	} else if dirExists("/usr/bin") {
		fn := "/usr/bin/ticode"
		if err := copyBinFile(os.Args[0], fn); err != nil {
			fmt.Fprintf(os.Stderr, "Failed to create '%s': %s\n", fn, err)
			os.Exit(1)
		}
	}
}
