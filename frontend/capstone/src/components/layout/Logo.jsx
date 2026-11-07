import { Link } from "react-router-dom";

const Logo = ({ className = "" }) => (
  <Link to="/" aria-label="VReality home" className={`flex items-center gap-2.5 ${className}`}>
    <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
      <path d="M9 5c0 8 14 14 14 22" fill="none" stroke="#3ddbc3" strokeWidth="3" strokeLinecap="round" />
      <path d="M23 5c0 8-14 14-14 22" fill="none" stroke="#ffb648" strokeWidth="3" strokeLinecap="round" />
    </svg>
    <span className="font-display text-lg font-semibold tracking-tight">VReality</span>
  </Link>
);

export default Logo;
