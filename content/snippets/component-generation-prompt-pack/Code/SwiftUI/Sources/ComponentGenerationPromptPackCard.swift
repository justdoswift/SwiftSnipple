import SwiftUI

public struct ComponentGenerationPromptPackCard: View {
  public let title: String
  public let steps: [String]

  public init(title: String, steps: [String]) {
    self.title = title
    self.steps = steps
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: 14) {
      Text(title)
        .font(.headline.weight(.semibold))

      ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
        HStack(alignment: .top, spacing: 10) {
          Text("\(index + 1)")
            .font(.caption.weight(.bold))
            .frame(width: 24, height: 24)
            .background(Circle().fill(Color(.secondarySystemBackground)))
          Text(step)
            .font(.subheadline)
            .foregroundStyle(.secondary)
        }
      }
    }
    .padding()
  }
}
