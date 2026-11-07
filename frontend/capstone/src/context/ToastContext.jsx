import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, CircleCheck, Info } from "lucide-react";

const ToastContext = createContext(null);

const STYLES = {
  success: { Icon: CircleCheck, color: "text-helix" },
  error: { Icon: CircleAlert, color: "text-coral" },
  info: { Icon: Info, color: "text-amber" },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const show = useCallback((message, type = "info") => {
    const id = (nextId.current += 1);
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const value = useMemo(
    () => ({
      success: (message) => show(message, "success"),
      error: (message) => show(message, "error"),
      info: (message) => show(message, "info"),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:left-auto sm:right-6 sm:items-end"
      >
        <AnimatePresence>
          {toasts.map(({ id, message, type }) => {
            const { Icon, color } = STYLES[type];
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex max-w-sm items-start gap-3 rounded-xl border border-line bg-raised px-4 py-3 text-sm shadow-xl"
              >
                <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} aria-hidden />
                <span>{message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);
