SET search_path TO "HotelProject";

WITH room_info AS (
    SELECT chain_id, hotel_id, room_num, price
    FROM rooms
    WHERE hotel_id = 1 AND room_num IN ('102', '201')
),
-- Step 1: Create the Reservations
new_reservations AS (
    INSERT INTO hotel_reservation (
        start_date, end_date, created_at, 
        reservation_type, status, person_id,
        chain_id, hotel_id, room_num
    )
    SELECT 
        '2026-03-14', 
        '2026-04-14', 
        CURRENT_TIMESTAMP, 
        'renting', 
        'Confirmed', 
        1, -- Customer
        chain_id, hotel_id, room_num
    FROM room_info
    RETURNING reservation_id, room_num, person_id, start_date, end_date -- Added start/end dates here!
),
-- Step 2: Create Renting records with the calculation
new_rentings AS (
    INSERT INTO hotel_renting (
        reservation_id, checked_in_time, rental_price, price_paid, person_id
    )
    SELECT 
        nr.reservation_id, 
        '2026-03-14 12:00:00', 
        (ri.price * (nr.end_date - nr.start_date)), -- Full rental amount due
        NULL, -- Starts unpaid
        nr.person_id
    FROM new_reservations nr
    JOIN room_info ri ON nr.room_num = ri.room_num
    RETURNING reservation_id
)
-- Step 3: Connect to 'has'
INSERT INTO has (chain_id, hotel_id, room_num, reservation_id)
SELECT ri.chain_id, ri.hotel_id, ri.room_num, nr.reservation_id
FROM new_reservations nr
JOIN room_info ri ON nr.room_num = ri.room_num;

-- Step 4: Mark rooms as Occupied
UPDATE rooms 
SET status = 'Occupied' 
WHERE hotel_id = 1 AND room_num IN ('102', '201');