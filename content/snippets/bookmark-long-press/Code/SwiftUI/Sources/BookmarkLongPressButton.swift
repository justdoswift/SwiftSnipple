import SwiftUI

public struct BookmarkLongPressButton: View {
  @GestureState private var isPressing = false
  @State private var isSaved = false

  public init() {}

  public var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      Button {
        isSaved.toggle()
      } label: {
        Label(isSaved ? "Saved" : "Save", systemImage: isSaved ? "bookmark.fill" : "bookmark")
          .font(.headline.weight(.semibold))
          .padding(.horizontal, 16)
          .padding(.vertical, 12)
          .background(
            Capsule(style: .continuous)
              .fill(isSaved ? Color.yellow.opacity(0.2) : Color(.secondarySystemBackground))
          )
      }
      .buttonStyle(.plain)
      .simultaneousGesture(
        LongPressGesture(minimumDuration: 0.45)
          .updating($isPressing) { value, state, _ in
            state = value
          }
      )

      if isPressing {
        Text("Long press to preview the helper state before committing.")
          .font(.footnote)
          .foregroundStyle(.secondary)
      }
    }
  }
}
