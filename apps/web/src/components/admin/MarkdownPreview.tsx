import MarkdownRenderer from "../MarkdownRenderer";

export default function MarkdownPreview({ content }: { content: string }) {
  return <MarkdownRenderer content={content} />;
}
