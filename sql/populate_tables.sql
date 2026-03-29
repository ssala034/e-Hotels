-- Note: surrogate key
-- Assume area == region
SET search_path TO "HotelProject";

-- ========================
-- Hotel Chains
-- ========================
-- SAFE GUARD: so when we run multiple times we don't get increasing ids
TRUNCATE TABLE hotel_chains RESTART IDENTITY CASCADE;

INSERT INTO hotel_chains (chain_name, country, city, region, street_name, street_number, postalcode) 
VALUES 
('Global Inn', 'Canada', 'Ottawa', 'Ontario', 'Bank St.', 101, 'K1P5N2'),
('Oceanic Stays', 'USA', 'Miami', 'Florida', 'Ocean Dr', 50, '33139'),
('Toronto Star', 'Canada', 'Toronto', 'Ontario', 'Yonge St.', 12, 'T1L1A1'),
('Urban Suite', 'France', 'Paris', 'Ile-de-France', 'Rue de Rivoli', 88, '75001'),
('Elite Resorts', 'UK', 'London', 'Greater London', 'Piccadilly', 200, 'W1J9LL');

-- ========================
-- Hotels
-- ========================
TRUNCATE TABLE hotels RESTART IDENTITY CASCADE;

INSERT INTO hotels (chain_id, hotel_name, category, country, city, region, street_name, street_number, postalcode, manager_id) 
VALUES 
-- Chain 1: Global Inn (IDs 1-8)
(1, 'Global Ottawa N', 5, 'Canada', 'Ottawa', 'Ontario', 'Metcalfe', 1, 'K1P1A1', null),
(1, 'Global Ottawa S', 3, 'Canada', 'Ottawa', 'Ontario', 'Sunnyside', 45, 'K1S0R1', null),
(1, 'The Westin Ottawa', 4, 'Canada', 'Ottawa', 'Ontario', 'Bay St', 10, 'M5H2N2', null),
(1, 'Lord Elgin Hotel', 2, 'Canada', 'Ottawa', 'Ontario', 'Sherbrooke', 500, 'H3A1E3', null),
(1, 'Global Vancouver', 5, 'Canada', 'Vancouver', 'BC', 'Robson', 1200, 'V6E1C1', null),
(1, 'Global Calgary', 3, 'Canada', 'Calgary', 'Alberta', '7th Ave', 22, 'T2P0X8', null),
(1, 'Global Halifax', 1, 'Canada', 'Halifax', 'NS', 'Barrington', 160, 'B3J1Z1', null),
(1, 'Ottawa Marriott Hotel', 4, 'Canada', 'Ottawa', 'Ontario', 'Gov St', 80, 'V8W1W7', null),

-- Chain 2: Oceanic Stays (IDs 9-16) DOES THIS MAKE Sense?
(2, 'Ocean Miami Bch', 5, 'USA', 'Miami', 'Florida', 'Collins', 1001, '33139', null),
(2, 'Ocean Miami Dwnt', 4, 'USA', 'Miami', 'Florida', 'Biscayne', 200, '33132', null),
(2, 'Ocean Key West', 3, 'USA', 'Key West', 'Florida', 'Duval', 5, '33040', null),
(2, 'Ocean Orlando', 4, 'USA', 'Orlando', 'Florida', 'Intl Dr', 8000, '32819', null),
(2, 'Ocean Tampa', 2, 'USA', 'Tampa', 'Florida', 'Kennedy', 101, '33602', null),
(2, 'Ocean NYC', 5, 'USA', 'New York', 'New York', '5th Ave', 720, '10019', null),
(2, 'Ocean LA', 4, 'USA', 'Los Angeles', 'California', 'Wilshire', 900, '90017', null),
(2, 'Ocean Chicago', 3, 'USA', 'Chicago', 'Illinois', 'Michigan', 401, '60611', null),

