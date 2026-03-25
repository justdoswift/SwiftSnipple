import SwiftUI

public struct StackedHeroCardView: View {
  public init() {}

  public var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      Text("Stacked Hero")
        .font(.largeTitle.bold())
      Text("Editorial card layout")
        .foregroundStyle(.secondary)
    }
    .padding(24)
    .background(
      RoundedRectangle(cornerRadius: 24, style: .continuous)
        .fill(.background)
    )
  }
}
