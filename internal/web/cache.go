package web

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"sync/atomic"
	"time"
)

type RepoInfo struct {
	LatestTag   string    `json:"latest_tag"`
	UpdatedAt   string    `json:"updated_at"`
	LastFetched time.Time `json:"-"`
}

type Cache struct {
	mu            sync.RWMutex
	repoInfo      *RepoInfo
	client        *http.Client
	cacheTTL      time.Duration
	repoOwner     string
	repoName      string
	apiBase       string
	refreshCtx    context.Context
	refreshCancel context.CancelFunc
	refreshing    int32
}

func NewCache(repoOwner, repoName, apiBase string, cacheTTL time.Duration) *Cache {
	ctx, cancel := context.WithCancel(context.Background())
	return &Cache{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		cacheTTL:      cacheTTL,
		repoOwner:     repoOwner,
		repoName:      repoName,
		apiBase:       apiBase,
		refreshCtx:    ctx,
		refreshCancel: cancel,
	}
}

func (c *Cache) fetchLatestTag() (string, error) {
	url := fmt.Sprintf("%s/repos/%s/%s/tags", c.apiBase, c.repoOwner, c.repoName)
	resp, err := c.client.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to fetch tags from %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status code %d from %s", resp.StatusCode, url)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body from %s: %w", url, err)
	}

	var tags []struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal(body, &tags); err != nil {
		return "", fmt.Errorf("failed to unmarshal tags JSON from %s: %w", url, err)
	}

	if len(tags) == 0 {
		return "", fmt.Errorf("no tags found for %s/%s", c.repoOwner, c.repoName)
	}

	return tags[0].Name, nil
}

func (c *Cache) fetchRepoInfo() (string, error) {
	url := fmt.Sprintf("%s/repos/%s/%s", c.apiBase, c.repoOwner, c.repoName)
	resp, err := c.client.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to fetch repo info from %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status code %d from %s", resp.StatusCode, url)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body from %s: %w", url, err)
	}

	var repo struct {
		UpdatedAt string `json:"updated_at"`
	}
	if err := json.Unmarshal(body, &repo); err != nil {
		return "", fmt.Errorf("failed to unmarshal repo JSON from %s: %w", url, err)
	}

	return repo.UpdatedAt, nil
}

func (c *Cache) refresh() error {
	tag, err := c.fetchLatestTag()
	if err != nil {
		return fmt.Errorf("failed to fetch latest tag: %w", err)
	}

	updatedAt, err := c.fetchRepoInfo()
	if err != nil {
		return fmt.Errorf("failed to fetch repo info: %w", err)
	}

	c.mu.Lock()
	c.repoInfo = &RepoInfo{
		LatestTag:   tag,
		UpdatedAt:   updatedAt,
		LastFetched: time.Now(),
	}
	c.mu.Unlock()

	return nil
}

func (c *Cache) Get() *RepoInfo {
	c.mu.RLock()
	info := c.repoInfo
	var lastFetched time.Time
	if info != nil {
		lastFetched = info.LastFetched
	}
	c.mu.RUnlock()

	if info == nil || time.Since(lastFetched) > c.cacheTTL {
		if !atomic.CompareAndSwapInt32(&c.refreshing, 0, 1) {
			return info
		}

		go func() {
			defer atomic.StoreInt32(&c.refreshing, 0)
			if err := c.refresh(); err != nil {
				log.Printf("Error refreshing cache asynchronously: %v", err)
			}
		}()
	}

	return info
}

func (c *Cache) Refresh() error {
	return c.refresh()
}

func (c *Cache) StartBackgroundRefresh() {
	go func() {
		ticker := time.NewTicker(c.cacheTTL)
		defer ticker.Stop()

		for {
			select {
			case <-c.refreshCtx.Done():
				return
			case <-ticker.C:
				if err := c.refresh(); err != nil {
					log.Printf("Error refreshing cache: %v", err)
				}
			}
		}
	}()
}

func (c *Cache) Stop() {
	c.refreshCancel()
}

func (c *Cache) Context() context.Context {
	return c.refreshCtx
}

func (c *Cache) IsHealthy() bool {
	c.mu.RLock()
	hasData := c.repoInfo != nil
	c.mu.RUnlock()

	select {
	case <-c.refreshCtx.Done():
		return false
	default:
		return hasData
	}
}

func (c *Cache) CheckExternalAPI(ctx context.Context) error {
	testURL := fmt.Sprintf("%s/repos/%s/%s", c.apiBase, c.repoOwner, c.repoName)
	req, err := http.NewRequestWithContext(ctx, "GET", testURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to reach external API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("external API returned status %d", resp.StatusCode)
	}

	return nil
}
