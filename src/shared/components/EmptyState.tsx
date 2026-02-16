interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export function EmptyState({ icon = '?', title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="text-4xl mb-3 opacity-40">{icon}</div>
      <p className="text-gorgon-text text-base font-medium mb-1">{title}</p>
      {description && (
        <p className="text-gorgon-text-dim text-sm">{description}</p>
      )}
    </div>
  );
}
