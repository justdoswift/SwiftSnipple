package publish

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

type ValidationIssue struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Path    string `json:"path,omitempty"`
}

type ValidationResult struct {
	OK     bool              `json:"ok"`
	Issues []ValidationIssue `json:"issues"`
}

type Validator struct {
	repo          Repository
	assets        AssetRepository
	snippetRoot   string
	packageRoot   string
	commandRunner func(ctx context.Context, name string, args ...string) ([]byte, error)
}

type snippetManifest struct {
	ID              string   `yaml:"id"`
	Title           string   `yaml:"title"`
	Summary         string   `yaml:"summary"`
	Status          string   `yaml:"status"`
	CategoryPrimary string   `yaml:"category_primary"`
	Version         string   `yaml:"version"`
	Tags            []string `yaml:"tags"`
	Facets          []string `yaml:"facets"`
	Difficulty      string   `yaml:"difficulty"`
	Platforms       []struct {
		OS         string `yaml:"os"`
		MinVersion string `yaml:"min_version"`
	} `yaml:"platforms"`
	Assets struct {
		Cover string `yaml:"cover"`
		Demo  string `yaml:"demo"`
	} `yaml:"assets"`
	Code struct {
		SwiftUIRoot string `yaml:"swiftui_root"`
		PromptRoot  string `yaml:"prompt_root"`
		TestsRoot   string `yaml:"tests_root"`
	} `yaml:"code"`
	License struct {
		Code             string `yaml:"code"`
		Media            string `yaml:"media"`
		ThirdPartyNotice string `yaml:"third_party_notice"`
	} `yaml:"license"`
	SourceRevision string `yaml:"source_revision"`
}

func NewValidator(repo Repository, assets AssetRepository, snippetRoot string, packageRoot string) *Validator {
	resolvedSnippetRoot, err := resolveProjectPath(snippetRoot)
	if err != nil {
		resolvedSnippetRoot = snippetRoot
	}

	resolvedPackageRoot := packageRoot
	if resolvedPackageRoot == "" {
		if projectRoot, err := resolveProjectRoot(); err == nil {
			resolvedPackageRoot = projectRoot
		}
	} else if root, err := resolveProjectPath(packageRoot); err == nil {
		resolvedPackageRoot = root
	}

	return &Validator{
		repo:        repo,
		assets:      assets,
		snippetRoot: resolvedSnippetRoot,
		packageRoot: resolvedPackageRoot,
		commandRunner: func(ctx context.Context, name string, args ...string) ([]byte, error) {
			cmd := exec.CommandContext(ctx, name, args...)
			if resolvedPackageRoot != "" {
				cmd.Dir = resolvedPackageRoot
			}
			return cmd.CombinedOutput()
		},
	}
}

func (v *Validator) ValidateReady(ctx context.Context, snippetID string, version string) (ValidationResult, error) {
	snippet, err := v.repo.GetSnippet(ctx, snippetID)
	if err != nil {
		return ValidationResult{}, err
	}

	versionRecord, err := v.repo.EnsureVersion(ctx, snippetID, version)
	if err != nil {
		return ValidationResult{}, err
	}

	manifestPath := filepath.Join(v.snippetRoot, snippetID, "snippet.yaml")
	manifestBytes, err := os.ReadFile(manifestPath)
	if err != nil {
		return ValidationResult{}, fmt.Errorf("read snippet manifest: %w", err)
	}

	var manifest snippetManifest
	if err := yaml.Unmarshal(manifestBytes, &manifest); err != nil {
		return ValidationResult{}, fmt.Errorf("parse snippet manifest: %w", err)
	}

	issues := make([]ValidationIssue, 0)
	issues = append(issues, v.runProtocolValidation(ctx, filepath.Join(v.snippetRoot, snippetID))...)
	issues = append(issues, validatePublishMetadata(snippet, versionRecord, manifest)...)

	if v.assets != nil {
		assets, err := v.assets.ListAssets(ctx, snippetID, version)
		if err != nil {
			return ValidationResult{}, err
		}
		issues = append(issues, validateRequiredAssets(manifest, assets)...)
	}

	return ValidationResult{
		OK:     len(issues) == 0,
		Issues: issues,
	}, nil
}

