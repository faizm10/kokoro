CREATE TABLE "important_dates" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"person_id" text NOT NULL,
	"label" text NOT NULL,
	"date_text" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"source_note_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"person_id" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"context" text,
	"source" text DEFAULT 'in-person conversation' NOT NULL,
	"facts" text NOT NULL,
	"interpretation" text,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"follow_up" text,
	"follow_up_done" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"kind" text DEFAULT 'quick' NOT NULL,
	"written_for" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes_to_threads" (
	"note_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"confidence" integer DEFAULT 100 NOT NULL,
	CONSTRAINT "notes_to_threads_note_id_thread_id_pk" PRIMARY KEY("note_id","thread_id")
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"relationship" text,
	"how_we_met" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "important_dates" ADD CONSTRAINT "important_dates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "important_dates" ADD CONSTRAINT "important_dates_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes_to_threads" ADD CONSTRAINT "notes_to_threads_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes_to_threads" ADD CONSTRAINT "notes_to_threads_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "important_dates_person_idx" ON "important_dates" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "insights_user_created_idx" ON "insights" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "interactions_person_occurred_idx" ON "interactions" USING btree ("person_id","occurred_at");--> statement-breakpoint
CREATE INDEX "interactions_user_idx" ON "interactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notes_user_created_idx" ON "notes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notes_user_kind_idx" ON "notes" USING btree ("user_id","kind");--> statement-breakpoint
CREATE INDEX "people_user_idx" ON "people" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "threads_user_idx" ON "threads" USING btree ("user_id");