CREATE TABLE "mail0_calendar_category" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	CONSTRAINT "mail0_calendar_category_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "mail0_calendar_event" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start" timestamp with time zone NOT NULL,
	"end" timestamp with time zone NOT NULL,
	"all_day" boolean DEFAULT false NOT NULL,
	"location" text,
	"color" text,
	"category_id" text,
	"source" text,
	"source_id" text,
	"recurrence" jsonb,
	"exceptions" jsonb,
	"attendees" jsonb,
	"categories" jsonb,
	"reminders" jsonb,
	"timezone" text,
	"is_recurring" boolean,
	"is_shared" boolean,
	"shared_by" text,
	"shared_with" jsonb,
	"is_recurring_instance" boolean,
	"original_event_id" text,
	"exception_date" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mail0_calendar_category" ADD CONSTRAINT "mail0_calendar_category_user_id_mail0_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mail0_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail0_calendar_event" ADD CONSTRAINT "mail0_calendar_event_user_id_mail0_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mail0_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_mail0_calendar_category_user_id" ON "mail0_calendar_category" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mail0_calendar_event_user_id" ON "mail0_calendar_event" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mail0_calendar_event_start" ON "mail0_calendar_event" USING btree ("start");--> statement-breakpoint
CREATE INDEX "idx_mail0_calendar_event_end" ON "mail0_calendar_event" USING btree ("end");