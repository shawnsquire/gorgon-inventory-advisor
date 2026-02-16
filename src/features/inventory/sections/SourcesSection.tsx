import type { CdnItem } from '@/types/cdn/items';
import type { GameDataIndexes } from '@/lib/cdn-indexes';

interface Props {
  cdnItem: CdnItem | null;
  indexes: GameDataIndexes;
}

export function SourcesSection({ cdnItem, indexes }: Props) {
  if (!cdnItem?.InternalName) return null;

  const sourceData = indexes.sourcesByItem.get(cdnItem.InternalName);
  if (!sourceData?.Sources || sourceData.Sources.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs text-gorgon-text-dim uppercase tracking-wide mb-2">
        Where to Get More ({sourceData.Sources.length})
      </h3>
      <div className="space-y-1">
        {sourceData.Sources.slice(0, 8).map((source, i) => (
          <div key={i} className="text-sm text-gorgon-text-dim pl-3 border-l-2 border-gorgon-border">
            <span className="text-gorgon-text">{source.Type}</span>
            {source.Npc && <span className="ml-1">from {source.Npc}</span>}
            {source.Area && <span className="ml-1">in {source.Area}</span>}
          </div>
        ))}
        {sourceData.Sources.length > 8 && (
          <p className="text-xs text-gorgon-text-dim ml-3">
            ...and {sourceData.Sources.length - 8} more sources
          </p>
        )}
      </div>
    </div>
  );
}
