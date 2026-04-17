import type { PublicTheme } from "./public-theme";

const THEMES = {
  dark: "github-dark",
  light: "github-light",
} as const;

const LANGUAGE_ALIASES: Record<string, string> = {
  bash: "bash",
  console: "bash",
  js: "javascript",
  json: "json",
  jsx: "jsx",
  markdown: "markdown",
  md: "markdown",
  shell: "bash",
  sh: "bash",
  swift: "swift",
  ts: "typescript",
  tsx: "tsx",
  typescript: "typescript",
  javascript: "javascript",
  yaml: "yaml",
  yml: "yaml",
  zsh: "bash",
};

let highlighterPromise: Promise<{
  codeToHtml: (code: string, options: { lang: string; theme: (typeof THEMES)[PublicTheme] }) => string;
}> | null = null;

function stripShikiBackground(html: string) {
  return html.replace(/background-color:[^;"']+;?/g, "").replace(/style=";?"/g, "");
}

export function resolveMarkdownLanguage(language?: string | null) {
  if (!language) return null;
  return LANGUAGE_ALIASES[language.toLowerCase()] ?? null;
}

async function getMarkdownHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = Promise.all([
      import("shiki/core"),
      import("shiki/dist/langs/bash.mjs"),
      import("shiki/dist/langs/javascript.mjs"),
      import("shiki/dist/langs/json.mjs"),
      import("shiki/dist/langs/jsx.mjs"),
      import("shiki/dist/langs/markdown.mjs"),
      import("shiki/dist/langs/swift.mjs"),
      import("shiki/dist/langs/typescript.mjs"),
      import("shiki/dist/langs/tsx.mjs"),
      import("shiki/dist/langs/yaml.mjs"),
      import("shiki/dist/themes/github-dark.mjs"),
      import("shiki/dist/themes/github-light.mjs"),
      import("shiki/engine/javascript"),
    ]).then(
      ([
        core,
        bash,
        javascript,
        json,
        jsx,
        markdown,
        swift,
        typescript,
        tsx,
        yaml,
        githubDark,
        githubLight,
        engine,
      ]) =>
        core.createHighlighterCore({
          langs: [
            bash.default,
            javascript.default,
            json.default,
            jsx.default,
            markdown.default,
            swift.default,
            typescript.default,
            tsx.default,
            yaml.default,
          ],
          themes: [githubDark.default, githubLight.default],
          engine: engine.createJavaScriptRegexEngine(),
        }),
    );
  }

  return highlighterPromise;
}

export async function highlightMarkdownCode(code: string, language?: string | null, theme: PublicTheme = "dark") {
  const resolvedLanguage = resolveMarkdownLanguage(language);
  if (!resolvedLanguage) return null;

  const highlighter = await getMarkdownHighlighter();
  return stripShikiBackground(
    highlighter.codeToHtml(code, {
      lang: resolvedLanguage,
      theme: THEMES[theme],
    }),
  );
}
