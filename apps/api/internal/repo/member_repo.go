package repo

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"swiftsnipple/api/internal/domain"
)

var (
	ErrMemberNotFound = errors.New("member not found")
	ErrDuplicateEmail = errors.New("member email already exists")
)

type MemberRepository struct {
	pool *pgxpool.Pool
}

func NewMemberRepository(pool *pgxpool.Pool) *MemberRepository {
	return &MemberRepository{pool: pool}
}

const memberUserSelectColumns = `
	id,
	email,
	password_hash,
	created_at,
	updated_at
`

const memberSubscriptionSelectColumns = `
	user_id,
	stripe_customer_id,
	stripe_subscription_id,
	status,
	current_period_end,
	cancel_at_period_end,
	price_id,
	created_at,
	updated_at
`

func (r *MemberRepository) CreateUser(ctx context.Context, email, passwordHash string) (domain.MemberUser, error) {
	id := uuid.NewString()
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))

	row := r.pool.QueryRow(ctx, `
		INSERT INTO member_users (
			id,
			email,
			password_hash,
			created_at,
			updated_at
		) VALUES (
			$1,
			$2,
			$3,
			NOW(),
			NOW()
		)
		RETURNING `+memberUserSelectColumns,
		id,
		normalizedEmail,
		passwordHash,
	)

	user, err := scanMemberUser(row)
	if err != nil {
		if isDuplicateKeyError(err) {
			return domain.MemberUser{}, ErrDuplicateEmail
		}
		return domain.MemberUser{}, fmt.Errorf("create member user: %w", err)
	}

	return user, nil
}

func (r *MemberRepository) GetUserByEmail(ctx context.Context, email string) (domain.MemberUser, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT `+memberUserSelectColumns+`
		FROM member_users
		WHERE email = $1
	`, strings.ToLower(strings.TrimSpace(email)))

	user, err := scanMemberUser(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.MemberUser{}, ErrMemberNotFound
		}
		return domain.MemberUser{}, fmt.Errorf("get member by email: %w", err)
	}

	return user, nil
}

func (r *MemberRepository) GetUserByID(ctx context.Context, id string) (domain.MemberUser, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT `+memberUserSelectColumns+`
		FROM member_users
		WHERE id = $1
	`, id)

	user, err := scanMemberUser(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.MemberUser{}, ErrMemberNotFound
		}
		return domain.MemberUser{}, fmt.Errorf("get member by id: %w", err)
	}

	return user, nil
}

func (r *MemberRepository) ListAdminMembers(ctx context.Context) ([]domain.AdminMember, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT
			u.id,
			u.email,
			u.created_at,
			u.updated_at,
			COALESCE(s.status, 'inactive'),
			s.current_period_end,
			COALESCE(s.cancel_at_period_end, FALSE)
		FROM member_users u
		LEFT JOIN member_subscriptions s ON s.user_id = u.id
		ORDER BY u.created_at DESC, u.email ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("list admin members: %w", err)
	}
	defer rows.Close()

	members := make([]domain.AdminMember, 0)
	now := time.Now().UTC()

	for rows.Next() {
		var member domain.AdminMember
		if err := rows.Scan(
			&member.ID,
			&member.Email,
			&member.CreatedAt,
			&member.UpdatedAt,
			&member.SubscriptionStatus,
			&member.CurrentPeriodEnd,
			&member.CancelAtPeriodEnd,
		); err != nil {
			return nil, fmt.Errorf("scan admin member: %w", err)
		}

		member.SubscriptionStatus = domain.NormalizeSubscriptionStatus(string(member.SubscriptionStatus))
		member.IsPaid = domain.IsEntitledSubscription(member.SubscriptionStatus, member.CurrentPeriodEnd, now)
		members = append(members, member)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate admin members: %w", err)
	}

	slices.SortFunc(members, func(a, b domain.AdminMember) int {
		if cmp := b.CreatedAt.Compare(a.CreatedAt); cmp != 0 {
			return cmp
		}
		return strings.Compare(a.Email, b.Email)
	})

	return members, nil
}

