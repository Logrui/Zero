CREATE TABLE "mail0_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"operation" text NOT NULL,
	"data" jsonb NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail0_subtasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'needsAction' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail0_sync_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"last_sync_timestamp" timestamp,
	"conflict_resolution" text DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail0_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_task_id" text,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'needsAction' NOT NULL,
	"due" timestamp,
	"priority" text DEFAULT 'normal' NOT NULL,
	"notes" text,
	"labels" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mail0_tasks_google_task_id_unique" UNIQUE("google_task_id")
);
--> statement-breakpoint
CREATE TABLE "mail0_user_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"google_access_token" text,
	"google_refresh_token" text,
	"token_expiry" timestamp,
	"permissions" text[] DEFAULT '{}' NOT NULL,
	"last_auth_check" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mail0_user_permissions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "mail0_zeroos_task_extensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"workspace" text,
	"associated_people" text[] DEFAULT '{}' NOT NULL,
	"associated_companies" text[] DEFAULT '{}' NOT NULL,
	"linked_gmail_threads" text[] DEFAULT '{}' NOT NULL,
	"internal_notes" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mail0_changes" ADD CONSTRAINT "mail0_changes_task_id_mail0_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."mail0_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail0_subtasks" ADD CONSTRAINT "mail0_subtasks_task_id_mail0_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."mail0_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail0_sync_states" ADD CONSTRAINT "mail0_sync_states_task_id_mail0_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."mail0_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail0_zeroos_task_extensions" ADD CONSTRAINT "mail0_zeroos_task_extensions_task_id_mail0_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."mail0_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_mail0_changes_task_id" ON "mail0_changes" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_mail0_changes_timestamp" ON "mail0_changes" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_mail0_changes_operation" ON "mail0_changes" USING btree ("operation");--> statement-breakpoint
CREATE INDEX "idx_mail0_subtasks_task_id" ON "mail0_subtasks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_mail0_subtasks_position" ON "mail0_subtasks" USING btree ("position");--> statement-breakpoint
CREATE INDEX "idx_mail0_sync_states_task_id" ON "mail0_sync_states" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_mail0_sync_states_last_sync_timestamp" ON "mail0_sync_states" USING btree ("last_sync_timestamp");--> statement-breakpoint
CREATE INDEX "idx_mail0_tasks_user_id" ON "mail0_tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mail0_tasks_google_task_id" ON "mail0_tasks" USING btree ("google_task_id");--> statement-breakpoint
CREATE INDEX "idx_mail0_tasks_status" ON "mail0_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_mail0_tasks_due" ON "mail0_tasks" USING btree ("due");--> statement-breakpoint
CREATE INDEX "idx_mail0_tasks_priority" ON "mail0_tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_mail0_user_permissions_user_id" ON "mail0_user_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mail0_user_permissions_token_expiry" ON "mail0_user_permissions" USING btree ("token_expiry");--> statement-breakpoint
CREATE INDEX "idx_mail0_zeroos_task_extensions_task_id" ON "mail0_zeroos_task_extensions" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_mail0_zeroos_task_extensions_workspace" ON "mail0_zeroos_task_extensions" USING btree ("workspace");