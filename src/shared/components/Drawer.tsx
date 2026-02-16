import { useEffect, useRef, type ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string;
}

export function Drawer({ open, onClose, title, children, width = 'max-w-lg' }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full ${width} w-full bg-gorgon-panel border-l border-gorgon-border
                    z-50 overflow-y-auto shadow-2xl
                    animate-[slideIn_0.2s_ease-out]`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="sticky top-0 bg-gorgon-panel/95 backdrop-blur-sm border-b border-gorgon-border px-6 py-4 flex items-center justify-between z-10">
          {title && (
            <h2 className="font-display text-lg text-gorgon-text-bright">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="text-gorgon-text-dim hover:text-gorgon-text text-xl p-1 transition-colors"
            aria-label="Close"
          >
            &#10005;
          </button>
        </div>
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </>
  );
}
