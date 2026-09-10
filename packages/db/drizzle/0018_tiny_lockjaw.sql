ALTER TYPE "public"."user_registered_type" ADD VALUE IF NOT EXISTS 'passkey';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "passkey_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"transports" varchar(255),
	"credential_device_type" varchar(32),
	"credential_backed_up" boolean DEFAULT false NOT NULL,
	"aaguid" varchar(64),
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "passkey_credentials_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
DO $$
BEGIN
	ALTER TABLE "passkey_credentials" ADD CONSTRAINT "passkey_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "passkey_credentials_user_idx" ON "passkey_credentials" USING btree ("user_id");