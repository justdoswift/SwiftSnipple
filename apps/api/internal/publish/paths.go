package publish

import (
	"fmt"
	"os"
	"path/filepath"
)

func resolveProjectPath(path string) (string, error) {
	if path == "" {
		return "", fmt.Errorf("resolve path: empty path")
	}
	if filepath.IsAbs(path) {
		return path, nil
	}

	wd, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("resolve %s: %w", path, err)
	}

	current := wd
	for {
		candidate := filepath.Join(current, path)
		if _, err := os.Stat(candidate); err == nil {
			return candidate, nil
		}

		parent := filepath.Dir(current)
		if parent == current {
			break
		}
		current = parent
	}

	projectRoot, err := resolveProjectRoot()
	if err == nil {
		return filepath.Join(projectRoot, path), nil
	}

	return filepath.Join(wd, path), nil
}

func resolveProjectRoot() (string, error) {
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	current := wd
	for {
		if _, err := os.Stat(filepath.Join(current, ".planning")); err == nil {
			return current, nil
		}

		parent := filepath.Dir(current)
		if parent == current {
			break
		}
		current = parent
	}

	return wd, nil
}
