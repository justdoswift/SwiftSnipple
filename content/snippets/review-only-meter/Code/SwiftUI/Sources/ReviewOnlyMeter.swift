import SwiftUI

public struct ReviewOnlyMeter: View {
  public let progress: Double

  public init(progress: Double) {
    self.progress = progress
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      Text("Review Meter")
        .font(.headline)
      GeometryReader { proxy in
        Capsule()
          .fill(Color.blue.opacity(0.18))
          .overlay(alignment: .leading) {
            Capsule()
              .fill(Color.blue)
              .frame(width: proxy.size.width * progress)
          }
      }
      .frame(height: 10)
    }
    .padding()
  }
}
