import SwiftUI

struct SkeletonShimmerDemo: View {
  var body: some View {
    VStack(spacing: 18) {
      SkeletonShimmerView()
      SkeletonShimmerView()
    }
    .padding()
  }
}
