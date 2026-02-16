import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ title, children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-gorgon-card border border-gorgon-border rounded-xl p-5 ${
        onClick ? 'cursor-pointer hover:bg-gorgon-hover transition-colors' : ''
      } ${className}`}
      onClick={onClick}
    >
      {title && (
        <h3 className="font-display text-base text-gorgon-text-bright mb-3">{title}</h3>
      )}
      {children}
    </div>
  );
}