func (r *MemberRepository) GetSubscriptionByUserID(ctx context.Context, userID string) (*domain.MemberSubscription, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT `+memberSubscriptionSelectColumns+`
		FROM member_subscriptions
		WHERE user_id = $1
	`, userID)

	subscription, err := scanMemberSubscription(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get subscription by user id: %w", err)
	}

	return &subscription, nil
}

func (r *MemberRepository) GetSubscriptionByStripeCustomerID(ctx context.Context, customerID string) (*domain.MemberSubscription, error) {
	if strings.TrimSpace(customerID) == "" {
		return nil, nil
	}

	row := r.pool.QueryRow(ctx, `
		SELECT `+memberSubscriptionSelectColumns+`
		FROM member_subscriptions
		WHERE stripe_customer_id = $1
	`, customerID)

	subscription, err := scanMemberSubscription(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get subscription by customer id: %w", err)
	}

	return &subscription, nil
}

func (r *MemberRepository) GetSubscriptionByStripeSubscriptionID(ctx context.Context, subscriptionID string) (*domain.MemberSubscription, error) {
	if strings.TrimSpace(subscriptionID) == "" {
		return nil, nil
	}

	row := r.pool.QueryRow(ctx, `
		SELECT `+memberSubscriptionSelectColumns+`
		FROM member_subscriptions
		WHERE stripe_subscription_id = $1
	`, subscriptionID)

	subscription, err := scanMemberSubscription(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get subscription by subscription id: %w", err)
	}

	return &subscription, nil
}

func (r *MemberRepository) UpsertSubscription(ctx context.Context, subscription domain.MemberSubscription) (domain.MemberSubscription, error) {
	if subscription.Status == "" {
		subscription.Status = domain.SubscriptionStatusInactive
	}

	row := r.pool.QueryRow(ctx, `
		INSERT INTO member_subscriptions (
			user_id,
			stripe_customer_id,
			stripe_subscription_id,
			status,
			current_period_end,
			cancel_at_period_end,
			price_id,
			created_at,
			updated_at
		) VALUES (
			$1,
			$2,
			$3,
			$4,
			$5,
			$6,
			$7,
			NOW(),
			NOW()
		)
		ON CONFLICT (user_id) DO UPDATE SET
			stripe_customer_id = EXCLUDED.stripe_customer_id,
			stripe_subscription_id = EXCLUDED.stripe_subscription_id,
			status = EXCLUDED.status,
			current_period_end = EXCLUDED.current_period_end,
			cancel_at_period_end = EXCLUDED.cancel_at_period_end,
			price_id = EXCLUDED.price_id,
			updated_at = NOW()
		RETURNING `+memberSubscriptionSelectColumns,
		subscription.UserID,
		subscription.StripeCustomerID,
		subscription.StripeSubscriptionID,
		subscription.Status,
		subscription.CurrentPeriodEnd,
		subscription.CancelAtPeriodEnd,
		subscription.PriceID,
	)

	savedSubscription, err := scanMemberSubscription(row)
	if err != nil {
		return domain.MemberSubscription{}, fmt.Errorf("upsert subscription: %w", err)
	}

	return savedSubscription, nil
}

func scanMemberUser(row interface {
	Scan(dest ...any) error
}) (domain.MemberUser, error) {
	var user domain.MemberUser
	if err := row.Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	); err != nil {
		return domain.MemberUser{}, err
	}

	return user, nil
}

func scanMemberSubscription(row interface {
	Scan(dest ...any) error
}) (domain.MemberSubscription, error) {
	var subscription domain.MemberSubscription
	if err := row.Scan(
		&subscription.UserID,
		&subscription.StripeCustomerID,
		&subscription.StripeSubscriptionID,
		&subscription.Status,
		&subscription.CurrentPeriodEnd,
		&subscription.CancelAtPeriodEnd,
		&subscription.PriceID,
		&subscription.CreatedAt,
		&subscription.UpdatedAt,
	); err != nil {
		return domain.MemberSubscription{}, err
	}

	subscription.Status = domain.NormalizeSubscriptionStatus(string(subscription.Status))
	return subscription, nil
}

func isDuplicateKeyError(err error) bool {
	return strings.Contains(strings.ToLower(err.Error()), "duplicate key")
}
