import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  Download,
  ListPlus,
  MessageCircleQuestion,
  Route,
  UserPlus,
  Video,
} from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    title: "Create your account",
    body: "Sign up with your email or continue with Google. It takes about a minute.",
  },
  {
    icon: ListPlus,
    title: "Tell us what to teach",
    body: "Add up to six topics, then choose your study time, pace and teaching style.",
  },
  {
    icon: Route,
    title: "Get your roadmap",
    body: "The AI turns your topics into ordered chapters. Only the first one starts unlocked.",
  },
  {
    icon: Video,
    title: "Join your live class",
    body: "Open a chapter and your AI teacher starts the lecture on video.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Stop and ask",
    body: "Stuck? Ask out loud or type your doubt. You get an answer before the lesson moves on.",
  },
  {
    icon: Download,
    title: "Take it with you",
    body: "Finish to unlock the next chapter. Download your notes, or scan the QR code to continue on your phone.",
  },
];

const Step = ({ step, index }) => {
  const { icon: Icon, title, body } = step;
  const onLeft = index % 2 === 0;

  return (
    <li className="relative grid items-center gap-4 pl-16 md:grid-cols-2 md:gap-20 md:pl-0">
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-35% 0px -35% 0px" }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="absolute left-0 top-6 z-10 flex size-12 items-center justify-center rounded-full border-2 border-helix bg-ink font-display text-lg font-semibold text-helix md:left-1/2 md:top-1/2 md:-ml-6 md:-mt-6"
      >
        {index + 1}
      </motion.span>

      <motion.article
        initial={{ opacity: 0, x: onLeft ? -48 : 48 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-25% 0px -25% 0px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`panel p-6 ${onLeft ? "" : "md:col-start-2"}`}
      >
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-amber">
          <Icon className="size-4" aria-hidden />
          Step {index + 1}
        </p>
        <h3 className="mt-2 text-2xl font-semibold">{title}</h3>
        <p className="mt-2 leading-relaxed text-muted">{body}</p>
      </motion.article>
    </li>
  );
};

const Timeline = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 60%"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section id="how-it-works" className="scroll-mt-20 bg-abyss py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-4xl font-semibold sm:text-5xl">How it works</h2>
          <p className="mt-4 text-lg text-muted">From first sign-in to finished notes, in six steps.</p>
        </motion.div>

        <div ref={ref} className="relative mt-16">
          {/* The line fills in as you scroll. */}
          <div className="absolute bottom-0 left-6 top-0 w-0.5 -translate-x-1/2 bg-line md:left-1/2">
            <motion.div
              style={{ scaleY: progress }}
              className="size-full origin-top bg-gradient-to-b from-helix to-amber"
            />
          </div>

          <ol className="space-y-10 md:space-y-16">
            {STEPS.map((step, index) => (
              <Step key={step.title} step={step} index={index} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default Timeline;
