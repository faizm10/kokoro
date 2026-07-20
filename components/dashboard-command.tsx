"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  BookOpen,
  Feather,
  FileText,
  LogOut,
  Network,
  PenLine,
  Save,
  Settings,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { cacheSignedIn } from "@/lib/auth-cache";

type RecentNote = {
  id: string;
  body: string;
};

type DashboardCommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recentNotes?: RecentNote[];
  canSaveNote?: boolean;
  onFocusQuickNote?: () => void;
  onSaveNote?: () => void;
};

function goToHash(hash: string) {
  const target = document.querySelector(hash);
  if (target instanceof HTMLElement) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  window.location.hash = hash.replace(/^#/, "");
}

export function DashboardCommandPalette({
  open,
  onOpenChange,
  recentNotes = [],
  canSaveNote = false,
  onFocusQuickNote,
  onSaveNote,
}: DashboardCommandPaletteProps) {
  const router = useRouter();

  function run(action: () => void) {
    onOpenChange(false);
    action();
  }

  function handleSignOut() {
    cacheSignedIn(false);
    void signOut({ callbackUrl: "/" });
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => run(() => goToHash("#today"))}>
            <Feather strokeWidth={1.5} />
            <span>Go to today</span>
            <CommandShortcut>T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => goToHash("#journal"))}>
            <BookOpen strokeWidth={1.5} />
            <span>Go to journal</span>
            <CommandShortcut>J</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => goToHash("#threads"))}>
            <Network strokeWidth={1.5} />
            <span>Go to threads</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => goToHash("#archive"))}>
            <Archive strokeWidth={1.5} />
            <span>Go to archive</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => goToHash("#settings"))}>
            <Settings strokeWidth={1.5} />
            <span>Go to settings</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push("/people"))}>
            <Users strokeWidth={1.5} />
            <span>Open people</span>
            <CommandShortcut>P</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(() => onFocusQuickNote?.())}>
            <PenLine strokeWidth={1.5} />
            <span>Write a quick note</span>
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem
            disabled={!canSaveNote}
            onSelect={() => {
              if (!canSaveNote) return;
              run(() => onSaveNote?.());
            }}
          >
            <Save strokeWidth={1.5} />
            <span>Save quick note</span>
            <CommandShortcut>⌘↵</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(handleSignOut)}>
            <LogOut strokeWidth={1.5} />
            <span>Sign out</span>
          </CommandItem>
        </CommandGroup>

        {recentNotes.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent notes">
              {recentNotes.slice(0, 5).map((note) => (
                <CommandItem
                  key={note.id}
                  value={`note ${note.body}`}
                  onSelect={() => run(() => router.push(`/notes/${note.id}`))}
                >
                  <FileText strokeWidth={1.5} />
                  <span className="truncate">{note.body}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}

export function useDashboardCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen };
}
