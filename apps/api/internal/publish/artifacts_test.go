package publish

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestArtifactCompilerPublishesSearchDocumentsAndVisibility(t *testing.T) {
	root := t.TempDir()
	snippetRoot := filepath.Join(root, "content", "snippets")
	publishedRoot := filepath.Join(root, "content", "published")

	if err := os.MkdirAll(filepath.Join(snippetRoot, "review-only-meter", "Code", "SwiftUI", "Sources"), 0o755); err != nil {
		t.Fatalf("mkdir snippet source: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(snippetRoot, "review-only-meter", "Code", "Vibe"), 0o755); err != nil {
		t.Fatalf("mkdir prompt root: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(snippetRoot, "review-only-meter", "LICENSES"), 0o755); err != nil {
		t.Fatalf("mkdir license root: %v", err)
	}

	writeTestFile(t, filepath.Join(snippetRoot, "review-only-meter", "snippet.yaml"), `id: review-only-meter
title: Review Only Meter
summary: Review candidate
version: 1.0.0
status: review
category_primary: tooling
tags: [meter, review]
facets: [platform:iOS]
difficulty: easy
platforms:
  - os: iOS
    min_version: "17.0"
assets:
  cover: Media/cover.png
code:
  swiftui_root: Code/SwiftUI
  prompt_root: Code/Vibe
  tests_root: Tests
license:
  code: MIT
  media: CC-BY-4.0
  third_party_notice: LICENSES/THIRD_PARTY.md
source_revision: review-only-meter-rev-001
`)
	writeTestFile(t, filepath.Join(snippetRoot, "review-only-meter", "Code", "SwiftUI", "Sources", "ReviewOnlyMeter.swift"), "import SwiftUI\n")
	writeTestFile(t, filepath.Join(snippetRoot, "review-only-meter", "Code", "Vibe", "prompt.md"), "# Prompt\n")
	writeTestFile(t, filepath.Join(snippetRoot, "review-only-meter", "LICENSES", "THIRD_PARTY.md"), "No third-party dependencies.\n")

	writeTestFile(t, filepath.Join(publishedRoot, "snippets.json"), `{
  "generatedAt": "2026-03-24T08:15:00Z",
  "items": [
    {
      "visibility": "published",
      "card": {
        "id": "basic-card-feed",
        "title": "Basic Card Feed",
        "summary": "Existing snippet",
        "categoryPrimary": "layout",
        "difficulty": "easy",
        "platforms": [{"os":"iOS","minVersion":"17.0"}],
        "tags": ["card"],
        "media": {"coverUrl": "/published/basic-card-feed/cover.png"},
        "hasDemo": false,
        "hasPrompt": false,
        "featuredRank": 2,
        "publishedAt": "2026-03-20T09:00:00Z"
      },
      "detail": {
        "id": "basic-card-feed",
        "title": "Basic Card Feed",
        "summary": "Existing snippet",
        "categoryPrimary": "layout",
        "difficulty": "easy",
        "platforms": [{"os":"iOS","minVersion":"17.0"}],
        "tags": ["card"],
        "media": {"coverUrl": "/published/basic-card-feed/cover.png"},
        "hasDemo": false,
        "hasPrompt": false,
        "featuredRank": 2,
        "publishedAt": "2026-03-20T09:00:00Z",
        "codeBlocks": [{"id":"basic-card-feed","title":"Basic.swift","language":"swift","path":"Code/SwiftUI/Sources/Basic.swift","content":"import SwiftUI"}],
        "promptBlocks": [],
        "license": {"code":"MIT","media":"CC-BY-4.0","thirdPartyNoticePath":"LICENSES/THIRD_PARTY.md","disclosures":["No third-party dependencies."]},
        "dependencies": [{"name":"SwiftUI","kind":"framework"}]
      },
      "search": {
        "id": "basic-card-feed",
        "title": "Basic Card Feed",
        "summary": "Existing snippet",
        "categoryPrimary": "layout",
        "difficulty": "easy",
        "platforms": [{"os":"iOS","minVersion":"17.0"}],
        "tags": ["card"],
        "hasDemo": false,
        "hasPrompt": false,
        "featuredRank": 2,
        "publishedAt": "2026-03-20T09:00:00Z"
      }
    }
  ]
}`)
	writeTestFile(t, filepath.Join(publishedRoot, "visibility.json"), `{
  "generatedAt": "2026-03-24T08:15:00Z",
  "items": [
    {"id":"basic-card-feed","visibility":"published"},
    {"id":"review-only-meter","visibility":"not_public"}
  ]
}`)

	compiler := NewArtifactCompiler(
		filepath.Join("content", "published", "snippets.json"),
		filepath.Join("content", "published", "visibility.json"),
		filepath.Join("content", "published", "search-documents.json"),
		filepath.Join("content", "snippets"),
	)
	compiler.now = func() time.Time {
		return time.Date(2026, time.March, 25, 14, 0, 0, 0, time.UTC)
	}

	oldWD, _ := os.Getwd()
	if err := os.Chdir(root); err != nil {
		t.Fatalf("chdir temp root: %v", err)
	}
	defer func() {
		_ = os.Chdir(oldWD)
	}()

	result, err := compiler.Compile(context.Background(),
		SnippetRecord{
			ID:              "review-only-meter",
			Title:           "Review Only Meter",
			Summary:         "Review candidate",
			CategoryPrimary: "tooling",
			Difficulty:      "easy",
		},
		VersionRecord{
			ID:             2,
			SnippetID:      "review-only-meter",
			Version:        "1.0.0",
			SourceRevision: "review-only-meter-rev-001",
			Changelog:      "Initial publish",
		},
		[]AssetRecord{
			{SnippetID: "review-only-meter", Version: "1.0.0", AssetKind: "cover", Path: "review-only-meter/1.0.0/cover.png", MIMEType: "image/png", IsRequired: true},
		},
		time.Date(2026, time.March, 25, 13, 45, 0, 0, time.UTC),
	)
	if err != nil {
		t.Fatalf("Compile returned error: %v", err)
	}

	if len(result.UpdatedFiles) != 3 {
		t.Fatalf("expected 3 updated files, got %d", len(result.UpdatedFiles))
	}

	publishedBytes, err := os.ReadFile(result.SnippetsPath)
	if err != nil {
		t.Fatalf("read snippets path: %v", err)
	}
	if !strings.Contains(string(publishedBytes), `"review-only-meter"`) {
		t.Fatalf("expected published snapshot to include review-only-meter")
	}

	visibilityBytes, err := os.ReadFile(result.VisibilityPath)
	if err != nil {
		t.Fatalf("read visibility path: %v", err)
	}
	if !strings.Contains(string(visibilityBytes), `"visibility": "published"`) {
		t.Fatalf("expected visibility registry to mark snippet as published")
	}

	searchBytes, err := os.ReadFile(result.SearchDocumentsPath)
	if err != nil {
		t.Fatalf("read search docs path: %v", err)
	}

	var searchEnvelope map[string]any
	if err := json.Unmarshal(searchBytes, &searchEnvelope); err != nil {
		t.Fatalf("unmarshal search docs: %v", err)
	}
	items, ok := searchEnvelope["items"].([]any)
	if !ok || len(items) != 2 {
		t.Fatalf("expected 2 search documents, got %#v", searchEnvelope["items"])
	}
}

func TestFeaturedRankForSnippetLaunchBatchOrder(t *testing.T) {
	testCases := map[string]int{
		"stacked-hero-card":                1,
		"masonry-grid":                     2,
		"basic-card-feed":                  3,
		"component-generation-prompt-pack": 12,
		"unknown-snippet":                  50,
	}

	for snippetID, expected := range testCases {
		if actual := featuredRankForSnippet(snippetID); actual != expected {
			t.Fatalf("expected featured rank %d for %s, got %d", expected, snippetID, actual)
		}
	}
}

func writeTestFile(t *testing.T, path string, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("mkdir %s: %v", path, err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("write %s: %v", path, err)
	}
}
