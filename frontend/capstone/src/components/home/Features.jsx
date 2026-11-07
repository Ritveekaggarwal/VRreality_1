import { motion } from "framer-motion";
import {
  BookOpenCheck,
  FileText,
  LockKeyhole,
  MessageCircleQuestion,
  Route,
  Smartphone,
} from "lucide-react";

const FEATURES = [
  {
    icon: MessageCircleQuestion,
    title: "Ask mid-sentence",
    body: "Speak or type a doubt while the lecture is running. Your teacher answers on the spot, then carries on where it left off.",
    wide: true,
    accent: true,
  },
  {
    icon: Route,
    title: "A roadmap made for you",
    body: "Add up to six topics and your available time. Chapters arrive in the order they make sense.",
  },
  {
    icon: LockKeyhole,
    title: "One step at a time",
    body: "Each chapter unlocks when you finish the one before it, so nothing gets skipped.",
  },
  {
    icon: BookOpenCheck,
    title: "Grounded in textbooks",
    body: "Lessons draw on 1,326 passages from biochemistry, cell biology and genetics textbooks.",
  },
  {
    icon: FileText,
    title: "Notes that write themselves",
    body: "Every lesson becomes a clean PDF, including the doubts you asked along the way.",
  },
  {
    icon: Smartphone,
    title: "Move to your phone",
    body: "Scan one QR code to carry on the class and save your notes on your phone. No sign-in needed there.",
    wide: true,
  },
];

const Features = () => (
  <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl"
    >
      <h2 className="text-4xl font-semibold sm:text-5xl">A classroom built around your questions</h2>
      <p className="mt-4 text-lg text-muted">
        Recorded lectures can't hear you. This one can, and everything else follows from that.
      </p>
    </motion.div>

    <div className="mt-12 grid gap-4 md:grid-cols-3">
      {FEATURES.map(({ icon: Icon, title, body, wide, accent }, index) => (
        <motion.article
          key={title}
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
          className={`panel p-7 ${wide ? "md:col-span-2" : ""} ${
            accent ? "bg-gradient-to-br from-helix/15 via-surface/80 to-amber/10" : ""
          }`}
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-helix/10 text-helix">
            <Icon className="size-5" aria-hidden />
          </span>
          <h3 className="mt-5 text-xl font-semibold">{title}</h3>
          <p className="mt-2 leading-relaxed text-muted">{body}</p>
        </motion.article>
      ))}
    </div>
  </section>
);

export default Features;
