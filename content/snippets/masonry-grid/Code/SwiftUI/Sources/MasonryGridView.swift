import SwiftUI

public struct MasonryGridCard: Identifiable {
  public let id: String
  public let title: String
  public let tint: Color
  public let height: CGFloat

  public init(id: String, title: String, tint: Color, height: CGFloat) {
    self.id = id
    self.title = title
    self.tint = tint
    self.height = height
  }
}

public struct MasonryGridView: View {
  public let items: [MasonryGridCard]

  public init(items: [MasonryGridCard]) {
    self.items = items
  }

  public var body: some View {
    let columns = [
      GridItem(.flexible(), spacing: 14),
      GridItem(.flexible(), spacing: 14)
    ]

    ScrollView {
      LazyVGrid(columns: columns, alignment: .center, spacing: 14) {
        ForEach(items) { item in
          RoundedRectangle(cornerRadius: 22, style: .continuous)
            .fill(item.tint.gradient)
            .frame(height: item.height)
            .overlay(alignment: .bottomLeading) {
              Text(item.title)
                .font(.headline.weight(.semibold))
                .foregroundStyle(.white)
                .padding(16)
            }
        }
      }
    }
  }
}
