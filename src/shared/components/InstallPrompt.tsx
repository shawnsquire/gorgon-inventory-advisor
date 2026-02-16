import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem('gia-install-dismissed')) {
      setDismissed(true);
      return;
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem('gia-install-dismissed', '1');
  }

  return (
    <div className="fixed bottom-4 right-4 z-50
                    bg-gorgon-panel border border-gorgon-border rounded-lg shadow-xl
                    px-4 py-3 max-w-xs animate-[fadeIn_0.3s_ease-out]">
      <p className="text-sm text-gorgon-text mb-2">
        Install Gorgon Inventory Advisor for quick access and offline use.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="text-sm bg-action-green-dim border border-action-green text-action-green
                     px-3 py-1 rounded hover:bg-action-green/20 transition-colors"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="text-sm text-gorgon-text-dim hover:text-gorgon-text transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
