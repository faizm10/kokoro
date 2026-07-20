"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type NoteEditorProps = {
  id: string;
  initialBody: string;
};

export function NoteEditor({ id, initialBody }: NoteEditorProps) {
  const [body, setBody] = useState(initialBody);
  const [savedBody, setSavedBody] = useState(initialBody);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const hasChanges = body.trim() !== savedBody.trim();

  async function saveNote() {
    if (!body.trim() || saving) return;

    setSaving(true);
    setStatus("");

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      });

      const data = (await response.json().catch(() => null)) as { note?: { body: string }; error?: string } | null;
      if (!response.ok || !data?.note) {
        throw new Error(data?.error ?? "Could not save note.");
      }

      setBody(data.note.body);
      setSavedBody(data.note.body);
      setEditing(false);
      setStatus("saved");
      window.setTimeout(() => setStatus(""), 1800);
    } catch (error) {
      const message = error instanceof Error ? error.message : "could not save note. try again.";
      setStatus(message.toLowerCase());
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setBody(savedBody);
    setEditing(false);
    setStatus("");
  }

  return (
    <div className="max-w-[760px] pt-10">
      {editing ? (
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          aria-label="Edit note"
          className="min-h-[300px] resize-y text-[22px] leading-10"
          autoFocus
        />
      ) : (
        <div className="whitespace-pre-wrap text-[22px] leading-10 text-foreground">{savedBody}</div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-5">
        {editing ? (
          <>
            <Button type="button" onClick={() => void saveNote()} disabled={!body.trim() || !hasChanges || saving}>
              <Check className="size-4" strokeWidth={1.5} />
              {saving ? "saving..." : "save changes"}
            </Button>
            <Button type="button" variant="ghost" onClick={cancelEdit} disabled={saving}>
              <X className="size-4" strokeWidth={1.5} />
              cancel
            </Button>
          </>
        ) : (
          <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
            <Pencil className="size-4" strokeWidth={1.5} />
            edit note
          </Button>
        )}

        {status ? <span className="text-xs text-stone">{status}</span> : null}
      </div>
    </div>
  );
}
