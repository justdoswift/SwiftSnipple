import { CaseStudy, MiniCaseStudy } from "./types";

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "liquid-glass-profile-card",
    title: "Liquid Glass Profile Card",
    description: "A highly layered, frosted glass effect with dynamic shadow interactions, reimagining mobile profile components through the lens of modern spatial design.",
    category: "Cards",
    difficulty: "High",
    fidelity: "1:1",
    buildTime: "4.5h",
    source: {
      name: "@original_designer on X",
      url: "#"
    },
    featured: true,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAu89BIQZsITABgPM6zXP-L8aQOsXVhWNA1vGSkmXdkANvCJd0gtFdyhHi5-4QnaSmeHUtXvR47SdBczJ6RmXW9dssFUOlBuLYdPqkFaw-sC3hn0O9ux9HeWnODsqRhlCKBFMi5IhujVGhbYnT7yCTWB4zXI1dcEq6dVATdbHpEaG0CYRSBs7HxzUh-DQC1NTUJn8bmkLP-2utXVmXZeSQJMr-Rp6ctXfgUs10FNeLdSlIaz7h5XGo5Iv_vxib1SSLJgMiXsCac3bo",
    recreationImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOJMHzs1YdcpfJM3klu34FqASpmGccANaXPw1ziY8zpZm4uJy1qYRgEkTgulfvTIiS_WVcCEJfYqAmQI98aJTeNEzzpmwSTOyJJJSThEN5qNI0p_o7RBAHF9Q1VQy04N5479PSEwCSFUyrkBMd-BmCiU4ZBJiMpKCgavv06ignFixk3msH9ImJ5O6q6T53EVntb-O5TWVVN8lbQ1lcj4NWRzK-8_6GPu_L3hxGw0Wlz7Ind0Z68I3WGa6qwPBjBMOeRHTDaaE1C4A",
    techniques: ["CANVAS API", ".BACKGROUNDBLUR", "MASKING", "ANIMATABLEDATA"],
    processNotes: "To achieve the \"Liquid\" feel, we utilized a tiered layering system where each element contributes to the depth. The primary challenge was the glassmorphism interaction between the avatar and the background.",
    simplificationNotes: "The original design featured complex noise textures that were computationally expensive for real-time rendering. We optimized the blur radius and switched to a dynamic mesh gradient to mimic the same high-end feel without the performance hit.",
    keyDecisions: "Leveraging the Canvas API was a strategic move to handle the gesture-driven highlights. As the user's thumb moves across the card, the Canvas redrafts the radial gradient in real-time, creating a physical sense of light tracking.",
    reusablePattern: ".glassEffect(intensity: 0.4)\n.shadow(color: .black.opacity(0.1), radius: 20)",
    codeSnippet: `struct LiquidGlassCard: View {
  var body: some View {
    ZStack {
      MeshGradient(width: 3, height: 3, points: [
        [0, 0], [0.5, 0], [1, 0],
        [0, 0.5], [0.5, 0.5], [1, 0.5],
        [0, 1], [0.5, 1], [1, 1]
      ], colors: [
        .blue, .purple, .indigo,
        .cyan, .blue, .purple,
        .teal, .cyan, .blue
      ])
      
      VisualEffectView(effect: 
        UIBlurEffect(style: .systemThinMaterial))
        .mask(RoundedRectangle(cornerRadius: 32))
    }
  }
}`,
    prompt: "Create a SwiftUI view that implements a high-fidelity glassmorphism profile card. Use MeshGradient for the background and a VisualEffectView for the frosted glass overlay. Ensure the corners are rounded with a radius of 32."
  },
  {
    id: "hold-to-confirm-button",
    title: "Hold to Confirm Button",
    description: "A tactile interaction pattern for high-stakes actions, implemented with HapticFeedback and LongPressGesture.",
    category: "Buttons",
    difficulty: "Medium",
    fidelity: "1:1",
    buildTime: "2h",
    source: {
      name: "@designer on X",
      url: "#"
    },
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDo5rg2Yn02UvBMmgv_eTa0Bjws_jmrIC_om4DPqqBWAQYc-GKsFR9ugNNw-JlNHrvF_3dexuwr-aWjL_4ekbOB-gNIC9VHG1tDx2f213UpVG9JYWwDNDo-gtfrg29vzJ8gb8nuVHbiCibFXbB5vYyDDlnwzOoTJHolN4zw7Q7EauZqBcb7GJ8Z4EntxHV9KZE0A-DIu_gDdtNA3eCDYm_FDP9ct72Sud759Akft0d6Sne5Q-pji0RkYOuHpXndNT_xtakK8y13TEI",
    recreationImage: "",
    techniques: ["HAPTICFEEDBACK", "LONGPRESSGESTURE"],
    processNotes: "The key to this interaction is the progressive feedback. As the user holds, the button scales slightly and the haptic intensity increases.",
    simplificationNotes: "We used a simple ZStack with a background circle that fills up as the gesture progresses.",
    keyDecisions: "Using sensory feedback (haptics) is crucial for 'Hold to Confirm' patterns to prevent accidental triggers.",
    reusablePattern: ".onLongPressGesture(minimumDuration: 2.0, pressing: { isPressing in ... })",
    codeSnippet: `struct HoldToConfirmButton: View {
    @State private var progress: CGFloat = 0
    
    var body: some View {
        Button(action: {}) {
            Text("Hold to Confirm")
                .padding()
                .background(
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.gray.opacity(0.2))
                        Capsule().fill(Color.blue)
                            .frame(width: progress * 200)
                    }
                )
        }
        .onLongPressGesture(minimumDuration: 2) {
            // Action
        } onPressingChanged: { pressing in
            withAnimation(.linear(duration: 2)) {
                progress = pressing ? 1 : 0
            }
        }
    }
}`,
    prompt: "Implement a 'Hold to Confirm' button in SwiftUI. The button should show a progress bar filling up over 2 seconds while pressed. Use onLongPressGesture with the pressing callback to animate the progress."
  },
  {
    id: "layered-onboarding-flow",
    title: "Layered Onboarding Flow",
    description: "Multi-stage onboarding using matched geometry effects and synchronized vertical scrolling transitions.",
    category: "Onboarding",
    difficulty: "High",
    fidelity: "1:1",
    buildTime: "6h",
    source: {
      name: "@designer on X",
      url: "#"
    },
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDIu3Ac0rfIcnMpqqsIWnjuOEVFcNiZFCNN3K1-cCYf4wXdBVH15MpQLC1SxqXAZFijGbMnIwrU4hhXdQ0Q2U_0WzZM7mxeRmM7173OtlHJyrQbvT0IsKvBxDnCOKxfr4blgbZGdDwlZz_ZYpRAEyZy45XLHWbx5OYgo0RAK6Z6859iuJNPFmClosBbLxENY-gxgoWapTeIObpQ-4XYZjaENIyXVePC1kdSac-mjGGAEX78k5ail8EJ21rt1TyLO3ezlkTofB_LmmI",
    recreationImage: "",
    techniques: ["MATCHEDGEOMETRYEFFECT", "SCROLLVIEW"],
    processNotes: "We used MatchedGeometryEffect to transition elements between onboarding screens seamlessly.",
    simplificationNotes: "Instead of complex page view controllers, we used a simple ScrollView with paging enabled.",
    keyDecisions: "Prioritizing motion over static screens to keep users engaged during the setup process.",
    reusablePattern: ".matchedGeometryEffect(id: \"title\", in: namespace)",
    codeSnippet: `struct OnboardingView: View {
    @Namespace var namespace
    @State private var step = 0
    
    var body: some View {
        VStack {
            if step == 0 {
                Text("Welcome")
                    .matchedGeometryEffect(id: "title", in: namespace)
            } else {
                Text("Get Started")
                    .matchedGeometryEffect(id: "title", in: namespace)
            }
            Button("Next") { withAnimation { step += 1 } }
        }
    }
}`,
    prompt: "Create a multi-step onboarding flow in SwiftUI using MatchedGeometryEffect to animate a title between two different views. Use a @Namespace to coordinate the animation."
  }
];

