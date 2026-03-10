-- Note: surrogate key
-- Assume area == region
SET search_path TO "HotelProject";

-- ========================
-- Hotel Chains
-- ========================
TRUNCATE TABLE hotel_chains RESTART IDENTITY CASCADE; -- so want we run multiple times we don't get increasing ids

INSERT INTO hotel_chains (chain_name, country, city, region, street_name, stree_number, postalcode) 
VALUES 
('Global Inn', 'Canada', 'Ottawa', 'Ontario', 'Bank St', 101, 'K1P5N2'),
('Oceanic Stays', 'USA', 'Miami', 'Florida', 'Ocean Dr', 50, '33139'),
('Mountain Peak', 'Canada', 'Banff', 'Alberta', 'Mountain Rd', 12, 'T1L1A1'),
('Urban Suite', 'France', 'Paris', 'Ile-de-France', 'Rue de Rivoli', 88, '75001'),
('Elite Resorts', 'UK', 'London', 'Greater London', 'Piccadilly', 200, 'W1J9LL');

-- ========================
-- Hotels
-- ========================
TRUNCATE TABLE hotels RESTART IDENTITY CASCADE;

INSERT INTO hotels (chain_id, hotel_name, category, country, city, region, street_name, stree_number, postalcode, manager_id) VALUES 
-- Chain 1: Global Inn (IDs 1-8)
(1, 'Global Ottawa N', 5, 'Canada', 'Ottawa', 'Ontario', 'Metcalfe', 1, 'K1P1A1', null),
(1, 'Global Ottawa S', 3, 'Canada', 'Ottawa', 'Ontario', 'Sunnyside', 45, 'K1S0R1', null),
(1, 'Global Toronto', 4, 'Canada', 'Toronto', 'Ontario', 'Bay St', 10, 'M5H2N2', null),
(1, 'Global Montreal', 2, 'Canada', 'Montreal', 'Quebec', 'Sherbrooke', 500, 'H3A1E3', null),
(1, 'Global Vancouver', 5, 'Canada', 'Vancouver', 'BC', 'Robson', 1200, 'V6E1C1', NULL), -- Setup Mode
(1, 'Global Calgary', 3, 'Canada', 'Calgary', 'Alberta', '7th Ave', 22, 'T2P0X8', null),
(1, 'Global Halifax', 1, 'Canada', 'Halifax', 'NS', 'Barrington', 160, 'B3J1Z1', null),
(1, 'Global Victoria', 4, 'Canada', 'Victoria', 'BC', 'Gov St', 80, 'V8W1W7', null),

-- Chain 2: Oceanic Stays (IDs 9-16) DOES THIS MAKE Sense?
(2, 'Ocean Miami Bch', 5, 'USA', 'Miami', 'Florida', 'Collins', 1001, '33139', null),
(2, 'Ocean Miami Dwnt', 4, 'USA', 'Miami', 'Florida', 'Biscayne', 200, '33132', null),
(2, 'Ocean Key West', 3, 'USA', 'Key West', 'Florida', 'Duval', 5, '33040', null),
(2, 'Ocean Orlando', 4, 'USA', 'Orlando', 'Florida', 'Intl Dr', 8000, '32819', null),
(2, 'Ocean Tampa', 2, 'USA', 'Tampa', 'Florida', 'Kennedy', 101, '33602', NULL),
(2, 'Ocean NYC', 5, 'USA', 'New York', 'New York', '5th Ave', 720, '10019', null),
(2, 'Ocean LA', 4, 'USA', 'Los Angeles', 'California', 'Wilshire', 900, '90017', null),
(2, 'Ocean Chicago', 3, 'USA', 'Chicago', 'Illinois', 'Michigan', 401, '60611', null),

-- Chain 3: Mountain Peak (IDs 17-24)
(3, 'Peak Banff E', 5, 'Canada', 'Banff', 'Alberta', 'Tunnel Mt', 10, 'T1L1B1', null),
(3, 'Peak Banff W', 4, 'Canada', 'Banff', 'Alberta', 'Cave Ave', 2, 'T1L1A5', null),
(3, 'Peak Whistler', 5, 'Canada', 'Whistler', 'BC', 'Village St', 400, 'V8E1G1', null),
(3, 'Peak Jasper', 3, 'Canada', 'Jasper', 'Alberta', 'Connaught', 98, 'T0E1E0', null),
(3, 'Peak Blue Mtn', 2, 'Canada', 'Collingwood', 'Ontario', 'Blue Mtn Rd', 1, 'L9Y3Z2', NULL),
(3, 'Peak Mont Tr.', 4, 'Canada', 'Mont-Tremblant', 'Quebec', 'Rue Curé', 150, 'J8E1B1', null),
(3, 'Peak Kelowna', 3, 'Canada', 'Kelowna', 'BC', 'Harvey Ave', 2100, 'V1Y6G8', null),
(3, 'Peak Revelstoke', 4, 'Canada', 'Revelstoke', 'BC', 'Victoria Rd', 112, 'V0E2S0', null),

