import { type ReactNode, useLayoutEffect } from "react";
import { useOutletContext } from "react-router-dom";

export type AdminHeaderConfig = {
  start: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
};

export type AdminHeaderOutletContext = {
  setHeaderConfig: (config: AdminHeaderConfig | null) => void;
};

export function useAdminHeader(config: AdminHeaderConfig | null) {
  const context = useOutletContext<AdminHeaderOutletContext | null>();

  useLayoutEffect(() => {
    if (!context?.setHeaderConfig) return;

    context.setHeaderConfig(config);

    return () => {
      context.setHeaderConfig(null);
    };
  }, [config, context]);
}
