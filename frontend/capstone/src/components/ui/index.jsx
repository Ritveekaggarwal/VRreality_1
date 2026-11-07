import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_VARIANTS = {
  primary:
    "bg-gradient-to-r from-helix to-[#7ee8c4] text-ink shadow-[0_8px_30px_-10px] shadow-helix/60 hover:brightness-110",
  secondary: "border border-line bg-surface/70 text-text hover:border-helix/60 hover:bg-raised",
  ghost: "text-muted hover:bg-surface hover:text-text",
  danger: "border border-coral/40 bg-coral/10 text-coral hover:bg-coral/20",
};

const BUTTON_SIZES = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-5 py-3 text-[15px]",
  lg: "px-7 py-3.5 text-base",
};

const buttonClass = ({ variant = "primary", size = "md", className = "" }) =>
  `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`;

export const Button = ({ variant, size, className, loading, children, disabled, ...props }) => (
  <button
    type="button"
    className={buttonClass({ variant, size, className })}
    disabled={disabled || loading}
    {...props}
  >
    {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
    {children}
  </button>
);

export const ButtonLink = ({ variant, size, className, children, ...props }) => (
  <Link className={buttonClass({ variant, size, className })} {...props}>
    {children}
  </Link>
);

const FIELD_CLASS =
  "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-text placeholder:text-muted/60 transition focus:border-helix focus:outline-none focus:ring-2 focus:ring-helix/25 disabled:opacity-60";

export const Field = ({ label, hint, className = "", ...props }) => {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-muted">
        {label}
      </label>
      <input id={id} className={FIELD_CLASS} {...props} />
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
};

export const PasswordField = ({ label = "Password", hint, ...props }) => {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={`${FIELD_CLASS} pr-12`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted hover:text-text"
        >
          <Icon className="size-4" aria-hidden />
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
};

export const FormError = ({ children }) =>
  children ? (
    <p role="alert" className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
      {children}
    </p>
  ) : null;

export const Spinner = ({ label }) => (
  <div role="status" className="flex flex-col items-center gap-3 text-muted">
    <LoaderCircle className="size-8 animate-spin text-helix" aria-hidden />
    {label && <p className="text-sm">{label}</p>}
  </div>
);

export const FullPageSpinner = ({ label }) => (
  <div className="flex min-h-dvh items-center justify-center bg-ink">
    <Spinner label={label} />
  </div>
);

export const EmptyState = ({ icon: Icon, title, children, action }) => (
  <div className="panel mx-auto flex max-w-md flex-col items-center gap-3 p-10 text-center">
    {Icon && <Icon className="size-8 text-helix" aria-hidden />}
    <h2 className="text-2xl font-semibold">{title}</h2>
    <p className="text-muted">{children}</p>
    {action && <div className="mt-3">{action}</div>}
  </div>
);
