import { motion } from "framer-motion";
import { Ear, Footprints, ShieldCheck } from "lucide-react";

const VALUES = [
  {
    icon: Ear,
    title: "Teaching should listen",
    body: "The best moment to clear up a doubt is the moment you have it, not after the video ends.",
  },
  {
    icon: Footprints,
    title: "Foundations come first",
    body: "Hard topics get easier when you reach them in the right order, so we keep that order.",
  },
  {
    icon: ShieldCheck,
    title: "Answers need a source",
    body: "Lessons come from textbook material, and the teacher says so when that material runs out.",
  },
];

const About = () => (
  <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
    <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-amber">About us</p>
        <h2 className="mt-3 text-4xl font-semibold sm:text-5xl">
          We think a lecture should be a conversation
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          VReality began with a simple frustration: a recorded lecture carries on even when you're
          lost. So we built a classroom where a student's question comes first, starting with the
          life sciences, where one missed idea can make the next chapter impossible.
        </p>
      </motion.div>

      <ul className="space-y-4">
        {VALUES.map(({ icon: Icon, title, body }, index) => (
          <motion.li
            key={title}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="panel flex gap-4 p-6"
          >
            <Icon className="mt-1 size-6 shrink-0 text-helix" aria-hidden />
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-muted">{body}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  </section>
);

export default About;
