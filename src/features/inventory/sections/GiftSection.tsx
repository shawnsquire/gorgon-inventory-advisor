import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { InventoryItem } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { CdnItem } from '@/types/cdn/items';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import { analyzeGiftPotential, type GiftSuggestion } from '@/features/recommendations/giftAnalysis';
import { favorRank } from '@/shared/utils/favor';
import { OverflowModal } from '@/shared/components/OverflowModal';

interface Props {
  item: InventoryItem;
  cdnItem: CdnItem | null;
  character: CharacterExport;
  indexes: GameDataIndexes;
}

export function GiftSection({ item, cdnItem, character, indexes }: Props) {
  const [showUnmet, setShowUnmet] = useState(false);

  const suggestions = analyzeGiftPotential(item, cdnItem ?? undefined, character, indexes);

  const { met, unmet } = useMemo(() => {
    const metList = suggestions.filter((s) => s.playerFavor !== 'Unknown');
    const unmetList = suggestions.filter((s) => s.playerFavor === 'Unknown');

    // Sort met NPCs: Love first, then by favor rank descending, then by pref
    metList.sort((a, b) => {
      if (a.desire === 'Love' && b.desire !== 'Love') return -1;
      if (b.desire === 'Love' && a.desire !== 'Love') return 1;
      const aRank = favorRank(a.playerFavor);
      const bRank = favorRank(b.playerFavor);
      if (aRank !== bRank) return bRank - aRank;
      return b.pref - a.pref;
    });

    // Sort unmet by desire then pref
    unmetList.sort((a, b) => {
      if (a.desire === 'Love' && b.desire !== 'Love') return -1;
      if (b.desire === 'Love' && a.desire !== 'Love') return 1;
      return b.pref - a.pref;
    });

    return { met: metList, unmet: unmetList };
  }, [suggestions]);

  if (met.length === 0 && unmet.length === 0) return null;

  const visible = showUnmet ? [...met, ...unmet] : met;

  return (
    <div>
      <h3 className="text-xs text-gorgon-text-dim uppercase tracking-wide mb-2">
        NPC Gift Potential ({met.length}{unmet.length > 0 ? ` + ${unmet.length} unmet` : ''})
      </h3>
      <div className="space-y-1">
        {visible.slice(0, 5).map((s, i) => (
          <NpcGiftRow key={i} suggestion={s} />
        ))}
        {visible.length > 5 && (
          <OverflowModal overflowCount={visible.length - 5} label="more NPCs" title="NPC Gift Potential">
            <div className="space-y-1">
              {visible.map((s, i) => (
                <NpcGiftRow key={i} suggestion={s} />
              ))}
            </div>
          </OverflowModal>
        )}
      </div>
      {!showUnmet && unmet.length > 0 && (
        <button
          onClick={() => setShowUnmet(true)}
          className="text-xs text-action-blue hover:underline mt-2"
        >
          Show {unmet.length} unmet NPC{unmet.length !== 1 ? 's' : ''}
        </button>
      )}
      {showUnmet && unmet.length > 0 && (
        <button
          onClick={() => setShowUnmet(false)}
          className="text-xs text-gorgon-text-dim hover:underline mt-2"
        >
          Hide unmet NPCs
        </button>
      )}
    </div>
  );
}

function NpcGiftRow({ suggestion: s }: { suggestion: GiftSuggestion }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div>
        <Link
          to={`/relationships/${encodeURIComponent(s.npcId)}`}
          className={`font-medium hover:underline ${s.desire === 'Love' ? 'text-action-purple' : 'text-gorgon-text'}`}
        >
          {s.npcName}
        </Link>
        <span className="text-gorgon-text-dim ml-1">
          {s.desire}s this
        </span>
      </div>
      <span className="text-xs text-gorgon-text-dim">{s.playerFavor}</span>
    </div>
  );
}
