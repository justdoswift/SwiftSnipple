import type { ReactNode } from "react";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "../../lib/heroui";

interface AdminHeaderTooltipActionProps {
  content: ReactNode;
  children: ReactNode;
}

export default function AdminHeaderTooltipAction({ content, children }: AdminHeaderTooltipActionProps) {
  return (
    <TooltipRoot>
      <TooltipTrigger>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {content}
      </TooltipContent>
    </TooltipRoot>
  );
}
