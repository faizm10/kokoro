import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { ensureUser, getNoteById } from "@/db/queries";

type NotePageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatNoteDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function NotePage({ params }: NotePageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const { id } = await params;
  const user = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });
  const note = await getNoteById(user.id, id);

  if (!note) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-[920px]">
        <Link
          href="/dashboard#archive"
          className="inline-flex items-center gap-2 rounded-[8px] px-2 py-2 text-sm text-stone transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          back to notes
        </Link>

        <article className="mt-14">
          <header className="border-b border-border pb-8">
            <p className="text-xs tracking-[0.08em] text-stone">{note.kind.toUpperCase()}</p>
            <h1 className="mt-4 text-[clamp(2rem,5vw,3.5rem)] font-normal leading-[1.08] tracking-[-0.045em]">
              note
            </h1>
            <p className="mt-4 text-sm text-stone">{formatNoteDate(note.createdAt)}</p>
          </header>

          <div className="max-w-[760px] whitespace-pre-wrap pt-10 text-[22px] leading-10 text-foreground">
            {note.body}
          </div>
        </article>
      </div>
    </main>
  );
}
