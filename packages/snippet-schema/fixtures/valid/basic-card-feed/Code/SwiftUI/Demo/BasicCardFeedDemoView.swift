import SwiftUI

struct BasicCardFeedDemoView: View {
  var body: some View {
    BasicCardFeedSnippet(
      title: "Foundation fixture",
      summary: "Used to verify protocol and Swift checks in Phase 1."
    )
    .padding()
  }
}

#Preview {
  BasicCardFeedDemoView()
}
