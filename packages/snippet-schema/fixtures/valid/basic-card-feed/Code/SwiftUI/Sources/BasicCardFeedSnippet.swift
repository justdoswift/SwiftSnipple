import SwiftUI

public struct BasicCardFeedSnippet: View {
  public let title: String
  public let summary: String

  public init(title: String, summary: String) {
    self.title = title
    self.summary = summary
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(title)
        .font(.headline)
      Text(summary)
        .font(.subheadline)
        .foregroundStyle(.secondary)
    }
    .padding()
    .background(.background)
    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 16, style: .continuous)
        .strokeBorder(.quaternary, lineWidth: 1)
    )
  }
}