-- Chain 3: Toronto Star (IDs 17-24)
(3, 'Fairmont Royal York', 5, 'Canada', 'Toronto', 'Ontario', 'Front St W', 100, 'M5J1E3', null),
(3, 'The Ritz Toronto', 4, 'Canada', 'Toronto', 'Ontario', 'Wellington St', 181, 'M5V3G7', null),
(3, 'Hotel Toronto', 5, 'Canada', 'Toronto', 'Ontario', 'Uni Ave', 188, 'M5H0A3', null),
(3, 'The Regis Toronto', 1, 'Canada', 'Toronto', 'Ontario', 'Bay St', 325, 'M5H4G3', null),
(3, 'Continental Toronto', 4, 'Canada', 'Toronto', 'Ontario', 'Front St W', 225, 'M5V2X3', null),
(3, 'Chelsea Toronto', 3, 'Canada', 'Toronto', 'Ontario', 'Gerrard St W', 33, 'M5G1Z4', null),
(3, 'Hotels Toronto', 2, 'Canada', 'Toronto', 'Ontario', 'Simcoe St', 75, 'M5J3A6', null),
(3, 'One King Hotel', 4, 'Canada', 'Toronto', 'Ontario', 'King St W', 1, 'M5H1A1', null),

-- Chain 4: Urban Suite (IDs 25-32)
(4, 'Urban Paris Louvre', 5, 'France', 'Paris', 'IDF', 'Rivoli', 1, '75001', null),
(4, 'Urban Paris Marais', 4, 'France', 'Paris', 'IDF', 'Vieille', 12, '75004', null),
(4, 'Urban Lyon', 3, 'France', 'Lyon', 'Auvergne', 'Victor Hugo', 5, '69002', null),
(4, 'Urban Nice', 5, 'France', 'Nice', 'PAC', 'Promenade', 1, '06000', null),
(4, 'Urban Marseille', 3, 'France', 'Marseille', 'PAC', 'La Canebière', 10, '13001', null),
(4, 'Urban Bordeaux', 4, 'France', 'Bordeaux', 'Nouvelle', 'St Cath', 50, '33000', null),
(4, 'Urban Lille', 2, 'France', 'Lille', 'Hauts', 'Nationale', 22, '59000', null),
(4, 'Urban Strasbourg', 4, 'France', 'Strasbourg', 'Grand Est', 'Maire', 2, '67000', null),

-- Chain 5: Elite Resorts (IDs 33-40)
(5, 'Elite London City', 5, 'UK', 'London', 'London', 'Cornhill', 1, 'EC3V3N', null),
(5, 'Elite London West', 4, 'UK', 'London', 'London', 'Knightsbridge', 20, 'SW1X7L', null),
(5, 'Elite Manchester', 4, 'UK', 'Manchester', 'Lancs', 'Deansgate', 100, 'M32AA', null),
(5, 'Elite Edinburgh', 5, 'UK', 'Edinburgh', 'Manchester', 'Princes St', 1, 'EH22EQ', null),
(5, 'Elite Glasgow', 3, 'UK', 'Glasgow', 'London', 'Hope St', 11, 'G26AE', null),
(5, 'Elite Liverpool', 3, 'UK', 'Liverpool', 'London', 'Water St', 5, 'L20RD', null),
(5, 'Elite Birmingham', 2, 'UK', 'Birmingham', 'Manchester', 'New St', 10, 'B24NH', null),
(5, 'Elite Bristol', 4, 'UK', 'Bristol', 'London', 'Broad St', 1, 'BS12EQ', null);

-- ========================
-- Emails, Phones
-- ========================

-- Insert 1 email per chain
INSERT INTO hotelchain_emails (chain_id, email)
SELECT 
    chain_id, 
    lower(replace(chain_name, ' ', '')) || '@corp.com'
FROM hotel_chains;

-- Insert 1 phone per chain
INSERT INTO hotelchain_phones (chain_id, phone_number)
SELECT 
    chain_id, 
    '1-800-' || (1000000 + chain_id)
FROM hotel_chains;

-- Insert 1 email per hotel
INSERT INTO hotel_email (chain_id, hotel_id, email)
SELECT 
    chain_id, 
    hotel_id, 
    lower(replace(hotel_name, ' ', '')) || '@hotel.com'
