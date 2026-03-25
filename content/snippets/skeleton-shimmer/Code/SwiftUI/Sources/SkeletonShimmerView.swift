import SwiftUI

public struct SkeletonShimmerView: View {
  @State private var shimmerOffset: CGFloat = -160

  public init() {}

  public var body: some View {
    VStack(alignment: .leading, spacing: 14) {
      shimmerBlock(width: 180, height: 18)
      shimmerBlock(width: nil, height: 12)
      shimmerBlock(width: 220, height: 12)
      HStack(spacing: 12) {
        shimmerBlock(width: 84, height: 28)
        shimmerBlock(width: 96, height: 28)
      }
    }
    .padding(20)
    .background(
      RoundedRectangle(cornerRadius: 20, style: .continuous)
        .fill(Color(.secondarySystemBackground))
    )
  }

  private func shimmerBlock(width: CGFloat?, height: CGFloat) -> some View {
    RoundedRectangle(cornerRadius: height / 2, style: .continuous)
      .fill(Color(.systemGray5))
      .frame(maxWidth: width == nil ? .infinity : width, minHeight: height, maxHeight: height)
      .overlay {
        GeometryReader { proxy in
          LinearGradient(
            colors: [.clear, .white.opacity(0.55), .clear],
            startPoint: .leading,
            endPoint: .trailing
          )
          .frame(width: proxy.size.width * 0.45)
          .offset(x: shimmerOffset)
        }
        .mask(
          RoundedRectangle(cornerRadius: height / 2, style: .continuous)
            .frame(height: height)
        )
      }
      .onAppear {
        withAnimation(.linear(duration: 1.1).repeatForever(autoreverses: false)) {
          shimmerOffset = 220
        }
      }
  }
}
