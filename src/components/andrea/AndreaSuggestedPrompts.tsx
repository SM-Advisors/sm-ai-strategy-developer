interface AndreaSuggestedPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export default function AndreaSuggestedPrompts({
  prompts,
  onSelect,
  disabled,
}: AndreaSuggestedPromptsProps) {
  if (prompts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-4 pb-3">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          disabled={disabled}
          className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-card-foreground hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
