-- 0001_init.sql

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS (Safe creation)
DO $$ BEGIN
    CREATE TYPE gender_enum AS ENUM ('male', 'female', 'non_binary');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE orientation_enum AS ENUM ('heterosexual', 'homosexual', 'bisexual', 'pansexual', 'asexual', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE looking_for_enum AS ENUM ('relationship', 'casual', 'friends', 'networking', 'unspecified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE swipe_action_enum AS ENUM ('LIKE', 'PASS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE location_mode_enum AS ENUM ('precise', 'approximate', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    password_hash text NULL,
    google_id text UNIQUE NULL,
    is_email_verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    last_login_at timestamptz NULL
);

-- LOCATIONS
CREATE TABLE IF NOT EXISTS locations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    country text NOT NULL DEFAULT 'Argentina',
    province text NOT NULL,
    department text NULL,
    locality text NOT NULL,
    lat double precision NOT NULL,
    lon double precision NOT NULL,
    georef_id text UNIQUE NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT unique_location UNIQUE(province, locality)
);

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    birthdate date NOT NULL,
    gender gender_enum NOT NULL,
    orientation orientation_enum NOT NULL,
    bio text NOT NULL,
    looking_for looking_for_enum NOT NULL DEFAULT 'unspecified',
    location_mode location_mode_enum NOT NULL DEFAULT 'approximate',
    location_text text NOT NULL,
    lat double precision NULL,
    lon double precision NULL,
    is_onboarded boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- PHOTOS
CREATE TABLE IF NOT EXISTS profile_photos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url text NOT NULL,
    public_id text NOT NULL,
    position int NOT NULL CHECK (position BETWEEN 1 AND 6),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, position)
);

-- PREFERENCES
CREATE TABLE IF NOT EXISTS preferences (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    age_min int NOT NULL CHECK (age_min BETWEEN 18 AND 99),
    age_max int NOT NULL CHECK (age_max BETWEEN 18 AND 99),
    distance_km int NOT NULL CHECK (distance_km BETWEEN 1 AND 3000),
    genders_allowed text[] NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT check_age_range CHECK (age_min <= age_max)
);

-- BLOCKS
CREATE TABLE IF NOT EXISTS blocks (
    blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (blocker_id, blocked_id)
);

-- SWIPES
CREATE TABLE IF NOT EXISTS swipes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    swiper_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action swipe_action_enum NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (swiper_user_id, target_user_id)
);

-- MATCHES
CREATE TABLE IF NOT EXISTS matches (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_low_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_high_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (user_low_id < user_high_id),
    UNIQUE (user_low_id, user_high_id)
);

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id uuid NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_message_at timestamptz NULL
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    read_at timestamptz NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_swipes_swiper_created ON swipes (swiper_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_read ON messages (conversation_id, read_at);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks (blocked_id);
CREATE INDEX IF NOT EXISTS idx_profiles_birthdate ON profiles (birthdate);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarded ON profiles (is_onboarded) WHERE is_onboarded = true;
