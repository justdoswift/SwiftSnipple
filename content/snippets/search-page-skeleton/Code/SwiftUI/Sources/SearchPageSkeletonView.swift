import SwiftUI

public struct SearchPageSkeletonView: View {
  public init() {}

  public var body: some View {
    VStack(alignment: .leading, spacing: 18) {
      RoundedRectangle(cornerRadius: 16, style: .continuous)
        .fill(Color(.secondarySystemBackground))
        .frame(height: 52)
        .overlay(alignment: .leading) {
          Label("Search snippets, prompts, or patterns", systemImage: "magnifyingglass")
            .foregroundStyle(.secondary)
            .padding(.horizontal, 16)
        }

      section(title: "Recent searches", widths: [110, 144, 96])
      section(title: "Hot tags", widths: [92, 126, 84, 118])
    }
  }

  private func section(title: String, widths: [CGFloat]) -> some View {
    VStack(alignment: .leading, spacing: 12) {
      Text(title)
        .font(.headline.weight(.semibold))

      FlexibleChipRow(widths: widths)
    }
  }
}

private struct FlexibleChipRow: View {
  let widths: [CGFloat]

  var body: some View {
    let columns = [GridItem(.adaptive(minimum: 84), spacing: 10, alignment: .leading)]

    LazyVGrid(columns: columns, alignment: .leading, spacing: 10) {
      ForEach(Array(widths.enumerated()), id: \.offset) { _, width in
        Capsule(style: .continuous)
          .fill(Color(.secondarySystemBackground))
          .frame(width: width, height: 30)
      }
    }
  }
}
