import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, MessageCircleQuestion } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ButtonLink } from "../ui";

const reveal = (delay) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
});

const Hero = () => {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.14]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative flex min-h-dvh items-center overflow-hidden">
      <motion.div className="absolute inset-0" style={{ scale: videoScale }} aria-hidden>
        {reducedMotion ? (
          <img src="/media/hero-poster.jpg" alt="" className="size-full object-cover" />
        ) : (
          <video
            className="size-full object-cover"
            src="/media/hero-loop.mp4"
            poster="/media/hero-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        )}
      </motion.div>

      {/* Keeps the text readable on any screen, including where the helix sits behind it. */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/10 max-md:bg-ink/65" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative mx-auto w-full max-w-6xl px-4 py-28 sm:px-6"
      >
        <motion.p
          {...reveal(0.1)}
          className="inline-flex items-center gap-2 rounded-full border border-helix/30 bg-helix/10 px-3.5 py-1.5 text-sm font-medium text-helix"
        >
          <MessageCircleQuestion className="size-4" aria-hidden />
          Live doubts, mid-lecture
        </motion.p>

        <motion.h1
          {...reveal(0.2)}
          className="mt-6 max-w-2xl text-5xl font-semibold leading-[1.04] sm:text-6xl lg:text-7xl"
        >
          The teacher who stops <span className="text-gradient">when you're stuck.</span>
        </motion.h1>

        <motion.p {...reveal(0.32)} className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Tell VReality what you want to learn and how long you have. It builds your roadmap, then
          teaches it live on video. Interrupt with a question at any moment.
        </motion.p>

        <motion.div {...reveal(0.44)} className="mt-9 flex flex-wrap gap-3">
          <ButtonLink to={user ? "/plan" : "/signup"} size="lg">
            {user ? "Build my study plan" : "Start learning free"}
            <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-ink/40 px-7 py-3.5 font-semibold text-text backdrop-blur transition hover:border-helix/60"
          >
            See how it works
          </a>
        </motion.div>
      </motion.div>

      <motion.a
        href="#features"
        aria-label="Scroll to features"
        animate={reducedMotion ? undefined : { y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted"
      >
        <ChevronDown className="size-6" aria-hidden />
      </motion.a>
    </section>
  );
};

export default Hero;
