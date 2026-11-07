import Navbar from "./Navbar";

/** Shared frame for signed-in pages. */
const AppPage = ({ children, wide = false }) => (
  <div className="page-glow min-h-dvh">
    <Navbar />
    <main className={`mx-auto px-4 pb-16 pt-24 sm:px-6 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>
      {children}
    </main>
  </div>
);

export default AppPage;
