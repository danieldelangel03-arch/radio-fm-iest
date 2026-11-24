CREATE TYPE "public"."event_kind" AS ENUM('holiday', 'exam', 'institutional');--> statement-breakpoint
CREATE TYPE "public"."queue_kind" AS ENUM('song', 'announcement');--> statement-breakpoint
CREATE TYPE "public"."queue_status" AS ENUM('pending', 'playing', 'played', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."radio_status" AS ENUM('idle', 'playing', 'paused', 'error');--> statement-breakpoint
CREATE TYPE "public"."round_status" AS ENUM('open', 'closed', 'cancelled');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"min_interval_minutes" integer DEFAULT 60 NOT NULL,
	"last_played_at" timestamp with time zone,
	"audio_url" text,
	"audio_text_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "announcements_interval_positive" CHECK ("announcements"."min_interval_minutes" >= 1)
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campus_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" "event_kind" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"theme" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campus_events_dates" CHECK ("campus_events"."ends_at" > "campus_events"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "context_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"effects" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "context_rules_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"identity_hash" text PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"blocked_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "login_attempts_non_negative" CHECK ("login_attempts"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "network_vote_limits" (
	"round_id" uuid NOT NULL,
	"network_hash" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "network_vote_limits_round_id_network_hash_pk" PRIMARY KEY("round_id","network_hash"),
	CONSTRAINT "network_vote_limits_non_negative" CHECK ("network_vote_limits"."count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "playback_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "queue_kind" NOT NULL,
	"song_id" uuid,
	"announcement_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"result" text DEFAULT 'started' NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playback_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "queue_kind" NOT NULL,
	"song_id" uuid,
	"announcement_id" uuid,
	"status" "queue_status" DEFAULT 'pending' NOT NULL,
	"position" integer NOT NULL,
	"source" text DEFAULT 'automatic' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlist_songs" (
	"playlist_id" uuid NOT NULL,
	"song_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "playlist_songs_playlist_id_song_id_pk" PRIMARY KEY("playlist_id","song_id")
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"is_fallback" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "playlists_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "radio_state" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"status" "radio_status" DEFAULT 'idle' NOT NULL,
	"current_song_id" uuid,
	"current_announcement_id" uuid,
	"current_round_id" uuid,
	"started_at" timestamp with time zone,
	"expected_ends_at" timestamp with time zone,
	"audio_screen_id" text,
	"audio_lease_expires_at" timestamp with time zone,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "radio_state_singleton" CHECK ("radio_state"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "round_options" (
	"round_id" uuid NOT NULL,
	"song_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "round_options_round_id_song_id_pk" PRIMARY KEY("round_id","song_id"),
	CONSTRAINT "round_options_position_unique" UNIQUE("round_id","position"),
	CONSTRAINT "round_options_position_range" CHECK ("round_options"."position" between 1 and 2)
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "round_status" DEFAULT 'open' NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	"winner_song_id" uuid,
	"selection_reason" text NOT NULL,
	"context_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rounds_dates" CHECK ("rounds"."closes_at" > "rounds"."opened_at")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"youtube_id" text NOT NULL,
	"genre" text NOT NULL,
	"energy" integer NOT NULL,
	"moods" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"themes" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"restrictions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"authorized" boolean DEFAULT true NOT NULL,
	"fallback" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"duration_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "songs_youtube_id_unique" UNIQUE("youtube_id"),
	CONSTRAINT "songs_energy_range" CHECK ("songs"."energy" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"song_id" uuid NOT NULL,
	"voter_hash" text NOT NULL,
	"network_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "votes_round_voter_unique" UNIQUE("round_id","voter_hash")
);
--> statement-breakpoint
ALTER TABLE "network_vote_limits" ADD CONSTRAINT "network_vote_limits_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playback_history" ADD CONSTRAINT "playback_history_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playback_history" ADD CONSTRAINT "playback_history_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playback_queue" ADD CONSTRAINT "playback_queue_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playback_queue" ADD CONSTRAINT "playback_queue_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_songs" ADD CONSTRAINT "playlist_songs_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_songs" ADD CONSTRAINT "playlist_songs_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radio_state" ADD CONSTRAINT "radio_state_current_song_id_songs_id_fk" FOREIGN KEY ("current_song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radio_state" ADD CONSTRAINT "radio_state_current_announcement_id_announcements_id_fk" FOREIGN KEY ("current_announcement_id") REFERENCES "public"."announcements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radio_state" ADD CONSTRAINT "radio_state_current_round_id_rounds_id_fk" FOREIGN KEY ("current_round_id") REFERENCES "public"."rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_options" ADD CONSTRAINT "round_options_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_options" ADD CONSTRAINT "round_options_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_winner_song_id_songs_id_fk" FOREIGN KEY ("winner_song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campus_events_window_idx" ON "campus_events" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "playback_queue_status_position_idx" ON "playback_queue" USING btree ("status","position");--> statement-breakpoint
CREATE INDEX "rounds_status_closes_idx" ON "rounds" USING btree ("status","closes_at");--> statement-breakpoint
CREATE INDEX "songs_active_idx" ON "songs" USING btree ("active","authorized");--> statement-breakpoint
CREATE INDEX "votes_round_song_idx" ON "votes" USING btree ("round_id","song_id");