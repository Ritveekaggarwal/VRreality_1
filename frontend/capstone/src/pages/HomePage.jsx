import Navbar from "../components/layout/Navbar";
import About from "../components/home/About";
import Features from "../components/home/Features";
import FinalCta from "../components/home/FinalCta";
import Hero from "../components/home/Hero";
import Timeline from "../components/home/Timeline";
import Logo from "../components/layout/Logo";

const HomePage = () => (
  <div className="overflow-x-clip bg-ink">
    <Navbar />
    <main>
      <Hero />
      <Features />
      <Timeline />
      <About />
      <FinalCta />
    </main>
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
        <Logo />
        <p>Learning that listens back.</p>
      </div>
    </footer>
  </div>
);

export default HomePage;
