ALTER TABLE "mail0_calendar_category" DROP CONSTRAINT "mail0_calendar_category_user_id_name_unique";--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" DROP CONSTRAINT "mail0_calendar_event_user_id_mail0_user_id_fk";
--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ALTER COLUMN "start" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ALTER COLUMN "end" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ALTER COLUMN "source" SET DEFAULT 'local';--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ALTER COLUMN "attendees" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ALTER COLUMN "reminders" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ALTER COLUMN "is_recurring_instance" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "recurrence_rule" text;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "recurrence_exception" text;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "status" text DEFAULT 'confirmed';--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "visibility" text DEFAULT 'default';--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "transparency" text DEFAULT 'opaque';--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "google_event_id" text;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "google_calendar_id" text;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "sync_status" text DEFAULT 'synced';--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "last_synced" timestamp;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "external_calendar_id" text;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "html_link" text;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "hangout_link" text;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "conference_data" text;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "recurring_event_id" text;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD COLUMN "original_start_time" text;--> statement-breakpoint
CREATE INDEX "idx_mail0_calendar_event_sync_status" ON "mail0_calendar_event" USING btree ("sync_status");--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" DROP COLUMN "source_id";--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" DROP COLUMN "recurrence";--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" DROP COLUMN "exceptions";--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" DROP COLUMN "categories";--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" DROP COLUMN "timezone";--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" DROP COLUMN "is_recurring";--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" DROP COLUMN "is_shared";--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" DROP COLUMN "shared_by";--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" DROP COLUMN "shared_with";