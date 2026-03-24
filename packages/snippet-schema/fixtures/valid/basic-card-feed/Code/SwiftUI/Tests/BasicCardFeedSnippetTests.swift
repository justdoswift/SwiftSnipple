import Testing

@testable import BasicCardFeedSnippet

@Test func smokeTestFixtureExists() async throws {
  let view = BasicCardFeedSnippet(title: "Fixture", summary: "Smoke test")
  #expect(view.title == "Fixture")
}
