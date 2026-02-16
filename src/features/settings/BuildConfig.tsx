import { useState } from 'react';
import type { CharacterExport } from '@/types/character';
import type { BuildConfig } from '@/types/recommendations';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import { useAppStore } from '@/lib/store';
import { Card } from '@/shared/components/Card';

interface Props {
  character: CharacterExport;
  indexes: GameDataIndexes;
  buildConfig: BuildConfig;
}

export function BuildConfigEditor({ character, indexes, buildConfig }: Props) {
  const setBuildConfig = useAppStore((s) => s.setBuildConfig);
  const persistToDb = useAppStore((s) => s.persistToDb);

  // Get all combat skills for dropdown options
  const combatSkillOptions = [...indexes.combatSkills]
    .filter((s) => (character.Skills[s]?.Level ?? 0) > 0)
    .sort((a, b) => (character.Skills[b]?.Level ?? 0) - (character.Skills[a]?.Level ?? 0));

  const [primary1, setPrimary1] = useState(buildConfig.primarySkills[0] ?? '');
  const [primary2, setPrimary2] = useState(buildConfig.primarySkills[1] ?? '');

  function handleSave() {
    const primarySkills = [primary1, primary2].filter(Boolean);

    // Auto-detect support skills for new primary
    const supportSkills: string[] = [];
    for (const skill of combatSkillOptions) {
      if (primarySkills.includes(skill)) continue;
      const level = character.Skills[skill]?.Level ?? 0;
      if (level < 5) continue;

      let isSupport = false;
      for (const primary of primarySkills) {
        const cdnSkill = indexes.skillsByInternalName.get(primary);
        if (cdnSkill?.TSysCompatibleCombatSkills?.includes(skill) ||
            cdnSkill?.CompatibleCombatSkills?.includes(skill)) {
          isSupport = true;
          break;
        }
      }
      if (isSupport || level >= 15) {
        supportSkills.push(skill);
      }
    }

    setBuildConfig({ primarySkills, supportSkills, autoDetected: false });
    void persistToDb();
  }

  const selectClass = `bg-gorgon-dark border border-gorgon-border text-gorgon-text
    px-2.5 py-1.5 rounded text-sm outline-none`;

  return (
    <Card title="Combat Build Configuration">
      <p className="text-sm text-gorgon-text-dim mb-4">
        {buildConfig.autoDetected
          ? 'Build was auto-detected from your highest combat skills. Override below if needed.'
          : 'Custom build configuration.'}
      </p>

      <div className="flex gap-4 items-end flex-wrap">
        <div>
          <label className="text-xs text-gorgon-text-dim block mb-1">Primary Skill 1</label>
          <select value={primary1} onChange={(e) => setPrimary1(e.target.value)} className={selectClass}>
            <option value="">Select...</option>
            {combatSkillOptions.map((s) => (
              <option key={s} value={s}>{s} ({character.Skills[s]?.Level ?? 0})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gorgon-text-dim block mb-1">Primary Skill 2</label>
          <select value={primary2} onChange={(e) => setPrimary2(e.target.value)} className={selectClass}>
            <option value="">Select...</option>
            {combatSkillOptions.map((s) => (
              <option key={s} value={s}>{s} ({character.Skills[s]?.Level ?? 0})</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSave}
          className="bg-action-green-dim border border-action-green text-action-green
                     px-4 py-1.5 rounded text-sm hover:bg-action-green/20 transition-colors"
        >
          Apply
        </button>
      </div>

      {buildConfig.supportSkills.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gorgon-text-dim mb-1">Support Skills (auto-detected)</p>
          <div className="flex gap-1.5 flex-wrap">
            {buildConfig.supportSkills.map((skill) => (
              <span key={skill} className="text-xs bg-gorgon-panel text-gorgon-text-dim px-2 py-0.5 rounded">
                {skill} {character.Skills[skill]?.Level ?? 0}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