func (v *Validator) runProtocolValidation(ctx context.Context, snippetDir string) []ValidationIssue {
	output, err := v.commandRunner(ctx, "pnpm", "--filter", "@swiftsnippet/snippet-schema", "exec", "tsx", "src/cli.ts", "snippet", snippetDir)
	if err == nil {
		return nil
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	issues := make([]ValidationIssue, 0)
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "FAIL ") {
			continue
		}
		if strings.HasPrefix(line, "PASS ") {
			continue
		}
		if strings.HasPrefix(line, "- ") {
			line = strings.TrimPrefix(line, "- ")
		}
		line = strings.TrimPrefix(line, "  - ")

		parts := strings.SplitN(line, ": ", 2)
		issue := ValidationIssue{Code: "protocol_invalid", Message: line}
		if len(parts) == 2 {
			issue.Path = strings.TrimSpace(parts[0])
			issue.Message = strings.TrimSpace(parts[1])
		}
		issues = append(issues, issue)
	}

	if len(issues) == 0 {
		issues = append(issues, ValidationIssue{
			Code:    "protocol_invalid",
			Message: strings.TrimSpace(string(output)),
		})
	}

	return issues
}

func validatePublishMetadata(snippet SnippetRecord, version VersionRecord, manifest snippetManifest) []ValidationIssue {
	issues := make([]ValidationIssue, 0)

	if strings.TrimSpace(manifest.License.Code) == "" || strings.TrimSpace(manifest.License.Media) == "" {
		issues = append(issues, ValidationIssue{
			Code:    "missing_license",
			Message: "license.code 和 license.media 必须完整",
			Path:    "license",
		})
	}
	if strings.TrimSpace(manifest.License.ThirdPartyNotice) == "" {
		issues = append(issues, ValidationIssue{
			Code:    "missing_license_notice",
			Message: "license.third_party_notice 是必填字段",
			Path:    "license.third_party_notice",
		})
	}
	if strings.TrimSpace(manifest.SourceRevision) == "" {
		issues = append(issues, ValidationIssue{
			Code:    "missing_release_metadata",
			Message: "source_revision 是发布必填字段",
			Path:    "source_revision",
		})
	}
	if manifest.Version != version.Version {
		issues = append(issues, ValidationIssue{
			Code:    "version_mismatch",
			Message: fmt.Sprintf("manifest version %q 与待发布版本 %q 不一致", manifest.Version, version.Version),
			Path:    "version",
		})
	}
	if manifest.ID != snippet.ID {
		issues = append(issues, ValidationIssue{
			Code:    "snippet_id_mismatch",
			Message: fmt.Sprintf("manifest id %q 与 snippet %q 不一致", manifest.ID, snippet.ID),
			Path:    "id",
		})
	}
	if strings.TrimSpace(manifest.Title) == "" || strings.TrimSpace(manifest.Summary) == "" {
		issues = append(issues, ValidationIssue{
			Code:    "missing_release_metadata",
			Message: "title 和 summary 必须完整",
			Path:    "title",
		})
	}

	return issues
}

func validateRequiredAssets(manifest snippetManifest, assets []AssetRecord) []ValidationIssue {
	issues := make([]ValidationIssue, 0)

	assetKinds := make(map[string]AssetRecord, len(assets))
	for _, asset := range assets {
		assetKinds[asset.AssetKind] = asset
	}

	if strings.TrimSpace(manifest.Assets.Cover) != "" {
		if _, ok := assetKinds["cover"]; !ok {
			issues = append(issues, ValidationIssue{
				Code:    "missing_cover_asset",
				Message: "发布版本缺少 cover 资产",
				Path:    "assets.cover",
			})
		}
	}
	if strings.TrimSpace(manifest.Assets.Demo) != "" {
		if _, ok := assetKinds["demo"]; !ok {
			issues = append(issues, ValidationIssue{
				Code:    "missing_demo_asset",
				Message: "manifest 需要 demo，但发布版本缺少 demo 资产",
				Path:    "assets.demo",
			})
		}
	}

	return issues
}

func encodeIssues(issues []ValidationIssue) string {
	encoded, _ := json.Marshal(issues)
	return string(encoded)
}