-- Chain 4: Urban Suite (IDs 25-32)
(4, 'Urban Paris Louvre', 5, 'France', 'Paris', 'IDF', 'Rivoli', 1, '75001', null),
(4, 'Urban Paris Marais', 4, 'France', 'Paris', 'IDF', 'Vieille', 12, '75004', null),
(4, 'Urban Lyon', 3, 'France', 'Lyon', 'Auvergne', 'Victor Hugo', 5, '69002', null),
(4, 'Urban Nice', 5, 'France', 'Nice', 'PAC', 'Promenade', 1, '06000', null),
(4, 'Urban Marseille', 3, 'France', 'Marseille', 'PAC', 'La Canebière', 10, '13001', NULL),
(4, 'Urban Bordeaux', 4, 'France', 'Bordeaux', 'Nouvelle', 'St Cath', 50, '33000', null),
(4, 'Urban Lille', 2, 'France', 'Lille', 'Hauts', 'Nationale', 22, '59000', null),
(4, 'Urban Strasbourg', 4, 'France', 'Strasbourg', 'Grand Est', 'Maire', 2, '67000', null),

-- Chain 5: Elite Resorts (IDs 33-40)
(5, 'Elite London City', 5, 'UK', 'London', 'London', 'Cornhill', 1, 'EC3V3N', null),
(5, 'Elite London West', 4, 'UK', 'London', 'London', 'Knightsbridge', 20, 'SW1X7L', null),
(5, 'Elite Manchester', 4, 'UK', 'Manchester', 'Lancs', 'Deansgate', 100, 'M32AA', null),
(5, 'Elite Edinburgh', 5, 'UK', 'Edinburgh', 'Manchester', 'Princes St', 1, 'EH22EQ', null),
(5, 'Elite Glasgow', 3, 'UK', 'Glasgow', 'London', 'Hope St', 11, 'G26AE', NULL),
(5, 'Elite Liverpool', 3, 'UK', 'Liverpool', 'London', 'Water St', 5, 'L20RD', null),
(5, 'Elite Birmingham', 2, 'UK', 'Birmingham', 'Manchester', 'New St', 10, 'B24NH', null),
(5, 'Elite Bristol', 4, 'UK', 'Bristol', 'London', 'Broad St', 1, 'BS12EQ', null);

-- ========================
-- Rooms
-- ========================

INSERT INTO rooms (chain_id, hotel_id, room_num, price, capacity, view, status)
SELECT 
    hotels.chain_id, 
    hotels.hotel_id, 
    room.num, 
    room.price, 
    room.cap, 
    room.vw, 
	CASE WHEN room.num = '401' THEN 'Reserved' ELSE 'Available' END
FROM hotels
CROSS JOIN (VALUES 
    ('101', 100.00, 1, 'City'), 
    ('102', 180.00, 2, 'Garden'), 
    ('201', 350.00, 3, 'Mountain'), 
    ('301', 600.00, 6, 'Sea'), 
    ('401', 1200.00, 10, 'Sea')
) AS room(num, price, cap, vw);

-- select * from hotel_chains;
-- select * from hotels;
-- select * from rooms;

-- ========================
-- Emails, Phones, Ammenities
-- ========================

-- Insert 1 email per chain
delete from hotelchain_emails;

INSERT INTO hotelchain_emails (chain_id, email)
SELECT 
    chain_id, 
    lower(replace(chain_name, ' ', '')) || '@corp.com'
FROM hotel_chains;

-- Insert 1 phone per chain
delete from hotelchain_phones;

INSERT INTO hotelchain_phones (chain_id, phone_number)
SELECT 
    chain_id, 
    '1-800-' || (1000000 + chain_id)
FROM hotel_chains;

-- select * from hotelchain_emails;

-- Insert 1 email per hotel
delete from hotel_email;

INSERT INTO hotel_email (chain_id, hotel_id, email)
SELECT 
    chain_id, 
    hotel_id, 
    lower(replace(hotel_name, ' ', '')) || '@hotel.com'
FROM hotels;

-- Insert 1 phone per hotel
delete from hotel_phone;

INSERT INTO hotel_phone (chain_id, hotel_id, phone_number)
SELECT 
    chain_id, 
    hotel_id, 
    '+1-613-555-' || LPAD(CAST(hotel_id AS TEXT), 4, '0')
FROM hotels;

-- select * from hotel_phone;


INSERT INTO room_amenities (chain_id, hotel_id, room_num, amenity)
SELECT 
    chain_id, 
    hotel_id, 
    room_num, 
    'Free WiFi'
FROM rooms
ON CONFLICT DO NOTHING; -- while working just there so no conflict

INSERT INTO room_extendible (chain_id, hotel_id, room_num, extendible)
SELECT 
    chain_id, 
    hotel_id, 
    room_num, 
    'Sofa Bed'
FROM rooms
WHERE capacity >= 2  -- Only "bigger" rooms are extendible
ON CONFLICT DO NOTHING;


INSERT INTO room_issue (chain_id, hotel_id, room_num, room_issue)
SELECT 
    chain_id, 
    hotel_id, 
    room_num, 
    'Leaking Faucet'
FROM rooms
WHERE status = 'Maintenance' -- Naturally, rooms in maintenance have issues
ON CONFLICT DO NOTHING;

-- Adding one specific manual issue for variety
INSERT INTO room_issue (chain_id, hotel_id, room_num, room_issue)
SELECT chain_id, hotel_id, room_num, 'AC Remote Missing'
FROM rooms
LIMIT 3; -- Just pick the first 3 rooms to have this specific issue

-- select * from room_amenities;




