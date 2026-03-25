package publish

import (
	"context"
	"errors"
	"fmt"
	"time"
)

var (
	ErrSnippetNotFound   = errors.New("snippet not found")
	ErrVersionNotFound   = errors.New("version not found")
	ErrIllegalTransition = errors.New("illegal publish transition")
)

type StateRecord struct {
	SnippetID        string
	State            string
	PublishedVersion string
	ReviewedAt       *time.Time
	PublishedAt      *time.Time
}

type VersionRecord struct {
	ID             int64
	SnippetID      string
	Version        string
	SourceRevision string
	Changelog      string
}

type SnippetRecord struct {
	ID              string
	Title           string
	Summary         string
	CategoryPrimary string
	Difficulty      string
	Status          string
}

type Repository interface {
	GetSnippet(ctx context.Context, snippetID string) (SnippetRecord, error)
	GetState(ctx context.Context, snippetID string) (StateRecord, error)
	EnsureVersion(ctx context.Context, snippetID string, version string) (VersionRecord, error)
	SaveState(ctx context.Context, record StateRecord) error
}

type Service struct {
	repo Repository
	now  func() time.Time
}

func NewService(repo Repository) *Service {
	return &Service{
		repo: repo,
		now:  time.Now,
	}
}

func (s *Service) MoveToReview(ctx context.Context, snippetID string) (StateRecord, error) {
	record, err := s.repo.GetState(ctx, snippetID)
	if err != nil {
		return StateRecord{}, err
	}
	if record.State != "draft" {
		return StateRecord{}, fmt.Errorf("%w: %s -> review", ErrIllegalTransition, record.State)
	}

	reviewedAt := s.now().UTC()
	record.State = "review"
	record.ReviewedAt = &reviewedAt

	if err := s.repo.SaveState(ctx, record); err != nil {
		return StateRecord{}, err
	}

	return record, nil
}

func (s *Service) PublishVersion(ctx context.Context, snippetID string, version string) (StateRecord, error) {
	record, err := s.repo.GetState(ctx, snippetID)
	if err != nil {
		return StateRecord{}, err
	}
	if record.State != "review" {
		return StateRecord{}, fmt.Errorf("%w: %s -> published", ErrIllegalTransition, record.State)
	}

	if _, err := s.repo.EnsureVersion(ctx, snippetID, version); err != nil {
		return StateRecord{}, err
	}

	publishedAt := s.now().UTC()
	record.State = "published"
	record.PublishedVersion = version
	record.PublishedAt = &publishedAt

	if err := s.repo.SaveState(ctx, record); err != nil {
		return StateRecord{}, err
	}

	return record, nil
}
