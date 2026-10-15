-- Demo Seed Data Migration
INSERT INTO buildings (id, name, floors) VALUES
('BLDG-SCI', 'Science & Innovation Hall', 4),
('BLDG-ENG', 'Turing Engineering Center', 5),
('BLDG-LIB', 'W.E.B. Du Bois Central Library', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO rooms (id, building_id, name, floor_number, capacity, current_occupancy, status) VALUES
('ROOM-SCI-204', 'BLDG-SCI', 'Physics Lecture Hall 204', 2, 120, 0, 'WASTEFUL'),
('ROOM-SCI-101', 'BLDG-SCI', 'Bio-Lab 101', 1, 30, 18, 'IN_USE'),
('ROOM-ENG-220', 'BLDG-ENG', 'Computer Architecture Lab', 2, 60, 42, 'IN_USE'),
('ROOM-LIB-100', 'BLDG-LIB', 'Main Reading Room', 1, 200, 110, 'OPTIMAL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO equipment (id, room_id, name, type, active_wattage, standby_wattage, is_active) VALUES
('EQ-SCI-204-HVAC', 'ROOM-SCI-204', 'VAV Air Handler Unit 204', 'HVAC', 3800.0, 150.0, true),
('EQ-SCI-204-LIGHT', 'ROOM-SCI-204', 'Ceiling LED Grid', 'LIGHTING', 600.0, 10.0, true),
('EQ-SCI-204-PROJ', 'ROOM-SCI-204', 'Laser Dual Projector Rig', 'PROJECTOR', 420.0, 20.0, true)
ON CONFLICT (id) DO NOTHING;
