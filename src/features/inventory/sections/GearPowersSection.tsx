import type { InventoryItem } from '@/types/inventory';
import type { BuildConfig } from '@/types/recommendations';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import type { CdnTsysPower } from '@/types/cdn/tsysclientinfo';

interface Props {
  item: InventoryItem;
  indexes: GameDataIndexes;
  build: BuildConfig;
}

/** Convert PascalCase internal name to readable text: "DeathsHoldDarknessVuln" → "Deaths Hold Darkness Vuln" */
function humanizeInternalName(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

/** Find the best matching tier for a given power tier (highest MinLevel that's still <= tier) */
function findBestTier(tsysPower: CdnTsysPower, tier: number) {
  if (!Array.isArray(tsysPower.Tiers)) return undefined;
  let best: (typeof tsysPower.Tiers)[number] | undefined;
  for (const t of tsysPower.Tiers) {
    const minLevel = t.MinLevel ?? 0;
    if (minLevel <= tier && (!best || minLevel > (best.MinLevel ?? 0))) {
      best = t;
    }
  }
  return best;
}

export function GearPowersSection({ item, indexes, build }: Props) {
  if (!item.TSysPowers || item.TSysPowers.length === 0) return null;

  const allBuildSkills = new Set([...build.primarySkills, ...build.supportSkills]);

  return (
    <div>
      <h3 className="text-xs text-gorgon-text-dim uppercase tracking-wide mb-2">
        Gear Powers ({item.TSysPowers.length})
      </h3>
      <div className="space-y-1">
        {item.TSysPowers.map((power, i) => {
          const tsysPower = indexes.tsysPowerByInternalName.get(power.Power);
          const skill = tsysPower?.Skill;
          const isBuildRelevant = skill ? allBuildSkills.has(skill) : false;
          const skillDisplayName = skill ? (indexes.skillsByInternalName.get(skill)?.Name ?? skill) : undefined;

          // Get effect description from best matching tier
          const tierData = tsysPower ? findBestTier(tsysPower, power.Tier ?? 0) : undefined;
          const effectDesc = tierData?.EffectDescs?.[0]
            ?? tsysPower?.Prefix
            ?? tsysPower?.Suffix
            ?? humanizeInternalName(power.Power);

          return (
            <div
              key={i}
              className={`flex items-start gap-2 text-sm pl-3 border-l-2 py-1 ${
                isBuildRelevant ? 'border-action-green' : 'border-gorgon-border'
              }`}
            >
              <div className="flex-1">
                <span className={isBuildRelevant ? 'text-action-green' : 'text-gorgon-text'}>
                  {effectDesc}
                </span>
                {skillDisplayName && (
                  <span className={`text-xs ml-1 ${isBuildRelevant ? 'text-action-green' : 'text-gorgon-text-dim'}`}>
                    [{skillDisplayName}]
                  </span>
                )}
              </div>
              <span className="text-xs text-gorgon-text-dim font-mono shrink-0">T{power.Tier}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
