import type { InventoryItem } from '@/types/inventory';
import type { BuildConfig } from '@/types/recommendations';
import type { GameDataIndexes } from '@/lib/cdn-indexes';

interface Props {
  item: InventoryItem;
  indexes: GameDataIndexes;
  build: BuildConfig;
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

          // Get effect description from tier data
          const tierData = tsysPower?.Tiers?.find((t) => t.MinLevel != null && (t.MinLevel ?? 0) <= (power.Tier ?? 0));
          const effectDesc = tierData?.EffectDescs?.[0] ?? tsysPower?.Prefix ?? tsysPower?.Suffix ?? power.Power;

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
                {skill && (
                  <span className={`text-xs ml-1 ${isBuildRelevant ? 'text-action-green' : 'text-gorgon-text-dim'}`}>
                    [{skill}]
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
