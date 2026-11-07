import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Smartphone, TriangleAlert } from "lucide-react";
import { api } from "../../lib/api";
import { Spinner } from "../ui";

const publicBase = () => import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

const isLocalOnly = () =>
  /^(localhost|127\.|\[::1\])/.test(new URL(publicBase()).hostname);

const PhonePanel = ({ lessonId }) => {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api(`/lesson/${lessonId}/share`, { method: "POST" })
      .then(({ token }) => active && setLink(`${publicBase()}/m/${token}`))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [lessonId]);

  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Smartphone className="size-5 text-helix" aria-hidden />
        Continue on your phone
      </h2>
      <p className="mt-1 text-sm text-muted">
        Scan to join this class and download your notes. The code works for 6 hours.
      </p>

      <div className="mt-4 flex justify-center">
        {link ? (
          <div className="rounded-xl bg-white p-3">
            <QRCode value={link} size={176} level="L" aria-label="QR code for this lesson" />
          </div>
        ) : error ? (
          <p className="text-sm text-coral">{error}</p>
        ) : (
          <Spinner />
        )}
      </div>

      {link && isLocalOnly() && (
        <p className="mt-4 flex gap-2 rounded-lg border border-amber/30 bg-amber/10 p-3 text-xs text-amber">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          This QR points to localhost, which your phone can't open. Use the deployed site, or set
          VITE_PUBLIC_APP_URL to a tunnel address.
        </p>
      )}
    </section>
  );
};

export default PhonePanel;