FROM hotels;

-- Insert 1 phone per hotel
INSERT INTO hotel_phone (chain_id, hotel_id, phone_number)
SELECT 
    chain_id, 
    hotel_id, 
    '+1-613-555-' || LPAD(CAST(hotel_id AS TEXT), 4, '0')
FROM hotels;

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
    ('401', 1200.00, 8, 'Sea')
) AS room(num, price, cap, vw);

-- ========================
-- Room Issues
-- ========================

INSERT INTO room_issues (chain_id, hotel_id, room_num, issue)
SELECT
	chain_id,
	hotel_id,
	room_num,
	CASE
		WHEN category = 4 THEN 'Broken TV'
		WHEN category = 3 THEN 'Broken Kitchen'
		WHEN category = 2 THEN 'Broken HVAC'
		ELSE 'Bath/Tub Water not working'
	END AS issue
FROM (SELECT rooms.chain_id, rooms.hotel_id, room_num, category
	  FROM rooms JOIN hotels USING (chain_id, hotel_id)
) subquery
WHERE category < 5;

-- ========================
-- Room Extendible
-- ========================

INSERT INTO room_extendible (chain_id, hotel_id, room_num, extendible)

	-- category 2+ gets 'Add Rollaway Bed'
	SELECT chain_id, hotel_id, room_num, 'Add Rollaway Bed'
	FROM rooms JOIN hotels USING (chain_id, hotel_id)
	WHERE category >= 2 AND capacity > 1
	
UNION ALL

	-- category 3+ also gets 'Add extra Table'
	SELECT chain_id, hotel_id, room_num, 'Add extra Table'
	FROM rooms JOIN hotels USING (chain_id, hotel_id)
	WHERE category >= 3 AND capacity > 1

UNION ALL

	-- category 4+ also gets 'Add Cribs'
	SELECT chain_id, hotel_id, room_num, 'Add Cribs'
	FROM rooms JOIN hotels USING (chain_id, hotel_id)
	WHERE category >= 4 AND capacity >= 6

UNION ALL

	-- category 5 also gets 'Connect multiple suites'
	SELECT chain_id, hotel_id, room_num, 'Connect multiple suites'
	FROM rooms JOIN hotels USING (chain_id, hotel_id)
	WHERE category = 5;

-- ========================
-- Room Amenities
-- ========================
INSERT INTO room_amenities (chain_id, hotel_id, room_num, amenity)

	SELECT chain_id, hotel_id, room_num, 'Free Wifi'
	FROM rooms JOIN hotels USING (chain_id, hotel_id)
	WHERE category = 1
	
UNION ALL

	SELECT chain_id, hotel_id, room_num, 'House Keeping'
	FROM rooms JOIN hotels USING (chain_id, hotel_id)
	WHERE category = 2

UNION ALL

	SELECT chain_id, hotel_id, room_num, 'Extra Sofa'
	FROM rooms JOIN hotels USING (chain_id, hotel_id)
	WHERE category >= 3 AND capacity >= 3

UNION ALL

	SELECT chain_id, hotel_id, room_num, 'Toiletries'
	FROM rooms JOIN hotels USING (chain_id, hotel_id)
	WHERE category >= 4 and capacity > 1

UNION ALL

	SELECT chain_id, hotel_id, room_num, 'Free room service'
	FROM rooms JOIN hotels USING (chain_id, hotel_id)
	WHERE category = 5;

