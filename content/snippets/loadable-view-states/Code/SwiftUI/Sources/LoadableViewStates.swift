import SwiftUI

public enum LoadableState {
  case loading
  case empty(message: String)
  case error(message: String)
  case content
}

public struct LoadableViewStates<Content: View>: View {
  public let state: LoadableState
  private let content: Content

  public init(state: LoadableState, @ViewBuilder content: () -> Content) {
    self.state = state
    self.content = content()
  }

  public var body: some View {
    switch state {
    case .loading:
      ProgressView("Loading snippet...")
        .frame(maxWidth: .infinity, minHeight: 140)
    case let .empty(message):
      messageCard(icon: "tray", message: message)
    case let .error(message):
      messageCard(icon: "exclamationmark.triangle", message: message)
    case .content:
      content
    }
  }

  private func messageCard(icon: String, message: String) -> some View {
    VStack(spacing: 10) {
      Image(systemName: icon)
        .font(.title2)
      Text(message)
        .multilineTextAlignment(.center)
        .foregroundStyle(.secondary)
    }
    .frame(maxWidth: .infinity, minHeight: 140)
  }
}
