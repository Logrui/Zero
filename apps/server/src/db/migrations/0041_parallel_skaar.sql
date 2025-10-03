CREATE TABLE "mail0_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"prefix" text NOT NULL,
	"permissions" text[] NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mail0_api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "mail0_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"tags" text[] NOT NULL,
	"source" text NOT NULL,
	"api_key_id" uuid,
	"read_status" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail0_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_mail0_api_keys_user_id" ON "mail0_api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mail0_api_keys_prefix" ON "mail0_api_keys" USING btree ("prefix");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_mail0_api_keys_user_id_name" ON "mail0_api_keys" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "idx_mail0_notifications_user_id" ON "mail0_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mail0_notifications_api_key_id" ON "mail0_notifications" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "idx_mail0_notifications_source" ON "mail0_notifications" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_mail0_notifications_created_at" ON "mail0_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_mail0_tags_user_id" ON "mail0_tags" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_mail0_tags_user_id_name" ON "mail0_tags" USING btree ("user_id","name");