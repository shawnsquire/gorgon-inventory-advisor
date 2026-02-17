import { useState, useEffect, type ReactNode } from 'react';

interface OverflowModalProps {
  /** Number of hidden items */
  overflowCount: number;
  /** Label for the trigger (e.g., "more", "more NPCs", "more sources") */
  label?: string;
  children: ReactNode;
  title?: string;
}

/**
 * Replaces static "...and X more" text with a clickable trigger
 * that opens a scrollable modal showing all items.
 */
export function OverflowModal({ overflowCount, label = 'more', children, title }: OverflowModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-action-blue hover:underline cursor-pointer"
      >
        ...and {overflowCount} {label}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed inset-x-4 top-[10%] bottom-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg
                        bg-gorgon-panel border border-gorgon-border rounded-lg shadow-2xl z-50
                        flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gorgon-border shrink-0">
              {title && (
                <h3 className="font-display text-sm text-gorgon-text-bright">{title}</h3>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gorgon-text-dim hover:text-gorgon-text text-lg p-1 ml-auto"
                aria-label="Close"
              >
                &#10005;
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-3 flex-1">
              {children}
            </div>
          </div>
        </>
      )}
    </>
  );
}
