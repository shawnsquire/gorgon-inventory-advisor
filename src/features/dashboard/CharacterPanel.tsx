import type { CharacterExport } from '@/types/character';
import type { BuildConfig } from '@/types/recommendations';
import { Card } from '@/shared/components/Card';
import { formatSkillLevel } from '@/shared/utils/formatting';
import { favorRank, favorColor, favorLabel } from '@/shared/utils/favor';

interface Props {
  character: CharacterExport;
  build: BuildConfig;
}

export function CharacterPanel({ character, build }: Props) {
  // Get top favor NPCs
  const npcFavors = Object.entries(character.NPCs)
    .filter(([, data]) => data.FavorLevel !== 'Neutral')
    .sort((a, b) => favorRank(b[1].FavorLevel) - favorRank(a[1].FavorLevel))
    .slice(0, 5);

  return (
    <Card title="Character Summary">
      <div className="space-y-4">
        {/* Build */}
        <div>
          <p className="text-xs text-gorgon-text-dim uppercase tracking-wide mb-1">
            Active Build {build.autoDetected && '(auto-detected)'}
          </p>
          <div className="flex gap-2 flex-wrap">
            {build.primarySkills.map((skill) => (
              <span key={skill} className="text-sm text-action-green bg-action-green-dim px-2 py-0.5 rounded">
                {skill} {formatSkillLevel(
                  character.Skills[skill]?.Level ?? 0,
                  character.Skills[skill]?.BonusLevels ?? 0,
                )}
              </span>
            ))}
          </div>
          {build.supportSkills.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-1">
              {build.supportSkills.map((skill) => (
                <span key={skill} className="text-xs text-gorgon-text-dim bg-gorgon-card px-2 py-0.5 rounded">
                  {skill} {character.Skills[skill]?.Level ?? 0}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quests */}
        <div>
          <p className="text-xs text-gorgon-text-dim uppercase tracking-wide mb-1">Active Quests</p>
          <p className="text-sm text-gorgon-text">{character.ActiveQuests.length} quests active</p>
        </div>

        {/* Top NPC Favors */}
        {npcFavors.length > 0 && (
          <div>
            <p className="text-xs text-gorgon-text-dim uppercase tracking-wide mb-1">Top NPC Relationships</p>
            <div className="space-y-0.5">
              {npcFavors.map(([npcId, data]) => (
                <div key={npcId} className="flex justify-between text-sm">
                  <span className="text-gorgon-text truncate">
                    {npcId.replace(/^NPC_/, '').replace(/([a-z])([A-Z])/g, '$1 $2')}
                  </span>
                  <span className={`text-xs shrink-0 ${favorColor(data.FavorLevel)}`}>
                    {favorLabel(data.FavorLevel)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
