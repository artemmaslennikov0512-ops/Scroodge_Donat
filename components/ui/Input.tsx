import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    const base =
      "w-full px-4 py-2 bg-black/30 border rounded-lg text-white focus:outline-none transition placeholder:text-gray-500";
    const border = error
      ? "border-red-500/50 focus:border-red-400"
      : "border-amber-500/30 focus:border-amber-400";
    return (
      <input
        ref={ref}
        className={`${base} ${border} ${className}`.trim()}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
