import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Logo from "../layout/Logo";

const POINTS = [
  "A roadmap built from your topics and your time",
  "A live video teacher who stops for your doubts",
  "Notes ready to download, on any device",
];

const AuthLayout = ({ title, subtitle, children }) => (
  <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
    <aside className="relative hidden overflow-hidden lg:block">
      <img
        src="/media/hero-poster.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover object-[70%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
      <div className="relative flex h-full flex-col justify-between p-10">
        <Logo />
        <div>
          <h2 className="max-w-sm text-4xl font-semibold leading-tight">
            Ask anything, right in the middle of the lecture.
          </h2>
          <ul className="mt-6 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-muted">
                <Check className="mt-0.5 size-5 shrink-0 text-helix" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>

    <main className="page-glow flex items-center justify-center px-4 py-10 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Logo className="mb-8 lg:hidden" />
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </motion.div>
    </main>
  </div>
);

export default AuthLayout;
