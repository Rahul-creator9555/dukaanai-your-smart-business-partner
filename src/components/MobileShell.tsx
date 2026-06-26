import type { ReactNode } from "react";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-surface">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-6 py-8 shadow-elevation-1 sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-3xl">
        {children}
      </div>
    </div>
  );
}
