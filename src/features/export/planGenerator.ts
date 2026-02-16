import type { InventoryItem } from '@/types/inventory';
import type { Recommendation, ActionType } from '@/types/recommendations';
import { ACTIONS } from '@/types/recommendations';
import { formatGold } from '@/shared/utils/formatting';

type AnalyzedItem = InventoryItem & { recommendation: Recommendation };

const ACTION_ORDER: ActionType[] = [
  'SELL_ALL', 'SELL_SOME', 'DISENCHANT', 'USE', 'GIFT',
  'LEVEL_LATER', 'EVALUATE', 'INGREDIENT', 'DEPLOY', 'QUEST', 'KEEP',
];

export function generateTextPlan(items: AnalyzedItem[], characterName: string): string {
  const lines: string[] = [];
  lines.push(`=== ${characterName}'s Inventory Action Plan ===`);
  lines.push(`Generated: ${new Date().toLocaleDateString()}`);
  lines.push(`Total items: ${items.length}`);
  lines.push('');

  // Group by action type
  const groups = new Map<ActionType, AnalyzedItem[]>();
  for (const item of items) {
    const type = item.recommendation.action.type;
    const group = groups.get(type);
    if (group) group.push(item);
    else groups.set(type, [item]);
  }

  for (const actionType of ACTION_ORDER) {
    const group = groups.get(actionType);
    if (!group || group.length === 0) continue;

    const action = ACTIONS[actionType];
    lines.push(`--- ${action.icon} ${action.label} (${group.length} items) ---`);

    // Sort by vault then name
    group.sort((a, b) =>
      (a.StorageVault ?? '').localeCompare(b.StorageVault ?? '') || a.Name.localeCompare(b.Name),
    );

    let currentVault = '';
    for (const item of group) {
      if ((item.StorageVault ?? '') !== currentVault) {
        currentVault = item.StorageVault ?? '';
        lines.push(`  [${currentVault}]`);
      }

      const qty = item.StackSize > 1 ? ` x${item.StackSize}` : '';
      const value = item.Value * item.StackSize;
      const valueStr = value > 0 ? ` (${formatGold(value)})` : '';
      lines.push(`    ${item.Name}${qty}${valueStr}`);
      lines.push(`      -> ${item.recommendation.summary}`);
    }
    lines.push('');
  }

  // Summary
  let sellGold = 0;
  for (const item of items) {
    const type = item.recommendation.action.type;
    if (type === 'SELL_ALL') {
      sellGold += item.Value * item.StackSize;
    } else if (type === 'SELL_SOME') {
      const keepQty = item.recommendation.keepQuantity ?? 0;
      const sellQty = Math.max(0, item.StackSize - keepQty);
      sellGold += sellQty * item.Value;
    }
  }
  lines.push(`=== Estimated recoverable gold: ~${formatGold(sellGold)} ===`);

  return lines.join('\n');
}

export function generateCsvPlan(items: AnalyzedItem[]): string {
  const headers = ['Action', 'Item Name', 'Vault', 'Category', 'Quantity', 'Value Each', 'Total Value', 'Reason', 'Rarity', 'Level', 'Gear Score'];
  const rows = [headers.join(',')];

  const sorted = [...items].sort((a, b) =>
    ACTION_ORDER.indexOf(a.recommendation.action.type) - ACTION_ORDER.indexOf(b.recommendation.action.type),
  );

  for (const item of sorted) {
    const rec = item.recommendation;
    const row = [
      rec.action.label,
      `"${item.Name.replace(/"/g, '""')}"`,
      `"${item.StorageVault}"`,
      `"${rec.category}"`,
      item.StackSize,
      item.Value,
      item.Value * item.StackSize,
      `"${rec.summary.replace(/"/g, '""')}"`,
      item.Rarity ?? '',
      item.Level ?? '',
      rec.gearScore ?? '',
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
