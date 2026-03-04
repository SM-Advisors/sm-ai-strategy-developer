import { useState, useEffect, useRef } from "react";
import { MessageSquare, Loader2, Save } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

interface FieldNote {
  id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
  org_user_id: string;
  org_users: { name: string; email: string } | null;
}

interface FieldNotesProps {
  fieldId: string;
  submissionId: string | null;
}

export default function FieldNotes({ fieldId, submissionId }: FieldNotesProps) {
  const { session } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<FieldNote[]>([]);
  const [myNote, setMyNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load notes when popover opens
  useEffect(() => {
    if (!open || !submissionId || loaded) return;

    setIsLoading(true);
    supabase.functions.invoke("get-field-notes", {
      body: { submissionId, fieldId },
    }).then(({ data }) => {
      if (data?.notes) {
        setNotes(data.notes);
        const mine = data.notes.find((n: FieldNote) => n.org_user_id === session?.orgUserId);
        if (mine) setMyNote(mine.note_text);
      }
    }).catch(console.warn).finally(() => {
      setIsLoading(false);
      setLoaded(true);
    });
  }, [open, submissionId, fieldId, loaded, session?.orgUserId]);

  const handleSave = async () => {
    if (!submissionId || !session?.orgUserId) return;
    setIsSaving(true);
    try {
      await supabase.functions.invoke("save-field-note", {
        body: {
          submissionId,
          fieldId,
          orgUserId: session.orgUserId,
          noteText: myNote,
        },
      });
      // Refresh notes list
      const { data } = await supabase.functions.invoke("get-field-notes", {
        body: { submissionId, fieldId },
      });
      if (data?.notes) setNotes(data.notes);
    } catch (err) {
      console.warn("Failed to save note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save after typing stops
  const handleNoteChange = (val: string) => {
    setMyNote(val);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(handleSave, 1500);
  };

  const noteCount = notes.length;
  const hasNotes = noteCount > 0;
  const canNote = !!submissionId && !!session?.orgUserId;

  if (!canNote) return null;

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setLoaded(false); }}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 text-xs rounded-full px-1.5 py-0.5 transition-colors",
            hasNotes
              ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
              : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50"
          )}
          title="Team notes for this field"
        >
          <MessageSquare className="w-3 h-3" />
          {hasNotes && <span>{noteCount}</span>}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b border-border">
          <p className="text-xs font-semibold text-foreground">Team Notes</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            One note per team member. Visible to everyone with your access code.
          </p>
        </div>

        <div className="max-h-56 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Other team members' notes */}
              {notes
                .filter((n) => n.org_user_id !== session?.orgUserId)
                .map((note) => (
                  <div key={note.id} className="px-3 py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">
                        {note.org_users?.name || "Team member"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">{note.note_text}</p>
                  </div>
                ))}

              {/* No notes from others */}
              {notes.filter((n) => n.org_user_id !== session?.orgUserId).length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground italic">
                  No notes from other team members yet.
                </div>
              )}
            </>
          )}
        </div>

        {/* My note area */}
        <div className="p-3 border-t border-border bg-muted/20 space-y-2">
          <p className="text-xs font-medium text-foreground">Your note</p>
          <textarea
            value={myNote}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Add your thoughts on this field..."
            rows={3}
            className="w-full text-xs resize-none rounded-md border border-border bg-background px-2.5 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {isSaving ? "Saving..." : "Auto-saves as you type"}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs gap-1"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
