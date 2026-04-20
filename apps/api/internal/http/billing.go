package http

import (
	"context"
	"encoding/json"
	"time"

	"github.com/stripe/stripe-go/v83"
	billingportalsession "github.com/stripe/stripe-go/v83/billingportal/session"
	checkoutsession "github.com/stripe/stripe-go/v83/checkout/session"
	subscriptionsvc "github.com/stripe/stripe-go/v83/subscription"
	"github.com/stripe/stripe-go/v83/webhook"
)

type BillingConfig struct {
	SecretKey       string
	WebhookSecret   string
	PriceID         string
	SuccessURL      string
	CancelURL       string
	PortalReturnURL string
}

type CheckoutSessionParams struct {
	UserID     string
	Email      string
	CustomerID string
}

type BillingCheckoutCompleted struct {
	UserID         string
	CustomerID     string
	SubscriptionID string
	PriceID        string
}

type BillingSubscriptionState struct {
	UserID            string
	CustomerID        string
	SubscriptionID    string
	Status            string
	CurrentPeriodEnd  *time.Time
	CancelAtPeriodEnd bool
	PriceID           string
}

type BillingWebhookEvent struct {
	Type              string
	CheckoutCompleted *BillingCheckoutCompleted
	SubscriptionState *BillingSubscriptionState
}

type billingProvider interface {
	CreateCheckoutSession(ctx context.Context, params CheckoutSessionParams) (string, error)
	CreateBillingPortalSession(ctx context.Context, customerID string) (string, error)
	GetSubscriptionState(ctx context.Context, subscriptionID string) (BillingSubscriptionState, error)
	ParseWebhook(payload []byte, signatureHeader string) (BillingWebhookEvent, error)
}

type stripeBillingProvider struct {
	secretKey       string
	webhookSecret   string
	priceID         string
	successURL      string
	cancelURL       string
	portalReturnURL string
}

func NewStripeBillingProvider(cfg BillingConfig) billingProvider {
	return stripeBillingProvider{
		secretKey:       cfg.SecretKey,
		webhookSecret:   cfg.WebhookSecret,
		priceID:         cfg.PriceID,
		successURL:      cfg.SuccessURL,
		cancelURL:       cfg.CancelURL,
		portalReturnURL: cfg.PortalReturnURL,
	}
}

func (p stripeBillingProvider) CreateCheckoutSession(_ context.Context, params CheckoutSessionParams) (string, error) {
	stripe.Key = p.secretKey

	sessionParams := &stripe.CheckoutSessionParams{
		AllowPromotionCodes: stripe.Bool(true),
		CancelURL:           stripe.String(p.cancelURL),
		ClientReferenceID:   stripe.String(params.UserID),
		CustomerEmail:       stripe.String(params.Email),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(p.priceID),
				Quantity: stripe.Int64(1),
			},
		},
		Metadata: map[string]string{
			"user_id": params.UserID,
		},
		Mode:       stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		SuccessURL: stripe.String(p.successURL),
		SubscriptionData: &stripe.CheckoutSessionSubscriptionDataParams{
			Metadata: map[string]string{
				"user_id": params.UserID,
			},
		},
	}
	if params.CustomerID != "" {
		sessionParams.Customer = stripe.String(params.CustomerID)
		sessionParams.CustomerEmail = nil
	}

	session, err := checkoutsession.New(sessionParams)
	if err != nil {
		return "", err
	}

	return session.URL, nil
}

func (p stripeBillingProvider) CreateBillingPortalSession(_ context.Context, customerID string) (string, error) {
	stripe.Key = p.secretKey

	session, err := billingportalsession.New(&stripe.BillingPortalSessionParams{
		Customer:  stripe.String(customerID),
		ReturnURL: stripe.String(p.portalReturnURL),
	})
	if err != nil {
		return "", err
	}

	return session.URL, nil
}

func (p stripeBillingProvider) GetSubscriptionState(ctx context.Context, subscriptionID string) (BillingSubscriptionState, error) {
	stripe.Key = p.secretKey

	params := &stripe.SubscriptionParams{}
	params.Context = ctx

	subscription, err := subscriptionsvc.Get(subscriptionID, params)
	if err != nil {
		return BillingSubscriptionState{}, err
	}

	return billingSubscriptionStateFromStripe(subscription), nil
}

func (p stripeBillingProvider) ParseWebhook(payload []byte, signatureHeader string) (BillingWebhookEvent, error) {
	event, err := webhook.ConstructEventWithOptions(
		payload,
		signatureHeader,
		p.webhookSecret,
		webhook.ConstructEventOptions{
			IgnoreAPIVersionMismatch: true,
		},
	)
	if err != nil {
		return BillingWebhookEvent{}, err
	}

	switch event.Type {
	case "checkout.session.completed":
		var session stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
			return BillingWebhookEvent{}, err
		}

		customerID := ""
		if session.Customer != nil {
			customerID = session.Customer.ID
		}

		subscriptionID := ""
		if session.Subscription != nil {
			subscriptionID = session.Subscription.ID
		}

		return BillingWebhookEvent{
			Type: string(event.Type),
			CheckoutCompleted: &BillingCheckoutCompleted{
				UserID:         firstNonEmpty(session.Metadata["user_id"], session.ClientReferenceID),
				CustomerID:     customerID,
				SubscriptionID: subscriptionID,
			},
		}, nil
	case "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted":
		var subscription stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &subscription); err != nil {
			return BillingWebhookEvent{}, err
		}

		state := billingSubscriptionStateFromStripe(&subscription)
		return BillingWebhookEvent{
			Type:              string(event.Type),
			SubscriptionState: &state,
		}, nil
	default:
		return BillingWebhookEvent{Type: string(event.Type)}, nil
	}
}

func billingSubscriptionStateFromStripe(subscription *stripe.Subscription) BillingSubscriptionState {
	if subscription == nil {
		return BillingSubscriptionState{}
	}

	customerID := ""
	if subscription.Customer != nil {
		customerID = subscription.Customer.ID
	}

	var currentPeriodEnd *time.Time
	if subscription.Items != nil && len(subscription.Items.Data) > 0 && subscription.Items.Data[0].CurrentPeriodEnd > 0 {
		value := time.Unix(subscription.Items.Data[0].CurrentPeriodEnd, 0).UTC()
		currentPeriodEnd = &value
	}

	priceID := ""
	if subscription.Items != nil && len(subscription.Items.Data) > 0 && subscription.Items.Data[0].Price != nil {
		priceID = subscription.Items.Data[0].Price.ID
	}

	return BillingSubscriptionState{
		UserID:            subscription.Metadata["user_id"],
		CustomerID:        customerID,
		SubscriptionID:    subscription.ID,
		Status:            string(subscription.Status),
		CurrentPeriodEnd:  currentPeriodEnd,
		CancelAtPeriodEnd: subscription.CancelAtPeriodEnd,
		PriceID:           priceID,
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}

	return ""
}
