// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "BasicCardFeedSnippet",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "BasicCardFeedSnippet", targets: ["BasicCardFeedSnippet"])
    ],
    targets: [
        .target(
            name: "BasicCardFeedSnippet",
            path: "Sources"
        ),
        .testTarget(
            name: "BasicCardFeedSnippetTests",
            dependencies: ["BasicCardFeedSnippet"],
            path: "Tests"
        )
    ]
)
