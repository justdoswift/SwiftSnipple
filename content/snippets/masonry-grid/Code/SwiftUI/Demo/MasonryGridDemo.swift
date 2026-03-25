import SwiftUI

struct MasonryGridDemo: View {
  private let sampleItems: [MasonryGridCard] = [
    MasonryGridCard(id: "hero", title: "Hero", tint: .pink, height: 220),
    MasonryGridCard(id: "tips", title: "Tips", tint: .orange, height: 150),
    MasonryGridCard(id: "recents", title: "Recents", tint: .indigo, height: 190),
    MasonryGridCard(id: "notes", title: "Notes", tint: .teal, height: 170)
  ]

  var body: some View {
    MasonryGridView(items: sampleItems)
      .padding()
  }
}
