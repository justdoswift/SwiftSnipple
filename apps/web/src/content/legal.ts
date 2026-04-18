import type { AppLocale } from "../types";

const privacyPolicyEN = `# Privacy Policy

Just Do Swift  • Thu Jun 05 2025  • #Support

Just Do Swift (“we”, “us”, or “our”) provides digital products and content for iOS developers, including newsletters, eBooks, and SwiftUI components (collectively, the “Service”).

This Privacy Policy explains how we collect, use, share, and protect your personal information, and describes your rights and choices in accordance with applicable data protection laws.

* * *

## 1. Information We Collect

We collect the following types of personal information:

- Account Information: Name, email address, and any other information you voluntarily provide (e.g., during checkout or newsletter subscription).
- Payment Information: Processed securely by Stripe, Inc. We do not store payment card details.
- Usage Data: Information about how you use the Service (e.g., page visits, content viewed, IP address, browser/device type).
- Communication Data: When you contact us via email or forms, we may collect and store the messages.

* * *

## 2. How We Use Your Information

We use your information to:

- Deliver our products and manage your subscriptions.
- Communicate with you regarding purchases, updates, and announcements.
- Improve our content and website functionality.
- Comply with legal obligations.

We may send marketing messages with your consent, and you can unsubscribe at any time.

* * *

## 3. Sharing and Disclosure

We only share personal data as needed with:

- Service Providers: Such as hosting platforms, payment processors (Stripe), email services, and analytics providers.
- Legal Authorities: If required by law or to protect our rights.
- Business Transfers: In case of a merger, acquisition, or asset sale, your data may be transferred.

We do not sell your personal data.
`;

const privacyPolicyZH = `# 隐私政策

Just Do Swift  • 2025年6月5日  • #Support

Just Do Swift（“我们”）为 iOS 开发者提供数字产品与内容，包括 Newsletter、电子书与 SwiftUI 组件（统称为“服务”）。

本隐私政策说明我们如何收集、使用、共享与保护你的个人信息，以及你依据适用数据保护法律所享有的权利与选择。

* * *

## 1. 我们收集的信息

我们可能收集以下类型的个人信息：

- 账户信息：姓名、邮箱地址，以及你主动提交的其他信息（例如购买或订阅时）。
- 支付信息：由 Stripe 等第三方安全处理，我们不会直接保存完整银行卡信息。
- 使用数据：例如页面访问、浏览内容、IP 地址、浏览器/设备类型等。
- 沟通数据：当你通过邮件或表单联系我们时，我们可能会保存相应消息内容。

* * *

## 2. 我们如何使用你的信息

我们会将这些信息用于：

- 交付产品并管理订阅。
- 就购买、更新与重要通知与你沟通。
- 改进内容与网站功能。
- 履行法律义务。

在你同意的情况下，我们也可能发送营销信息；你可以随时退订。

* * *

## 3. 共享与披露

我们只会在必要时与以下对象共享数据：

- 服务提供方：如托管平台、支付处理方（Stripe）、邮件服务和分析服务。
- 法律机构：当法律要求或为保护我们的权利时。
- 业务转移：如发生合并、收购或资产出售，数据可能作为交易的一部分被转移。

我们不会出售你的个人数据。
`;

const termsEN = `# Terms of Service

Just Do Swift  • Thu Jun 05 2025  • #Support

These Terms and Conditions (“Terms”) govern your use of the products and services provided by Just Do Swift, LLC (“we,” “us,” or “our”). By purchasing or accessing our digital content, you agree to be bound by these Terms.

* * *

## 1. Products and Services

We provide digital products, including but not limited to:

- Paid and free newsletters
- SwiftUI tutorial eBooks and guides
- Reusable Xcode components and UI templates
- Downloadable project files
- Subscription-based access to digital content

All products are provided “as is” and are subject to the terms below.
`;

const termsZH = `# 服务条款

Just Do Swift  • 2025年6月5日  • #Support

本条款用于约束你对 Just Do Swift, LLC（“我们”）所提供产品与服务的使用。购买或访问我们的数字内容，即表示你同意受这些条款约束。

* * *

## 1. 产品与服务

我们提供的数字产品包括但不限于：

- 付费与免费的 Newsletter
- SwiftUI 教程电子书与指南
- 可复用的 Xcode 组件与 UI 模板
- 可下载项目文件
- 基于订阅的数字内容访问

所有产品均按“现状”提供，并受以下条款约束。
`;

export const legalContent = {
  privacy: {
    en: privacyPolicyEN,
    zh: privacyPolicyZH,
  },
  terms: {
    en: termsEN,
    zh: termsZH,
  },
} satisfies Record<string, Record<AppLocale, string>>;
