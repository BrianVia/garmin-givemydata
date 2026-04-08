-- Intraday time-series data for stress, body battery, and heart rate detail pages

CREATE TABLE IF NOT EXISTS intraday_stress (
    calendar_date   TEXT,
    timestamp_gmt   INTEGER,
    value           INTEGER,
    PRIMARY KEY (calendar_date, timestamp_gmt)
);

CREATE TABLE IF NOT EXISTS intraday_body_battery (
    calendar_date   TEXT,
    timestamp_gmt   INTEGER,
    value           INTEGER,
    status          TEXT,
    PRIMARY KEY (calendar_date, timestamp_gmt)
);

CREATE TABLE IF NOT EXISTS intraday_heart_rate (
    calendar_date   TEXT,
    timestamp_gmt   INTEGER,
    value           INTEGER,
    PRIMARY KEY (calendar_date, timestamp_gmt)
);

CREATE INDEX IF NOT EXISTS idx_intraday_stress_date ON intraday_stress (calendar_date);
CREATE INDEX IF NOT EXISTS idx_intraday_bb_date ON intraday_body_battery (calendar_date);
CREATE INDEX IF NOT EXISTS idx_intraday_hr_date ON intraday_heart_rate (calendar_date);
