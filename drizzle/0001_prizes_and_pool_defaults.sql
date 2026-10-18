CREATE TABLE "badge_spins" (
	"member_id" uuid NOT NULL,
	"badge_id" text NOT NULL,
	"prize_id" uuid,
	"prize_name" text NOT NULL,
	"spun_by" uuid NOT NULL,
	"spun_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "badge_spins_member_id_badge_id_pk" PRIMARY KEY("member_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "prizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"weight" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prizes_weight_check" CHECK ("prizes"."weight" between 1 and 1000)
);
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "default_lengths_small" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
-- Existing members: the same distance as their deep-pool start, in 15 m lengths.
UPDATE "members" SET "default_lengths_small" = LEAST(400, GREATEST(1, ROUND("default_lengths" * 25 / 15.0)))::integer;--> statement-breakpoint
ALTER TABLE "badge_spins" ADD CONSTRAINT "badge_spins_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_spins" ADD CONSTRAINT "badge_spins_prize_id_prizes_id_fk" FOREIGN KEY ("prize_id") REFERENCES "public"."prizes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_spins" ADD CONSTRAINT "badge_spins_spun_by_members_id_fk" FOREIGN KEY ("spun_by") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_default_lengths_small_check" CHECK ("members"."default_lengths_small" between 1 and 400);