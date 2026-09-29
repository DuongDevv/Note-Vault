import { useState, useMemo, type KeyboardEvent } from "react";
import { Plus, Tag as TagIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { normalizeTag } from "@/utils/tag";

interface TagInputPopoverProps {
  currentTags: string[];
  allWorkspaceTags: string[];
  onAddTag: (tag: string) => void;
  maxTags?: number;
}

export function TagInputPopover({
  currentTags,
  allWorkspaceTags,
  onAddTag,
  maxTags = 8,
}: TagInputPopoverProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const normalizedInput = useMemo(() => normalizeTag(inputValue), [inputValue]);

  const isLimitReached = currentTags.length >= maxTags;

  // Filter existing workspace tags matching search and not already added
  const suggestions = useMemo(() => {
    return allWorkspaceTags.filter((tag) => {
      const isAlreadyAdded = currentTags.includes(tag);
      if (isAlreadyAdded) return false;
      if (!normalizedInput) return true;
      return tag.includes(normalizedInput);
    });
  }, [allWorkspaceTags, currentTags, normalizedInput]);

  const canCreateNew = useMemo(() => {
    if (!normalizedInput) return false;
    if (currentTags.includes(normalizedInput)) return false;
    return !allWorkspaceTags.includes(normalizedInput);
  }, [normalizedInput, currentTags, allWorkspaceTags]);

  const handleSelectTag = (tagToAdd: string) => {
    const clean = normalizeTag(tagToAdd);
    if (!clean || currentTags.includes(clean) || isLimitReached) return;
    onAddTag(clean);
    setInputValue("");
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (canCreateNew) {
        handleSelectTag(normalizedInput);
      } else if (suggestions.length > 0) {
        const first = suggestions[0];
        if (first) {
          handleSelectTag(first);
        }
      }
    }
  };

  if (isLimitReached) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="text-muted-foreground hover:text-foreground inline-flex h-6 cursor-pointer items-center gap-1 rounded-md px-1.5 text-xs font-normal"
            title="Thêm thẻ (tối đa 8 thẻ)"
          />
        }
      >
        <Plus className="size-3.5" />
        <span>Thêm thẻ</span>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-56 p-1.5 text-xs"
      >
        <div className="flex flex-col gap-1.5">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm hoặc tạo thẻ mới..."
            className="h-7 text-xs"
            autoFocus
          />

          <div className="max-h-40 overflow-y-auto">
            {/* Option to create brand new tag */}
            {canCreateNew && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleSelectTag(normalizedInput)}
                className="hover:bg-accent hover:text-accent-foreground flex h-7 w-full cursor-pointer items-center justify-start gap-1.5 rounded px-2 text-left text-xs font-normal"
              >
                <Plus className="text-muted-foreground size-3 shrink-0" />
                <span className="truncate">
                  Tạo thẻ{" "}
                  <strong className="font-semibold">#{normalizedInput}</strong>
                </span>
              </Button>
            )}

            {/* Existing matching workspace suggestions */}
            {suggestions.map((tag) => (
              <Button
                key={tag}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleSelectTag(tag)}
                className="hover:bg-accent hover:text-accent-foreground flex h-7 w-full cursor-pointer items-center justify-between rounded px-2 text-left text-xs font-normal"
              >
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <TagIcon className="text-muted-foreground size-3 shrink-0" />
                  <span className="truncate">#{tag}</span>
                </span>
              </Button>
            ))}

            {!canCreateNew && suggestions.length === 0 && (
              <div className="text-muted-foreground py-2 text-center text-[11px]">
                {normalizedInput
                  ? "Thẻ này đã được thêm"
                  : "Chưa có thẻ nào được tạo"}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
