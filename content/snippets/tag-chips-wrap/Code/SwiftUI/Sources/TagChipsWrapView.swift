import SwiftUI

public struct TagChipsWrapView: View {
  public let tags: [String]

  public init(tags: [String]) {
    self.tags = tags
  }

  public var body: some View {
    let columns = [GridItem(.adaptive(minimum: 88), spacing: 10, alignment: .leading)]

    LazyVGrid(columns: columns, alignment: .leading, spacing: 10) {
      ForEach(tags, id: \.self) { tag in
        Text(tag)
          .font(.footnote.weight(.medium))
          .padding(.horizontal, 12)
          .padding(.vertical, 8)
          .frame(maxWidth: .infinity, alignment: .leading)
          .background(
            Capsule(style: .continuous)
              .fill(Color(.secondarySystemBackground))
          )
      }
    }
  }
}
