import SwiftUI

struct TagChipsWrapDemo: View {
  var body: some View {
    TagChipsWrapView(
      tags: [
        "SwiftUI",
        "Launch Ready",
        "Interactive",
        "Cover Only",
        "Prompt Friendly"
      ]
    )
      .padding()
  }
}
