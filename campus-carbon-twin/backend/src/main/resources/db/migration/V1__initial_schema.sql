-- Initial Schema Migration: Campus, Rooms, Equipment, Observations, Actions

CREATE TABLE IF NOT EXISTS buildings (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    floors INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(64) PRIMARY KEY,
    building_id VARCHAR(64) REFERENCES buildings(id),
    name VARCHAR(255) NOT NULL,
    floor_number INT NOT NULL,
    capacity INT NOT NULL DEFAULT 30,
    current_occupancy INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'OPTIMAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment (
    id VARCHAR(64) PRIMARY KEY,
    room_id VARCHAR(64) REFERENCES rooms(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,
    active_wattage NUMERIC(10, 2) NOT NULL,
    standby_wattage NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS observations (
    id VARCHAR(64) PRIMARY KEY,
    room_id VARCHAR(64) REFERENCES rooms(id),
    person_count INT NOT NULL,
    confidence_score NUMERIC(5, 4) NOT NULL,
    device_id VARCHAR(64),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS actions (
    id VARCHAR(64) PRIMARY KEY,
    room_id VARCHAR(64) REFERENCES rooms(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    explanation TEXT,
    estimated_hourly_co2e_saved_kg NUMERIC(8, 4),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING_APPROVAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
