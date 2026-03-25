import SwiftUI

public struct LikeButtonBounce: View {
  @State private var isLiked: Bool
  @State private var scale: CGFloat = 1
  public let baseCount: Int

  public init(baseCount: Int = 128, isInitiallyLiked: Bool = false) {
    self.baseCount = baseCount
    _isLiked = State(initialValue: isInitiallyLiked)
  }

  public var body: some View {
    Button {
      isLiked.toggle()
      scale = 0.82
      withAnimation(.spring(response: 0.28, dampingFraction: 0.45)) {
        scale = 1
      }
    } label: {
      HStack(spacing: 10) {
        Image(systemName: isLiked ? "heart.fill" : "heart")
          .foregroundStyle(isLiked ? .pink : .secondary)
          .scaleEffect(scale)
        Text("\(baseCount + (isLiked ? 1 : 0))")
          .font(.headline.weight(.semibold))
      }
      .padding(.horizontal, 16)
      .padding(.vertical, 12)
      .background(
        Capsule(style: .continuous)
          .fill(Color(.secondarySystemBackground))
      )
    }
    .buttonStyle(.plain)
  }
}