-- ========================
-- Manager Employees
-- ========================
INSERT INTO person ( first_name, last_name, ssn_type, ssn_number, country, city, region, street_name, street_number, postalcode, email, password)
VALUES
('James',    'Anderson',  'SSN', 'SSN-001', 'Canada', 'Ottawa',    'Ontario',      'Maple Street',                  101,  'K1A0A1',  'james.anderson@hotels.com',    'y5naMM4@7hD|'),
('Emily',    'Thompson',  'SSN', 'SSN-002', 'Canada', 'Ottawa',    'Ontario',      'Oak Avenue',                    202,  'K1A0A2',  'emily.thompson@hotels.com',    'T8k#P2zLm9Q!'),
('Michael',  'Harris',    'SSN', 'SSN-003', 'Canada', 'Ottawa',    'Ontario',      'Pine Road',                     303,  'K1A0A3',  'michael.harris@hotels.com',    'R4v$Xn7@cL2p'),
('Sarah',    'Martin',    'SSN', 'SSN-004', 'Canada', 'Ottawa',    'Ontario',      'Cedar Lane',                    404,  'K1A0A4',  'sarah.martin@hotels.com',      'Q9!dF6wZx3@T'),
('David',    'Wilson',    'SSN', 'SSN-005', 'Canada', 'Vancouver', 'BC',           'Granville St',                  505,  'V5K0A1',  'david.wilson@hotels.com',      'mE7@Lp2#Xz8K'),
('Laura',    'Garcia',    'SSN', 'SSN-006', 'Canada', 'Calgary',   'Alberta',      '8 Ave SW',                      606,  'T2P1J9',  'laura.garcia@hotels.com',      'B5^kW9!qT3yP'),
('Daniel',   'Martinez',  'SSN', 'SSN-007', 'Canada', 'Halifax',   'NS',           'Barrington St',                 707,  'B3J2A1',  'daniel.martinez@hotels.com',   'Z2@xCv8!Lm4R'),
('Sophia',   'Robinson',  'SSN', 'SSN-008', 'Canada', 'Ottawa',    'Ontario',      'Elgin St',                      808,  'K1P5K8',  'sophia.robinson@hotels.com',   'N7!pQ4@tYx6A'),
('Chris',    'Clark',     'SSN', 'SSN-009', 'USA',    'Miami',     'Florida',      'Ocean Dr',                      909,  '33139',   'chris.clark@hotels.com',       'K3@Lm8!pXz1D'),
('Olivia',   'Lewis',     'SSN', 'SSN-010', 'USA',    'Miami',     'Florida',      'Collins Ave',                   1010, '33140',   'olivia.lewis@hotels.com',      'P9!zT2xWq7@B'),
('Ethan',    'Lee',       'SSN', 'SSN-011', 'USA',    'Key West',  'Florida',      'Duval St',                      1111, '33040',   'ethan.lee@hotels.com',         'X5@cN8!Lm2Qv'),
('Ava',      'Walker',    'SSN', 'SSN-012', 'USA',    'Orlando',   'Florida',      'Orange Ave',                    1212, '32801',   'ava.walker@hotels.com',        'D7!rT3@Zx9Lp'),
('Noah',     'Hall',      'SSN', 'SSN-013', 'USA',    'Tampa',     'Florida',      'Bayshore Blvd',                 1313, '33606',   'noah.hall@hotels.com',         'J4@pLm8!Qx2C'),
('Mia',      'Allen',     'SSN', 'SSN-014', 'USA',    'New York',  'New York',     '5th Ave',                       1414, '10001',   'mia.allen@hotels.com',         'F2!Zx7@Wp9Lt'),
('Liam',     'Young',     'SSN', 'SSN-015', 'USA',    'Los Angeles','California',  'Sunset Blvd',                   1515, '90028',   'liam.young@hotels.com',        'A8@Lm3!xQp6D'),
('Emma',     'Hernandez', 'SSN', 'SSN-016', 'USA',    'Chicago',   'Illinois',     'Michigan Ave',                  1616, '60601',   'emma.hernandez@hotels.com',    'T1!xZ9@Lp4Qv'),
('Oliver',   'King',      'SSN', 'SSN-017', 'Canada', 'Toronto',   'Ontario',      'Queen St W',                    1717, 'M5H2N2',  'oliver.king@hotels.com',       'M6@pX2!qZ8Lt'),
('John',     'Jones',     'SSN', 'SSN-018', 'Canada', 'Oshawa',    'Ontario',      'Maple St E',                    1241, 'M9U3R5',  'john.jones@hotels.com',        'oi*(kNMhaj!'),
('Lucas',    'Scott',     'SSN', 'SSN-019', 'Canada', 'Toronto',   'Ontario',      'Bloor St',                      1919, 'M4W1A8',  'lucas.scott@hotels.com',       'V9@xT2!Lm5Qp'),
('Harper',   'Torres',    'SSN', 'SSN-020', 'Canada', 'Toronto',   'Ontario',      'Yonge St',                      2020, 'M5B2H1',  'harper.torres@hotels.com',     'Z4!pLm8@Xq2D'),
('Mason',    'Nguyen',    'SSN', 'SSN-021', 'Canada', 'Toronto',   'Ontario',      'Dundas St',                     2121, 'M5G1C3',  'mason.nguyen@hotels.com',      'C7@T3!Zx9Lp'),
('Ella',     'Hill',      'SSN', 'SSN-022', 'Canada', 'Toronto',   'Ontario',      'Spadina Ave',                   2222, 'M5T2E9',  'ella.hill@hotels.com',         'P2!Lm8@xQ7Zv'),
('Logan',    'Flores',    'SSN', 'SSN-023', 'Canada', 'Toronto',   'Ontario',      'Front St',                      2323, 'M5V2Y1',  'logan.flores@hotels.com',      'Y5@Zx3!Lp8Qt'),
('Avery',    'Green',     'SSN', 'SSN-024', 'Canada', 'Toronto',   'Ontario',      'Bay St',                        2424, 'M5J2N8',  'avery.green@hotels.com',       'W9!Lm2@Xp7Zq'),
('Elijah',   'Adams',     'SSN', 'SSN-025', 'France', 'Paris',     'IDF',          'Rue de Rivoli',                 25,   '75001',   'elijah.adams@hotels.com',      'R8@xT3!Lm6Qp'),
('Scarlett', 'Baker',     'SSN', 'SSN-026', 'France', 'Paris',     'IDF',          'Boulevard Saint-Germain',       26,   '75006',   'scarlett.baker@hotels.com',    'N4!Zx9@Lp2Qt'),
('James',    'Gonzalez',  'SSN', 'SSN-027', 'France', 'Lyon',      'Auvergne',     'Rue Merciere',                  27,   '69002',   'james.gonzalez@hotels.com',    'U7@Lm5!xQ2Zp'),
('Grace',    'Nelson',    'SSN', 'SSN-028', 'France', 'Nice',      'PAC',          'Promenade des Anglais',         28,   '06000',   'grace.nelson@hotels.com',      'K3!pZx8@Lm9Qt'),
('Henry',    'Carter',    'SSN', 'SSN-029', 'France', 'Marseille', 'PAC',          'La Canebiere',                  29,   '13001',   'henry.carter@hotels.com',      'L9@T2!Zx7MpQ'),
('Zoe',      'Mitchell',  'SSN', 'SSN-030', 'France', 'Bordeaux',  'Nouvelle',     'Rue Sainte-Catherine',          30,   '33000',   'zoe.mitchell@hotels.com',      'E6!Lm3@Xp8Zt'),
('Jack',     'Perez',     'SSN', 'SSN-031', 'France', 'Lille',     'Hauts',        'Rue de Bethune',                31,   '59000',   'jack.perez@hotels.com',        'S2@Zx7!Lm5Qp'),
('Lily',     'Roberts',   'SSN', 'SSN-032', 'France', 'Strasbourg','Grand Est',    'Rue des Grandes Arcades',       32,   '67000',   'lily.roberts@hotels.com',      'D8!Lp2@Zx9Qt'),
('Owen',     'Turner',    'SSN', 'SSN-033', 'UK',     'London',    'London',       'Baker St',                      33,   'NW16XE',  'owen.turner@hotels.com',       'H3@Lm7!xQ5Zp'),
('Chloe',    'Phillips',  'SSN', 'SSN-034', 'UK',     'London',    'London',       'Oxford St',                     34,   'W1D1BS',  'chloe.phillips@hotels.com',    'J9!Zx2@Lp8Qt'),
('Ryan',     'Campbell',  'SSN', 'SSN-035', 'UK',     'Manchester','Lancs',        'Deansgate',                     35,   'M31AZ',   'ryan.campbell@hotels.com',     'G5@Lm3!Xp7Zt'),
('Nora',     'Parker',    'SSN', 'SSN-036', 'UK',     'Edinburgh', 'Scotland',     'Royal Mile',                    36,   'EH12NG',  'nora.parker@hotels.com',       'T2!Zx8@Lm4Qp'),
('Leo',      'Evans',     'SSN', 'SSN-037', 'UK',     'Glasgow',   'Scotland',     'George St',                     37,   'G12FF',   'leo.evans@hotels.com',         'Q7@Lp9!Zx3Mt'),
('Hannah',   'Edwards',   'SSN', 'SSN-038', 'UK',     'Liverpool', 'England',      'Bold St',                       38,   'L14HR',   'hannah.edwards@hotels.com',    'M4!Lm2@Xp8Zq'),
('Isaac',    'Collins',   'SSN', 'SSN-039', 'UK',     'Birmingham','England',      'New St',                        39,   'B21LP',   'isaac.collins@hotels.com',     'P8@Zx3!Lm7Qt'),
('Aria',     'Stewart',   'SSN', 'SSN-040', 'UK',     'Bristol',   'England',      'Park St',                       40,   'BS15AH',  'aria.stewart@hotels.com',      'X2!Lm9@Zp5Qt');

