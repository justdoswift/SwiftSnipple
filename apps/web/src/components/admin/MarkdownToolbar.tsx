import type { ReactNode } from "react";
import { Bold, Code2, Heading, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Quote, Strikethrough, Video } from "lucide-react";
import { Button, Dropdown, Toolbar } from "../../lib/heroui";

type HeadingLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type MarkdownToolbarProps = {
  headingLevel: HeadingLevel;
  labels: {
    text: string;
    heading: string;
    bold: string;
    italic: string;
    strikethrough: string;
    inlineCode: string;
    codeBlock: string;
    blockquote: string;
    bulletedList: string;
    numberedList: string;
    link: string;
    image: string;
    video: string;
    horizontalRule: string;
    normalText: string;
    headings: string[];
  };
  onHeadingChange: (level: HeadingLevel) => void;
  onBold: () => void;
  onItalic: () => void;
  onStrikethrough: () => void;
  onInlineCode: () => void;
  onCodeBlock: () => void;
  onBlockquote: () => void;
  onBulletedList: () => void;
  onNumberedList: () => void;
  onLink: () => void;
  onImage: () => void;
  onVideo: () => void;
  onHorizontalRule: () => void;
};

export default function MarkdownToolbar({
  headingLevel,
  labels,
  onHeadingChange,
  onBold,
  onItalic,
  onStrikethrough,
  onInlineCode,
  onCodeBlock,
  onBlockquote,
  onBulletedList,
  onNumberedList,
  onLink,
  onImage,
  onVideo,
  onHorizontalRule,
}: MarkdownToolbarProps) {
  const headingLabel = headingLevel === 0 ? labels.normalText : labels.headings[headingLevel - 1];

  return (
    <Toolbar aria-label={labels.text} className="admin-markdown-toolbar mb-4 flex flex-wrap gap-2 rounded-[26px] border p-2">
      <Dropdown>
        <Dropdown.Trigger aria-label={labels.heading} className="admin-markdown-toolbar-trigger min-w-[180px]">
          <span className="inline-flex items-center gap-3">
            <Heading className="h-4 w-4" />
            <span>{headingLabel}</span>
          </span>
        </Dropdown.Trigger>
        <Dropdown.Popover className="min-w-[220px]">
          <Dropdown.Menu
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[String(headingLevel)]}
            onAction={(key) => onHeadingChange(Number(key) as HeadingLevel)}
          >
            <Dropdown.Item id="0" textValue={labels.normalText}>{labels.normalText}<Dropdown.ItemIndicator /></Dropdown.Item>
            {labels.headings.map((label, index) => (
              <Dropdown.Item key={label} id={String(index + 1)} textValue={label}>
                {label}
                <Dropdown.ItemIndicator />
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <ToolbarButton label={labels.bold} icon={<Bold className="h-4 w-4" />} onPress={onBold} />
      <ToolbarButton label={labels.italic} icon={<Italic className="h-4 w-4" />} onPress={onItalic} />
      <ToolbarButton label={labels.strikethrough} icon={<Strikethrough className="h-4 w-4" />} onPress={onStrikethrough} />
      <ToolbarButton label={labels.inlineCode} icon={<Code2 className="h-4 w-4" />} onPress={onInlineCode} />
      <ToolbarButton label={labels.codeBlock} icon={<Code2 className="h-4 w-4" />} onPress={onCodeBlock} />
      <ToolbarButton label={labels.blockquote} icon={<Quote className="h-4 w-4" />} onPress={onBlockquote} />
      <ToolbarButton label={labels.bulletedList} icon={<List className="h-4 w-4" />} onPress={onBulletedList} />
      <ToolbarButton label={labels.numberedList} icon={<ListOrdered className="h-4 w-4" />} onPress={onNumberedList} />
      <ToolbarButton label={labels.link} icon={<Link2 className="h-4 w-4" />} onPress={onLink} />
      <ToolbarButton label={labels.image} icon={<ImagePlus className="h-4 w-4" />} onPress={onImage} />
      <ToolbarButton label={labels.video} icon={<Video className="h-4 w-4" />} onPress={onVideo} />
      <ToolbarButton label={labels.horizontalRule} icon={<Minus className="h-4 w-4" />} onPress={onHorizontalRule} />
    </Toolbar>
  );
}

function ToolbarButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  return (
    <Button type="button" aria-label={label} className="admin-markdown-toolbar-button" onPress={onPress}>
      {icon}
      <span className="sr-only">{label}</span>
    </Button>
  );
}
