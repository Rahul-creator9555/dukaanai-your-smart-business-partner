import type { ReactNode } from "react";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-surface">
      <main
        className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-6 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-[max(env(safe-area-inset-top),2rem)] shadow-elevation-1 sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:pt-8"
      >
        {children}
      </main>
    </div>
  );
}
