import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import interFont from "@fontsource/inter/400.css?url";
import interFont500 from "@fontsource/inter/500.css?url";
import interFont600 from "@fontsource/inter/600.css?url";
import manropeFont from "@fontsource/manrope/600.css?url";
import manropeFont700 from "@fontsource/manrope/700.css?url";
import { Toaster } from "sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider } from "../lib/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('dk_theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=s==='dark'||(s!=='light'&&m);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#ffffff", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#0f1424", media: "(prefers-color-scheme: dark)" },
      { title: "DukaanAI — AI for local retailers" },
      { name: "description", content: "DukaanAI helps local retailers digitize their stores with an AI-powered assistant." },
      { property: "og:title", content: "DukaanAI — AI for local retailers" },
      { property: "og:description", content: "DukaanAI helps local retailers digitize their stores with an AI-powered assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "DukaanAI — AI for local retailers" },
      { name: "twitter:description", content: "DukaanAI helps local retailers digitize their stores with an AI-powered assistant." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/b2886f54-6d06-4a8b-ac95-84c4790c74e1" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/b2886f54-6d06-4a8b-ac95-84c4790c74e1" },
    ],
    links: [
      { rel: "stylesheet", href: interFont },
      { rel: "stylesheet", href: interFont500 },
      { rel: "stylesheet", href: interFont600 },
      { rel: "stylesheet", href: manropeFont },
      { rel: "stylesheet", href: manropeFont700 },
      { rel: "stylesheet", href: appCss },
    ],
    scripts: [
      { children: THEME_INIT_SCRIPT },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Outlet />
        <Toaster position="top-center" richColors closeButton />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

