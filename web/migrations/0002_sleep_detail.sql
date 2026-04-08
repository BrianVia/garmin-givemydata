-- Granular sleep data for night drilldown views

CREATE TABLE IF NOT EXISTS sleep_levels (
    calendar_date   TEXT,
    start_gmt       TEXT,
    end_gmt         TEXT,
    activity_level  INTEGER,  -- 0=deep, 1=light, 2=REM, 3=awake
    PRIMARY KEY (calendar_date, start_gmt)
);

CREATE TABLE IF NOT EXISTS sleep_heart_rate (
    calendar_date   TEXT,
    timestamp_gmt   INTEGER,
    value           INTEGER,
    PRIMARY KEY (calendar_date, timestamp_gmt)
);

CREATE TABLE IF NOT EXISTS sleep_hrv (
    calendar_date   TEXT,
    timestamp_gmt   INTEGER,
    value           INTEGER,
    PRIMARY KEY (calendar_date, timestamp_gmt)
);

CREATE TABLE IF NOT EXISTS sleep_stress (
    calendar_date   TEXT,
    timestamp_gmt   INTEGER,
    value           INTEGER,
    PRIMARY KEY (calendar_date, timestamp_gmt)
);

CREATE TABLE IF NOT EXISTS sleep_body_battery (
    calendar_date   TEXT,
    timestamp_gmt   INTEGER,
    value           INTEGER,
    PRIMARY KEY (calendar_date, timestamp_gmt)
);

CREATE TABLE IF NOT EXISTS sleep_respiration (
    calendar_date   TEXT,
    timestamp_gmt   INTEGER,
    value           INTEGER,
    PRIMARY KEY (calendar_date, timestamp_gmt)
);

CREATE TABLE IF NOT EXISTS sleep_times (
    calendar_date           TEXT PRIMARY KEY,
    sleep_start_local       INTEGER,
    sleep_end_local         INTEGER,
    sleep_start_gmt         INTEGER,
    sleep_end_gmt           INTEGER,
    sleep_score_feedback    TEXT,
    sleep_score_insight     TEXT,
    personalized_insight    TEXT
);

CREATE INDEX IF NOT EXISTS idx_sleep_levels_date ON sleep_levels (calendar_date);
CREATE INDEX IF NOT EXISTS idx_sleep_hr_date ON sleep_heart_rate (calendar_date);
CREATE INDEX IF NOT EXISTS idx_sleep_hrv_date ON sleep_hrv (calendar_date);
CREATE INDEX IF NOT EXISTS idx_sleep_stress_date ON sleep_stress (calendar_date);
CREATE INDEX IF NOT EXISTS idx_sleep_bb_date ON sleep_body_battery (calendar_date);
CREATE INDEX IF NOT EXISTS idx_sleep_resp_date ON sleep_respiration (calendar_date);
