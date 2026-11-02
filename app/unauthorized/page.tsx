import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sand-50 px-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold text-ink">
          Access Denied
        </h1>

        <p className="mt-3 text-sm text-ink-soft">
          You do not have permission to access this page.
        </p>

        <Link
          href="/login"
          className="mt-6 inline-flex rounded-lg bg-teal-800 px-5 py-3 text-sm font-medium text-white hover:bg-teal-900"
        >
          Return to Login
        </Link>
      </div>
    </main>
  );
}