INSERT INTO employee (person_id, chain_id, hotel_id, role)
SELECT 
    person.person_id,
    hotels.chain_id,
    hotels.hotel_id,
    'Manager'
FROM person JOIN hotels ON person.ssn_number = 'SSN-' || LPAD(hotels.hotel_id::TEXT, 3, '0');

-- Note the ON mathcing here is a bit risky but should work for now

-- ========================
-- Update hotels with their manager
-- ========================
UPDATE hotels
SET manager_id = e.person_id
FROM employee e
WHERE hotels.chain_id = e.chain_id AND hotels.hotel_id = e.hotel_id AND e.role = 'Manager';



-- select hotels.chain_id, hotels.hotel_id, hotels.hotel_name,  from hotels join rooms using (chain_id, hotel_id);
-- select * from hotel_chains;
--select chain_id, hotel_id, hotel_name, person.person_id, person.email, person.password from hotels join person on hotels.manager_id = person.person_id;




-- OLD POPULATION:

-- Set one employee to be manager of 2 hotels
-- UPDATE hotels
-- SET manager_id = 1
-- FROM employee e
-- WHERE hotels.chain_id = 3 AND hotels.hotel_name = 'The Ritz Toronto';

-- INSERT INTO room_amenities (chain_id, hotel_id, room_num, amenity)
-- SELECT 
--     chain_id, 
--     hotel_id, 
--     room_num, 
--     'Free WiFi'
-- FROM rooms
-- ON CONFLICT DO NOTHING; -- while working just there so no conflict

-- INSERT INTO room_extendible (chain_id, hotel_id, room_num, extendible)
-- SELECT 
--     chain_id, 
--     hotel_id, 
--     room_num, 
--     'Sofa Bed'
-- FROM rooms
-- WHERE capacity >= 2  -- Only "bigger" rooms are extendible
-- ON CONFLICT DO NOTHING;


-- INSERT INTO room_issue (chain_id, hotel_id, room_num, room_issue)
-- SELECT 
--     chain_id, 
--     hotel_id, 
--     room_num, 
--     'Leaking Faucet'
-- FROM rooms
-- WHERE status = 'Maintenance' -- Naturally, rooms in maintenance have issues
-- ON CONFLICT DO NOTHING;

-- -- Adding one specific manual issue for variety
-- INSERT INTO room_issue (chain_id, hotel_id, room_num, room_issue)
-- SELECT chain_id, hotel_id, room_num, 'AC Remote Missing'
-- FROM rooms
-- LIMIT 3; -- Just pick the first 3 rooms to have this specific issue

-- -- select * from room_amenities;




