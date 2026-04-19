package domain

import "time"

type SubscriptionStatus string

const (
	SubscriptionStatusInactive           SubscriptionStatus = "inactive"
	SubscriptionStatusTrialing           SubscriptionStatus = "trialing"
	SubscriptionStatusActive             SubscriptionStatus = "active"
	SubscriptionStatusPastDue            SubscriptionStatus = "past_due"
	SubscriptionStatusCanceled           SubscriptionStatus = "canceled"
	SubscriptionStatusUnpaid             SubscriptionStatus = "unpaid"
	SubscriptionStatusIncomplete         SubscriptionStatus = "incomplete"
	SubscriptionStatusIncompleteExpired  SubscriptionStatus = "incomplete_expired"
	SubscriptionStatusPaused             SubscriptionStatus = "paused"
)

type MemberUser struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type MemberSubscription struct {
	UserID               string             `json:"userId"`
	StripeCustomerID     string             `json:"stripeCustomerId"`
	StripeSubscriptionID string             `json:"stripeSubscriptionId"`
	Status               SubscriptionStatus `json:"status"`
	CurrentPeriodEnd     *time.Time         `json:"currentPeriodEnd"`
	CancelAtPeriodEnd    bool               `json:"cancelAtPeriodEnd"`
	PriceID              string             `json:"priceId"`
	CreatedAt            time.Time          `json:"createdAt"`
	UpdatedAt            time.Time          `json:"updatedAt"`
}

type MemberSession struct {
	Email              string             `json:"email"`
	IsAuthenticated    bool               `json:"isAuthenticated"`
	SubscriptionStatus SubscriptionStatus `json:"subscriptionStatus"`
	IsEntitled         bool               `json:"isEntitled"`
	CurrentPeriodEnd   *time.Time         `json:"currentPeriodEnd"`
	CancelAtPeriodEnd  bool               `json:"cancelAtPeriodEnd"`
	HasBillingPortal   bool               `json:"hasBillingPortal"`
}

func NormalizeSubscriptionStatus(status string) SubscriptionStatus {
	switch SubscriptionStatus(status) {
	case SubscriptionStatusTrialing,
		SubscriptionStatusActive,
		SubscriptionStatusPastDue,
		SubscriptionStatusCanceled,
		SubscriptionStatusUnpaid,
		SubscriptionStatusIncomplete,
		SubscriptionStatusIncompleteExpired,
		SubscriptionStatusPaused:
		return SubscriptionStatus(status)
	default:
		return SubscriptionStatusInactive
	}
}

func IsEntitledSubscription(status SubscriptionStatus, currentPeriodEnd *time.Time, now time.Time) bool {
	switch status {
	case SubscriptionStatusActive, SubscriptionStatusTrialing:
		return true
	case SubscriptionStatusCanceled:
		return currentPeriodEnd != nil && currentPeriodEnd.After(now.UTC())
	default:
		return false
	}
}
