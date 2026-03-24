# Requirements: SwiftSnippet

**Defined:** 2026-03-24
**Core Value:** 用户必须能在几秒内找到一个可信、可复制、可复用的 SwiftUI 片段，并立即把它带回自己的项目或 AI 工作流中。

## v1 Requirements

### Content Protocol

- [x] **CPRT-01**: Maintainer can define a snippet with a valid `snippet.yaml` manifest and required directory structure
- [x] **CPRT-02**: Maintainer can attach demo media, SwiftUI code, prompt assets, and license metadata to a snippet package
- [x] **CPRT-03**: CI can reject snippet submissions that fail schema, structure, or required-field validation
- [x] **CPRT-04**: Maintainer can version snippet content so published assets can be traced back to a source revision

### Discovery

- [ ] **DISC-01**: User can browse a feed of published SwiftUI snippet cards with title, summary, labels, and preview media
- [ ] **DISC-02**: User can filter published snippets by controlled facets including category, difficulty, platform, and media flags
- [ ] **DISC-03**: User can search snippets by keyword and receive ranked results
- [ ] **DISC-04**: User can open a published snippet detail page from feed or search results

### Snippet Detail

- [ ] **DTL-01**: User can view a snippet's demo asset, summary, metadata, and supported platforms on the detail page
- [ ] **DTL-02**: User can read and copy the primary SwiftUI implementation files for a published snippet
- [ ] **DTL-03**: User can read and copy the prompt template and acceptance checklist associated with a snippet
- [ ] **DTL-04**: User can view snippet license information and dependency disclosures before reuse

### Publishing Pipeline

- [ ] **PIPE-01**: Contributor or maintainer can upload snippet media through a signed upload flow without direct cloud credentials
- [ ] **PIPE-02**: Maintainer can move a snippet through draft, review, and published states
- [ ] **PIPE-03**: Publish workflow can validate media constraints, content protocol compliance, and release readiness before publication
- [ ] **PIPE-04**: Publish workflow can generate or refresh a published index consumed by the public site
- [ ] **PIPE-05**: Publish workflow can update search documents so new or changed snippets appear in discovery flows

### Operations

- [ ] **OPS-01**: System can enforce rate limits on resource-sensitive API endpoints
- [x] **OPS-02**: System can store published snippet metadata, review state, and asset references in a primary database
- [ ] **OPS-03**: System can serve cached feed/detail responses for published snippets without exposing draft data
- [x] **OPS-04**: Team can run automated checks for Swift formatting/linting, media validation, and license completeness in CI

### Seed Content

- [ ] **SEED-01**: Team can publish an initial batch of at least 12 production-quality SwiftUI snippets to the public feed
- [ ] **SEED-02**: Initial batch includes coverage across card feed UI, interactions, data state, and AI collaboration templates
- [ ] **SEED-03**: Every launch snippet includes at least one meaningful reuse path through either copyable code or copyable prompt assets

## v2 Requirements

### Growth & Monetization

- **GROW-01**: User can save favorites and view synced personal collections
- **GROW-02**: User can export bundles or download offline packs of snippet assets
- **GROW-03**: Platform can support subscription tiers and gated content access

### Enterprise

- **ENT-01**: Organization can run a private snippet index with internal content visibility rules
- **ENT-02**: Organization can use SSO and audit logs for managed access
- **ENT-03**: Organization can export compliance and review history reports

### Community

- **COMM-01**: User can discuss snippets inside the platform
- **COMM-02**: User can follow contributors or content streams

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native mobile client | v1 先验证 Web 端内容消费与发布闭环 |
| Real-time comments or social graph | 不是验证内容资产价值的必要条件 |
| Full billing/subscription stack | 过早引入会拉高实现复杂度 |
| Multi-framework snippet coverage | 当前先保持 SwiftUI 聚焦 |
| Enterprise SSO and private deployment | 属于验证后商业化阶段 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CPRT-01 | Phase 1 | Complete |
| CPRT-02 | Phase 1 | Complete |
| CPRT-03 | Phase 1 | Complete |
| CPRT-04 | Phase 1 | Complete |
| DISC-01 | Phase 2 | Pending |
| DISC-02 | Phase 2 | Pending |
| DISC-03 | Phase 2 | Pending |
| DISC-04 | Phase 2 | Pending |
| DTL-01 | Phase 2 | Pending |
| DTL-02 | Phase 2 | Pending |
| DTL-03 | Phase 2 | Pending |
| DTL-04 | Phase 2 | Pending |
| PIPE-01 | Phase 3 | Pending |
| PIPE-02 | Phase 3 | Pending |
| PIPE-03 | Phase 3 | Pending |
| PIPE-04 | Phase 3 | Pending |
| PIPE-05 | Phase 3 | Pending |
| OPS-01 | Phase 3 | Pending |
| OPS-02 | Phase 1 | Complete |
| OPS-03 | Phase 2 | Pending |
| OPS-04 | Phase 1 | Complete |
| SEED-01 | Phase 4 | Pending |
| SEED-02 | Phase 4 | Pending |
| SEED-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after initial definition*
