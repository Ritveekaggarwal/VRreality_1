import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ButtonLink } from "../ui";

const FinalCta = () => {
  const { user } = useAuth();

  return (
    <section className="px-4 pb-24 sm:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-6xl rounded-3xl border border-helix/30 bg-gradient-to-br from-helix/20 via-surface to-amber/15 px-6 py-16 text-center"
      >
        <h2 className="text-4xl font-semibold sm:text-5xl">What do you want to learn first?</h2>
        <p className="mx-auto mt-4 max-w-lg text-lg text-muted">
          Your first roadmap is a few topics away.
        </p>
        <ButtonLink to={user ? "/plan" : "/signup"} size="lg" className="mt-8">
          Build my roadmap
          <ArrowRight className="size-5" aria-hidden />
        </ButtonLink>
      </motion.div>
    </section>
  );
};

export default FinalCta;
