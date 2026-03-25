import SwiftUI

struct LoadableViewStatesDemo: View {
  var body: some View {
    VStack(spacing: 18) {
      LoadableViewStates(state: .loading) {
        EmptyView()
      }

      LoadableViewStates(state: .content) {
        Text("Loaded content")
          .font(.headline)
      }
    }
    .padding()
  }
}
