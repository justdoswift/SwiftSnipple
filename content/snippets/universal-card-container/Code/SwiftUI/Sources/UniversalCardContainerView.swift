import SwiftUI

public struct UniversalCardContainerView<Content: View>: View {
  public let eyebrow: String
  public let title: String
  public let summary: String
  private let content: Content

  public init(
    eyebrow: String,
    title: String,
    summary: String,
    @ViewBuilder content: () -> Content
  ) {
    self.eyebrow = eyebrow
    self.title = title
    self.summary = summary
    self.content = content()
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      VStack(alignment: .leading, spacing: 8) {
        Text(eyebrow.uppercased())
          .font(.caption.weight(.semibold))
          .foregroundStyle(.secondary)
        Text(title)
          .font(.title3.weight(.semibold))
        Text(summary)
          .font(.subheadline)
          .foregroundStyle(.secondary)
      }

      Divider()

      content
        .foregroundStyle(.secondary)
    }
    .padding(20)
    .background(
      RoundedRectangle(cornerRadius: 22, style: .continuous)
        .fill(Color(.secondarySystemBackground))
    )
    .overlay(
      RoundedRectangle(cornerRadius: 22, style: .continuous)
        .strokeBorder(.quaternary, lineWidth: 1)
    )
  }
}
