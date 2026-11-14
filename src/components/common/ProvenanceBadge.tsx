import React from 'react';
import { ProvenanceTag } from '../../types/terra';

interface ProvenanceBadgeProps {
  tag: ProvenanceTag;
  compact?: boolean;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  tag,
  compact = false,
}) => {
  const colorClass =
    tag === 'VERIFIED NASA PDS / EARTHDATA'
      ? 'text-[#0F422E] bg-[#2A5A44]/8 border-[#2A5A44]/20'
      : tag === 'COMPUTED METRIC'
        ? 'text-[#543300] bg-[#E69A28]/12 border-[#E69A28]/25'
        : 'text-[#A33E11] bg-[#E06A3B]/10 border-[#E06A3B]/25';

  const shortLabel =
    tag === 'VERIFIED NASA PDS / EARTHDATA'
      ? 'VERIFIED PDS / EARTHDATA'
      : tag;

  return (
    <span
      className={`inline-flex items-center font-mono text-[10px] tracking-wide px-1.5 py-0.5 rounded border whitespace-nowrap shrink-0 ${colorClass}`}
    >
      [{compact ? shortLabel : tag}]
    </span>
  );
};
