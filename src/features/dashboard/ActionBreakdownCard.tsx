import { useNavigate } from 'react-router-dom';
import type { InventoryItem } from '@/types/inventory';
import type { Recommendation, ActionType } from '@/types/recommendations';
import { ACTIONS } from '@/types/recommendations';
import { Card } from '@/shared/components/Card';

type AnalyzedItem = InventoryItem & { recommendation: Recommendation };

interface Props {
  analyzed: AnalyzedItem[];
}

const ACTION_COLORS: Record<ActionType, string> = {
  KEEP: 'bg-action-green',
  SELL_ALL: 'bg-action-red',
  SELL_SOME: 'bg-action-yellow',
  DISENCHANT: 'bg-action-purple',
  USE: 'bg-action-cyan',
  QUEST: 'bg-action-blue',
  LEVEL_LATER: 'bg-action-orange',
  EVALUATE: 'bg-gorgon-text-dim',
  INGREDIENT: 'bg-action-green',
  DEPLOY: 'bg-action-cyan',
  GIFT: 'bg-action-purple',
};

const ACTION_TEXT_COLORS: Record<ActionType, string> = {
  KEEP: 'text-action-green',
  SELL_ALL: 'text-action-red',
  SELL_SOME: 'text-action-yellow',
  DISENCHANT: 'text-action-purple',
  USE: 'text-action-cyan',
  QUEST: 'text-action-blue',
  LEVEL_LATER: 'text-action-orange',
  EVALUATE: 'text-gorgon-text-dim',
  INGREDIENT: 'text-action-green',
  DEPLOY: 'text-action-cyan',
  GIFT: 'text-action-purple',
};

export function ActionBreakdownCard({ analyzed }: Props) {
  const navigate = useNavigate();

  // Count by action type
  const counts: Partial<Record<ActionType, number>> = {};
  for (const item of analyzed) {
    const type = item.recommendation.action.type;
    counts[type] = (counts[type] ?? 0) + 1;
  }

  const sorted = Object.entries(counts)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0)) as [ActionType, number][];

  const total = analyzed.length;

  return (
    <Card title="Action Breakdown">
      <div className="space-y-2">
        {sorted.map(([actionType, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          const action = ACTIONS[actionType];
          return (
            <button
              key={actionType}
              onClick={() => navigate(`/inventory?action=${actionType}`)}
              className="w-full flex items-center gap-2 hover:bg-gorgon-hover rounded-md px-2 py-1 transition-colors text-left"
            >
              <span className={`text-sm font-mono w-8 text-right ${ACTION_TEXT_COLORS[actionType]}`}>
                {count}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs">{action.icon}</span>
                  <span className="text-sm text-gorgon-text">{action.label}</span>
                </div>
                <div className="w-full h-1.5 bg-gorgon-dark rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${ACTION_COLORS[actionType]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
