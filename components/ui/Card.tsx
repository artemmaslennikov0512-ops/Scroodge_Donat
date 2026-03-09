import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article";
}

export function Card({
  as: Component = "div",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <Component
      className={`glass-cyber ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}