export const LATEST_ADDITIONS: MiniCaseStudy[] = [
  {
    id: "compact-analytics-tile",
    title: "Compact Analytics Tile",
    category: "Charts",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD6Ui95KDQOkpJqB655Lz2rSFZL3wtGdS5piDHiYJufXr9C6VTgPfcmhoW7cTGCsAnsaNmsMuiChfrg5N7l_qXM3_2wnpDluqwhlToym4j3UMQ2GNrqHX10uKjgxJS3e7rNj43i0jBWv8ZGBga7tr9D4k__uLRaryQhuPMn3hJtX0ELhkA1QhJj87DyE2TqQbqrfcUQr6TfIUgtUI54GoNaK2gtwINF6O-wpljA5bfj9vVIZ82KCSfv8J8tTlIBKxTexPT84Vl1VdA"
  },
  {
    id: "smart-sections-panel",
    title: "Smart Sections Panel",
    category: "Settings",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAU0Wmmy2YvQk00rhf07z-ucFqeYvrafCum1mTdBHF9OKxzkDr9W0_ILIhKCMYqkuROiV8_26PHyTMQvaTG3m1p2d8V74djoevsS-y8J-CPqrvAzCiGzTcv1hhIj6yQGSjYv4qS-AgnZBma17_2Vm7fYzJRPChVn0cIt1zAmT7G1H6eOAKYicUQvdB1c5_RBJ1bQLtwH4mChMnXLi3qgD61JBK5GNVsGfG8OU057-dldNRSCAHx46Yvj55DGj5jSodmuZGMwvXDmUQ"
  },
  {
    id: "interactive-pricing-toggle",
    title: "Interactive Pricing Toggle",
    category: "Interaction",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuADYPmV5t-WZQX3ftFVgiHhFBf9oZTC4kVfzdj1wfOu1_W8jVDroFjexq35XotaVyYEF--0dWnGCnPjyYhxSzbgX-Q0of1qwxkY_yj8xJKxeUXowPT2SQOy0B9SBJ0blcRJiReQ5TPKlBc8ECuJGNnwrsrpR878i6AdJEBUcId78XWoYFeGvI3di3tZMG65jAOmw2KevMEMLGk4tTnU6OVUmhLcQE0YItPBh-k8DqFHxHf8oRTVnNXx2TNXoJTyVghwzOTe4QMZDp0"
  },
  {
    id: "metric-grid-variant",
    title: "Metric Grid Variant",
    category: "Dashboards",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmDeZlkMy_zCRtyc6R_2rb4VTRwXIAFdjNiVovs6kkfAuk9CYHD_qBCBcPk0rlO8li4OMultt7uoXZIkM0EkPORy5GkcVSC5eKsVH2ksES1MF7cnIKhflNloaWJDypMYcV0OTl9bi-tXYH3a3kGZsq31_nn0l95mXSWzT19ADFsR9VMWNsLwabUGcFeCRW1d60vTc3hs1a6wOOsz4sjeMpk2lQCaNNQtwatdg2N3wApMrfEbkOKRc6kzU3c-3lcPYUARvl9jidQuk"
  }
];
