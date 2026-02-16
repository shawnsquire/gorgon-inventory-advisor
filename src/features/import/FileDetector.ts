import type { InventoryExport } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';

export type FileType = 'inventory' | 'character' | 'unknown';

export interface DetectionResult {
  type: FileType;
  data: InventoryExport | CharacterExport | null;
  error?: string;
  summary?: string;
}

export function detectFileType(json: unknown): FileType {
  if (!json || typeof json !== 'object') return 'unknown';
  const obj = json as Record<string, unknown>;

  if (obj.Report === 'Storage' && Array.isArray(obj.Items)) {
    return 'inventory';
  }
  if (obj.Report === 'CharacterSheet' && typeof obj.Skills === 'object') {
    return 'character';
  }
  return 'unknown';
}

export function validateInventory(json: unknown): { valid: boolean; error?: string } {
  if (!json || typeof json !== 'object') return { valid: false, error: 'Not a valid JSON object' };
  const obj = json as Record<string, unknown>;

  if (obj.Report !== 'Storage') return { valid: false, error: 'Missing Report: "Storage"' };
  if (!Array.isArray(obj.Items)) return { valid: false, error: 'Missing Items array' };
  if (typeof obj.Character !== 'string') return { valid: false, error: 'Missing Character name' };

  const items = obj.Items as unknown[];
  if (items.length === 0) return { valid: false, error: 'Items array is empty' };

  // Spot-check first item
  const first = items[0] as Record<string, unknown>;
  if (typeof first.TypeID !== 'number') return { valid: false, error: 'Items missing TypeID' };
  if (typeof first.Name !== 'string') return { valid: false, error: 'Items missing Name' };

  return { valid: true };
}

export function validateCharacter(json: unknown): { valid: boolean; error?: string } {
  if (!json || typeof json !== 'object') return { valid: false, error: 'Not a valid JSON object' };
  const obj = json as Record<string, unknown>;

  if (obj.Report !== 'CharacterSheet') return { valid: false, error: 'Missing Report: "CharacterSheet"' };
  if (typeof obj.Skills !== 'object') return { valid: false, error: 'Missing Skills object' };
  if (typeof obj.Character !== 'string') return { valid: false, error: 'Missing Character name' };

  return { valid: true };
}

export function generateImportSummary(data: InventoryExport | CharacterExport): string {
  if ('Items' in data) {
    const inv = data as InventoryExport;
    const vaults = new Set(inv.Items.map((i) => i.StorageVault ?? '__PlayerInventory__'));
    return `${inv.Items.length} items across ${vaults.size} locations`;
  }

  const char = data as CharacterExport;
  const skillCount = Object.keys(char.Skills).length;
  const questCount = char.ActiveQuests.length;
  return `${skillCount} skills, ${questCount} active quests`;
}

export function detectAndValidate(json: unknown): DetectionResult {
  const type = detectFileType(json);

  if (type === 'unknown') {
    return { type, data: null, error: 'Unrecognized file format. Expected a Project Gorgon export.' };
  }

  if (type === 'inventory') {
    const validation = validateInventory(json);
    if (!validation.valid) {
      return { type, data: null, error: validation.error };
    }
    const data = json as InventoryExport;
    return { type, data, summary: generateImportSummary(data) };
  }

  // character
  const validation = validateCharacter(json);
  if (!validation.valid) {
    return { type, data: null, error: validation.error };
  }
  const data = json as CharacterExport;
  return { type, data, summary: generateImportSummary(data) };
}
