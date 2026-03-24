package cache

import (
	"sync"
	"time"
)

type Memory struct {
	mu      sync.RWMutex
	now     func() time.Time
	entries map[string]entry
}

type entry struct {
	value     any
	expiresAt time.Time
}

func NewMemory() *Memory {
	return &Memory{
		now:     time.Now,
		entries: map[string]entry{},
	}
}

func (m *Memory) Get(key string) (any, bool) {
	m.mu.RLock()
	item, ok := m.entries[key]
	m.mu.RUnlock()
	if !ok {
		return nil, false
	}

	if !item.expiresAt.IsZero() && m.now().After(item.expiresAt) {
		m.mu.Lock()
		delete(m.entries, key)
		m.mu.Unlock()
		return nil, false
	}

	return item.value, true
}

func (m *Memory) Set(key string, value any, ttl time.Duration) {
	expiresAt := time.Time{}
	if ttl > 0 {
		expiresAt = m.now().Add(ttl)
	}

	m.mu.Lock()
	m.entries[key] = entry{
		value:     value,
		expiresAt: expiresAt,
	}
	m.mu.Unlock()
}
