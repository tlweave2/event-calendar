import Link from "next/link";

export default function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="app-ui flex min-h-screen flex-col">
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
          <Link href="/" className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--app-serif)" }}>
            Eventful
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-5 py-12 sm:py-20">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
          <div className="mt-8 border-t border-gray-900 pt-6">{children}</div>
          {footer && <div className="mt-8 text-sm text-gray-600">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
