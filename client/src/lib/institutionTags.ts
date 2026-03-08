import type { University } from '@/types/university';
import type { SimplifiedTier } from '@/lib/tierUtils';
import { getSimplifiedTier } from '@/lib/tierUtils';
import { universities as archivedUniversities } from '@/lib/dataLoader';

const TAG_PRIORITY: SimplifiedTier[] = ['985', '211', '双一流', '省属重点师范', '四非', '其他'];

function normalizeInstitutionName(name: string | undefined): string {
  return (name ?? '').replace(/\s+/g, '').trim();
}

function addTag(target: Set<SimplifiedTier>, tag: SimplifiedTier) {
  if (tag !== '其他') {
    target.add(tag);
  }
}

function deriveTagsFromUniversity(university: Pick<University, 'tier' | 'is985' | 'is211'>): SimplifiedTier[] {
  const tags = new Set<SimplifiedTier>();
  const simplified = getSimplifiedTier(university.tier || '');

  if (simplified === '985') {
    addTag(tags, '985');
    addTag(tags, '211');
    addTag(tags, '双一流');
  } else if (simplified === '211') {
    addTag(tags, '211');
    addTag(tags, '双一流');
  } else if (simplified !== '其他') {
    addTag(tags, simplified);
  }

  if (university.is985) {
    addTag(tags, '985');
    addTag(tags, '211');
    addTag(tags, '双一流');
  } else if (university.is211) {
    addTag(tags, '211');
    addTag(tags, '双一流');
  }

  return TAG_PRIORITY.filter((tag) => tags.has(tag));
}

const institutionTagRegistry = (() => {
  const registry = new Map<string, SimplifiedTier[]>();

  (archivedUniversities as University[]).forEach((university) => {
    const key = normalizeInstitutionName(university.name);
    if (!key) return;

    const current = new Set(registry.get(key) ?? []);
    deriveTagsFromUniversity(university).forEach((tag) => current.add(tag));
    registry.set(key, TAG_PRIORITY.filter((tag) => current.has(tag)));
  });

  return registry;
})();

export function getInstitutionTags(
  institutionName: string,
  hints?: Pick<University, 'tier' | 'is985' | 'is211'>,
): SimplifiedTier[] {
  const key = normalizeInstitutionName(institutionName);
  const fromRegistry = registryLookup(key);
  if (fromRegistry.length > 0) {
    return fromRegistry;
  }

  if (hints) {
    const inferred = deriveTagsFromUniversity(hints);
    if (inferred.length > 0) {
      return inferred;
    }
  }

  return ['其他'];
}

function registryLookup(key: string): SimplifiedTier[] {
  return institutionTagRegistry.get(key) ?? [];
}

export function getPrimaryInstitutionTier(tags: SimplifiedTier[], fallbackTier?: string): string {
  const primary = TAG_PRIORITY.find((tag) => tags.includes(tag));
  return primary ?? fallbackTier ?? '其他';
}
