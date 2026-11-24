import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const roundStatus = pgEnum("round_status", ["open", "closed", "cancelled"]);
export const radioStatus = pgEnum("radio_status", ["idle", "playing", "paused", "error"]);
export const queueKind = pgEnum("queue_kind", ["song", "announcement"]);
export const queueStatus = pgEnum("queue_status", [
  "pending",
  "playing",
  "played",
  "failed",
  "skipped",
]);
export const eventKind = pgEnum("event_kind", ["holiday", "exam", "institutional"]);

export const songs = pgTable(
  "songs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    youtubeId: text("youtube_id").notNull().unique(),
    genre: text("genre").notNull(),
    energy: integer("energy").notNull(),
    moods: text("moods").array().default(sql`ARRAY[]::text[]`).notNull(),
    themes: text("themes").array().default(sql`ARRAY[]::text[]`).notNull(),
    restrictions: text("restrictions").array().default(sql`ARRAY[]::text[]`).notNull(),
    authorized: boolean("authorized").default(true).notNull(),
    fallback: boolean("fallback").default(false).notNull(),
    active: boolean("active").default(true).notNull(),
    durationSeconds: integer("duration_seconds"),
    ...timestamps,
  },
  (table) => [
    check("songs_energy_range", sql`${table.energy} between 1 and 5`),
    index("songs_active_idx").on(table.active, table.authorized),
  ],
);

export const playlists = pgTable("playlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").default("").notNull(),
  isFallback: boolean("is_fallback").default(false).notNull(),
  ...timestamps,
});
export const playlistSongs = pgTable(
  "playlist_songs",
  {
    playlistId: uuid("playlist_id")
      .references(() => playlists.id, { onDelete: "cascade" })
      .notNull(),
    songId: uuid("song_id")
      .references(() => songs.id, { onDelete: "cascade" })
      .notNull(),
    position: integer("position").default(0).notNull(),
  },
  (table) => [primaryKey({ columns: [table.playlistId, table.songId] })],
);
export const contextRules = pgTable("context_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  priority: integer("priority").default(0).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  conditions: jsonb("conditions").$type<Record<string, unknown>>().default({}).notNull(),
  effects: jsonb("effects").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
});
export const campusEvents = pgTable(
  "campus_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    kind: eventKind("kind").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    theme: text("theme"),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    check("campus_events_dates", sql`${table.endsAt} > ${table.startsAt}`),
    index("campus_events_window_idx").on(table.startsAt, table.endsAt),
  ],
);
export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    text: text("text").notNull(),
    approved: boolean("approved").default(false).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    minIntervalMinutes: integer("min_interval_minutes").default(60).notNull(),
    lastPlayedAt: timestamp("last_played_at", { withTimezone: true }),
    audioUrl: text("audio_url"),
    audioTextHash: text("audio_text_hash"),
    ...timestamps,
  },
  (table) => [check("announcements_interval_positive", sql`${table.minIntervalMinutes} >= 1`)],
);

export const rounds = pgTable(
  "rounds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    status: roundStatus("status").default("open").notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
    closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    winnerSongId: uuid("winner_song_id").references(() => songs.id),
    selectionReason: text("selection_reason").notNull(),
    contextSnapshot: jsonb("context_snapshot")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    ...timestamps,
  },
  (table) => [
    check("rounds_dates", sql`${table.closesAt} > ${table.openedAt}`),
    index("rounds_status_closes_idx").on(table.status, table.closesAt),
  ],
);
export const roundOptions = pgTable(
  "round_options",
  {
    roundId: uuid("round_id")
      .references(() => rounds.id, { onDelete: "cascade" })
      .notNull(),
    songId: uuid("song_id")
      .references(() => songs.id)
      .notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roundId, table.songId] }),
    unique("round_options_position_unique").on(table.roundId, table.position),
    check("round_options_position_range", sql`${table.position} between 1 and 2`),
  ],
);
export const votes = pgTable(
  "votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roundId: uuid("round_id")
      .references(() => rounds.id, { onDelete: "cascade" })
      .notNull(),
    songId: uuid("song_id")
      .references(() => songs.id)
      .notNull(),
    voterHash: text("voter_hash").notNull(),
    networkHash: text("network_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("votes_round_voter_unique").on(table.roundId, table.voterHash),
    index("votes_round_song_idx").on(table.roundId, table.songId),
  ],
);

export const radioState = pgTable(
  "radio_state",
  {
    id: integer("id").primaryKey().default(1),
    status: radioStatus("status").default("idle").notNull(),
    currentSongId: uuid("current_song_id").references(() => songs.id),
    currentAnnouncementId: uuid("current_announcement_id").references(() => announcements.id),
    currentRoundId: uuid("current_round_id").references(() => rounds.id),
    startedAt: timestamp("started_at", { withTimezone: true }),
    expectedEndsAt: timestamp("expected_ends_at", { withTimezone: true }),
    audioScreenId: text("audio_screen_id"),
    audioLeaseExpiresAt: timestamp("audio_lease_expires_at", { withTimezone: true }),
    consecutiveFailures: integer("consecutive_failures").default(0).notNull(),
    version: integer("version").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [check("radio_state_singleton", sql`${table.id} = 1`)],
);
export const playbackQueue = pgTable(
  "playback_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: queueKind("kind").notNull(),
    songId: uuid("song_id").references(() => songs.id),
    announcementId: uuid("announcement_id").references(() => announcements.id),
    status: queueStatus("status").default("pending").notNull(),
    position: integer("position").notNull(),
    source: text("source").default("automatic").notNull(),
    ...timestamps,
  },
  (table) => [index("playback_queue_status_position_idx").on(table.status, table.position)],
);
export const playbackHistory = pgTable("playback_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: queueKind("kind").notNull(),
  songId: uuid("song_id").references(() => songs.id),
  announcementId: uuid("announcement_id").references(() => announcements.id),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  result: text("result").default("started").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().default({}).notNull(),
});
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export const loginAttempts = pgTable(
  "login_attempts",
  {
    identityHash: text("identity_hash").primaryKey(),
    attempts: integer("attempts").default(0).notNull(),
    blockedUntil: timestamp("blocked_until", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [check("login_attempts_non_negative", sql`${table.attempts} >= 0`)],
);
export const networkVoteLimits = pgTable(
  "network_vote_limits",
  {
    roundId: uuid("round_id")
      .references(() => rounds.id, { onDelete: "cascade" })
      .notNull(),
    networkHash: text("network_hash").notNull(),
    count: integer("count").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roundId, table.networkHash] }),
    check("network_vote_limits_non_negative", sql`${table.count} >= 0`),
  ],
);
export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  details: jsonb("details").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
