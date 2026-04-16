-- +goose Up
UPDATE snippets
SET
  code = CASE id
    WHEN '9f5d13f9-40a7-4dde-9b91-4c5530b03c61' THEN
      'import SwiftUI

struct LiquidGlassPanelView: View {
  var body: some View {
    VStack(alignment: .leading, spacing: 18) {
      Text("Liquid Glass")
        .font(.system(size: 32, weight: .black, design: .rounded))

      Text("Layered typography, restrained chrome, and soft material depth.")
        .font(.body)
        .foregroundStyle(.secondary)
    }
    .padding(28)
    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 30, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 30, style: .continuous)
        .stroke(Color.white.opacity(0.18), lineWidth: 1)
    )
    .shadow(color: .black.opacity(0.12), radius: 28, y: 18)
  }
}'
    WHEN '9c47a567-d963-4d85-af3e-3fd9d0899e0d' THEN
      'import SwiftUI

struct MotionSnippetCard: View {
  @State private var isVisible = false

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("Motion Language")
        .font(.title.bold())
      Text("Metadata enters slightly after the headline for a cleaner rhythm.")
        .foregroundStyle(.secondary)
    }
    .padding(24)
    .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 24))
    .opacity(isVisible ? 1 : 0)
    .offset(y: isVisible ? 0 : 16)
    .animation(.spring(duration: 0.55, bounce: 0.14), value: isVisible)
    .task {
      isVisible = true
    }
  }
}'
    WHEN '2049c31d-8db7-46db-b2b0-dd2854cac884' THEN
      'import SwiftUI

struct SnippetTemplateView: View {
  let title: String
  let excerpt: String

  var body: some View {
    VStack(alignment: .leading, spacing: 14) {
      Text(title)
        .font(.system(size: 30, weight: .black))
      Text(excerpt)
        .foregroundStyle(.secondary)
    }
    .padding(24)
  }
}'
    WHEN '2e74bd25-6ccf-4576-ab66-9940ef813f9c' THEN
      'import SwiftUI

struct ReleasePreviewBanner: View {
  var body: some View {
    HStack(spacing: 12) {
      Circle()
        .fill(.green)
        .frame(width: 10, height: 10)
      Text("Snippet pack ready for release")
        .font(.headline)
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 12)
    .background(Color(.secondarySystemBackground), in: Capsule())
  }
}'
    ELSE code
  END,
  prompts = CASE id
    WHEN '9f5d13f9-40a7-4dde-9b91-4c5530b03c61' THEN
      'Rebuild a premium SwiftUI glass panel inspired by editorial product photography.

Requirements:
- oversized rounded rectangle with ultra-thin material
- strong title hierarchy
- soft highlight stroke
- restrained monochrome palette
- shadow depth without looking muddy

After the code, explain which visual choices keep the panel feeling deliberate instead of generic.'
    WHEN '9c47a567-d963-4d85-af3e-3fd9d0899e0d' THEN
      'Design a small SwiftUI snippet that demonstrates tasteful content reveal motion.

Use:
- staggered entrance timing
- subtle translate + fade
- no bouncy overshoot
- motion that supports reading order

Add a short note about why the timing works for snippet cards and detail layouts.'
    WHEN '2049c31d-8db7-46db-b2b0-dd2854cac884' THEN
      'Create a reusable SwiftUI snippet template with clear slots for title, excerpt, metadata, code, and notes.

Priorities:
- simple to reuse
- visually clean by default
- strong typography
- easy to adapt for a snippet library UI'
    WHEN '2e74bd25-6ccf-4576-ab66-9940ef813f9c' THEN
      'Draft a compact SwiftUI release-preview component that can announce a new snippet pack or update.

Keep it:
- lightweight
- easy to drop into a dashboard or landing page
- readable at a glance
- visually aligned with a monochrome product system'
    ELSE prompts
  END
WHERE id IN (
  '9f5d13f9-40a7-4dde-9b91-4c5530b03c61',
  '9c47a567-d963-4d85-af3e-3fd9d0899e0d',
  '2049c31d-8db7-46db-b2b0-dd2854cac884',
  '2e74bd25-6ccf-4576-ab66-9940ef813f9c'
);

-- +goose Down
UPDATE snippets
SET
  code = '',
  prompts = ''
WHERE id IN (
  '9f5d13f9-40a7-4dde-9b91-4c5530b03c61',
  '9c47a567-d963-4d85-af3e-3fd9d0899e0d',
  '2049c31d-8db7-46db-b2b0-dd2854cac884',
  '2e74bd25-6ccf-4576-ab66-9940ef813f9c'
);
