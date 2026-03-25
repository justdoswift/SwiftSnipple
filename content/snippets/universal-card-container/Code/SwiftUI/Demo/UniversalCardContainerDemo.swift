import SwiftUI

struct UniversalCardContainerDemo: View {
  var body: some View {
    UniversalCardContainerView(
      eyebrow: "Launch Ready",
      title: "Universal Card Container",
      summary: "A drop-in wrapper for snippet cards, release notes, or inspector rows."
    ) {
      HStack(spacing: 10) {
        Label("SwiftUI", systemImage: "swift")
        Label("Reusable", systemImage: "square.stack.3d.up")
      }
      .font(.footnote.weight(.medium))
    }
      .padding()
  }
}
