interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-gorgon-border-light border-t-action-green rounded-full animate-spin mb-3" />
      {message && <p className="text-gorgon-text-dim text-sm">{message}</p>}
    </div>
  );
}
