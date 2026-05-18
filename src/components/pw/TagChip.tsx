import React from "react";
import { Check } from "lucide-react";

interface TagChipProps {
  label: string;
  color: string;
  onClick?: () => void;
  onRemove?: () => void;
  selected?: boolean;
  className?: string;
}

const TagChip: React.FC<TagChipProps> = ({
  label,
  color,
  onClick,
  onRemove,
  selected,
  className,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] cursor-pointer border ${
        selected
          ? "bg-[color:var(--pw-bg-3)] shadow-[0_0_0_2px_rgba(255,255,255,0.05)]"
          : "bg-[color:var(--pw-bg-2)]"
      } ${className ?? ""}`}
      style={{ borderColor: color, color }}
      onClick={onClick}
    >
      {selected ? (
        <Check className="h-3 w-3" style={{ color }} aria-hidden />
      ) : (
        <span
          aria-hidden
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="text-red-200">{label}</span>
      {onRemove ? (
        <button
          className="text-red-300/70 hover:text-red-200 ml-1"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          type="button"
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      ) : null}
    </span>
  );
};

export default TagChip;
