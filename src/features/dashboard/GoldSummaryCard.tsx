import type { InventoryItem } from '@/types/inventory';
import type { Recommendation } from '@/types/recommendations';
import { Card } from '@/shared/components/Card';
import { formatGold } from '@/shared/utils/formatting';

type AnalyzedItem = InventoryItem & { recommendation: Recommendation };

interface Props {
  analyzed: AnalyzedItem[];
}

export function GoldSummaryCard({ analyzed }: Props) {
  let recoverableGold = 0;
  const topSellItems: Array<{ name: string; value: number }> = [];

  for (const item of analyzed) {
    const actionType = item.recommendation.action.type;
    if (actionType === 'SELL_ALL') {
      const total = item.Value * item.StackSize;
      recoverableGold += total;
      topSellItems.push({ name: item.Name, value: total });
    } else if (actionType === 'SELL_SOME') {
      const keepQty = item.recommendation.keepQuantity ?? 0;
      const sellQty = Math.max(0, item.StackSize - keepQty);
      const total = sellQty * item.Value;
      recoverableGold += total;
      if (total > 0) {
        topSellItems.push({ name: item.Name, value: total });
      }
    }
  }

  topSellItems.sort((a, b) => b.value - a.value);
  const top5 = topSellItems.slice(0, 5);

  return (
    <Card title="Recoverable Gold">
      <div className="text-3xl font-mono text-action-yellow font-bold mb-3">
        ~{formatGold(recoverableGold)}
      </div>
      {top5.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gorgon-text-dim uppercase tracking-wide mb-1">Top sell items</p>
          {top5.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gorgon-text truncate mr-2">{item.name}</span>
              <span className="text-action-yellow font-mono shrink-0">{formatGold(item.value)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
