import { LucideIcon, SortAscIcon } from 'lucide-react';
import { sortOptionsConfig } from '../config';

export const getSortOptionsIcon = (sortBy: string): LucideIcon => {
  const sortOption = sortOptionsConfig.find((option) => option.value === sortBy);

  return sortOption?.icon || SortAscIcon;
};
