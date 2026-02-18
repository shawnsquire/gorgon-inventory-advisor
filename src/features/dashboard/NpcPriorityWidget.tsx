import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { Card } from '@/shared/components/Card';
import { favorColor, favorLabel } from '@/shared/utils/favor';
import { getWikiUrl } from '@/shared/utils/itemHelpers';

export function NpcPriorityWidget() {
  const npcPriorities = useAppStore((s) => s.npcPriorities);
  const indexes = useAppStore((s) => s.indexes);
  const character = useAppStore((s) => s.character);
  const inventory = useAppStore((s) => s.inventory);

  const priorityNpcs = useMemo(() => {
    if (!indexes || !character) return [];

    const priorityIds = Object.entries(npcPriorities)
      .filter(([, status]) => status === 'priority')
      .map(([id]) => id);

    if (priorityIds.length === 0) return [];

    // Build inventory keyword set for gift matching
    const inventoryKeywords = new Set<string>();
    if (inventory?.Items) {
      for (const item of inventory.Items) {
        const cdnItem = indexes.itemsByTypeId.get(item.TypeID);
        if (cdnItem?.Keywords) {
          for (const kw of cdnItem.Keywords) inventoryKeywords.add(kw);
        }
      }
    }

    return priorityIds.slice(0, 5).map((npcId) => {
      const npc = indexes.npcById.get(npcId);
      const playerNpc = character.NPCs[npcId];
      const favorLevel = playerNpc?.FavorLevel ?? 'Unknown';

      // Find top gift matches
      const gifts: string[] = [];
      if (npc?.Preferences) {
        for (const pref of npc.Preferences) {
          if (pref.Desire !== 'Like' && pref.Desire !== 'Love') continue;
          if (pref.Keywords?.some((kw) => inventoryKeywords.has(kw))) {
            // Find actual item names matching this keyword
            if (inventory?.Items) {
              for (const item of inventory.Items) {
                const cdnItem = indexes.itemsByTypeId.get(item.TypeID);
                if (cdnItem?.Keywords?.some((kw) => pref.Keywords?.includes(kw))) {
                  if (!gifts.includes(item.Name)) {
                    gifts.push(item.Name);
                    if (gifts.length >= 2) break;
                  }
                }
              }
            }
          }
          if (gifts.length >= 2) break;
        }
      }

      return {
        npcId,
        name: npc?.Name ?? npcId,
        favorLevel,
        gifts,
      };
    });
  }, [npcPriorities, indexes, character, inventory]);

  return (
    <Card title="Priority NPCs">
      {priorityNpcs.length === 0 ? (
        <div className="text-sm text-gorgon-text-dim py-2">
          <p>Star NPCs in the{' '}
            <Link to="/relationships" className="text-action-cyan hover:underline">
              Relationships
            </Link>
            {' '}page to track them here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {priorityNpcs.map((npc) => (
            <div key={npc.npcId} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gorgon-text inline-flex items-center gap-1">
                  <span className="text-action-yellow">{'\u2605'}</span>
                  {npc.name}
                  <a
                    href={getWikiUrl(npc.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-action-blue hover:text-action-blue/80 shrink-0"
                    title="View on Wiki"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </span>
                <span className={`text-xs ${favorColor(npc.favorLevel)}`}>
                  {favorLabel(npc.favorLevel)}
                </span>
              </div>
              {npc.gifts.length > 0 ? (
                <p className="text-xs text-gorgon-text-dim pl-5 truncate">
                  {'\u2665'} {npc.gifts.join(', ')}
                </p>
              ) : (
                <p className="text-xs text-gorgon-text-dim pl-5">
                  No gift matches in inventory
                </p>
              )}
            </div>
          ))}
          <Link
            to="/relationships"
            className="block text-xs text-action-cyan hover:underline pt-1"
          >
            View All &rarr;
          </Link>
        </div>
      )}
    </Card>
  );
}
