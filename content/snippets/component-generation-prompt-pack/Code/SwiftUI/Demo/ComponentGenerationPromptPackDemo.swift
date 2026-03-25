import SwiftUI

struct ComponentGenerationPromptPackDemo: View {
  var body: some View {
    ComponentGenerationPromptPackCard(
      title: "Component Generation Prompt Pack",
      steps: [
        "Describe the component goal and interaction style.",
        "Ask for SwiftUI sources plus a preview entry point.",
        "Request an acceptance checklist before publishing."
      ]
    )
    .padding()
  }
}
