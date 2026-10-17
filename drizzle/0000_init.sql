CREATE TABLE "badge_awards" (
	"member_id" uuid NOT NULL,
	"badge_id" text NOT NULL,
	"given_on" date NOT NULL,
	"given_by" uuid NOT NULL,
	CONSTRAINT "badge_awards_member_id_badge_id_pk" PRIMARY KEY("member_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"role" text NOT NULL,
	"swims" boolean DEFAULT true NOT NULL,
	"color" text NOT NULL,
	"avatar" text NOT NULL,
	"default_lengths" integer NOT NULL,
	"monthly_pace_m" integer NOT NULL,
	"record_goals_m" integer[] NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_role_check" CHECK ("members"."role" in ('parent', 'child')),
	CONSTRAINT "members_default_lengths_check" CHECK ("members"."default_lengths" between 1 and 400),
	CONSTRAINT "members_record_goals_check" CHECK (cardinality("members"."record_goals_m") = 4)
);
--> statement-breakpoint
CREATE TABLE "swim_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"swimmer_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"date" date NOT NULL,
	"lengths" integer NOT NULL,
	"pool_m" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "swim_sessions_lengths_check" CHECK ("swim_sessions"."lengths" between 1 and 400),
	CONSTRAINT "swim_sessions_pool_check" CHECK ("swim_sessions"."pool_m" in (15, 25))
);
--> statement-breakpoint
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_given_by_members_id_fk" FOREIGN KEY ("given_by") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swim_sessions" ADD CONSTRAINT "swim_sessions_swimmer_id_members_id_fk" FOREIGN KEY ("swimmer_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swim_sessions" ADD CONSTRAINT "swim_sessions_created_by_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "swim_sessions_swimmer_date_idx" ON "swim_sessions" USING btree ("swimmer_id","date");