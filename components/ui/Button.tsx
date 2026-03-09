import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "px-4 py-2 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary:
      "bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:shadow-[0_0_30px_rgba(251,191,36,0.7)]",
    secondary:
      "bg-transparent border-2 border-cyan-400 text-white hover:bg-cyan-400/10",
  };
  return (
    <button
      className={`${base} ${styles[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
