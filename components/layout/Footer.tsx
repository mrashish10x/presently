import Link from "next/link";
import { CalendarCheck2 } from "lucide-react";

export function Footer() {
  return (
    <footer id="contact" className="border-t border-line bg-teal-950 text-white/70">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="#home" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
                <CalendarCheck2 className="h-4.5 w-4.5 text-white" />
              </span>
              <span className="font-display text-[17px] font-semibold text-white">
                Presently
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/45 max-w-[220px]">
              Attendance management built for schools and colleges that would rather
              spend time teaching than tallying registers.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-white/40 mb-3.5">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white">How it works</a></li>
              <li><Link href="/login" className="hover:text-white">Log in</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-white/40 mb-3.5">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#about" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Privacy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-white/40 mb-3.5">
              Contact
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>hello@presently.app</li>
              <li>+91 98765 43210</li>
              <li>Meerut, Uttar Pradesh</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Presently Technologies. All rights reserved.</p>
          <p>Built for demo purposes — frontend only.</p>
        </div>
      </div>
    </footer>
  );
}
