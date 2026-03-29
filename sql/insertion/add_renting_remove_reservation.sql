SET search_path TO "HotelProject";

WITH reservation_lookup AS (
    -- Step 1: Find all details for Reservation #3
    SELECT
        r.reservation_id,
        r.person_id,
        r.hotel_id,
        r.room_num,
        r.start_date,
        r.end_date,
        rm.price as daily_price
    FROM hotel_reservation r
    JOIN rooms rm ON r.room_num = rm.room_num AND r.hotel_id = rm.hotel_id
    WHERE r.reservation_id = 3
),
insert_rental AS (
    -- Step 2: Create the Renting record
    INSERT INTO hotel_renting (
        reservation_id,
        checked_in_time,
        rental_price,
        price_paid,
        person_id
    )
    SELECT
        reservation_id,
        CURRENT_TIMESTAMP, -- The exact moment of check-in
        (daily_price * (end_date - start_date)), -- Full rental amount due
        NULL, -- Starts unpaid
        10 -- a random employee ID for processing the check-in
    FROM reservation_lookup
    RETURNING reservation_id
),
update_res AS (
    -- Step 3: Update Reservation status
    UPDATE hotel_reservation
    SET status = 'CheckedIn'
    WHERE reservation_id = 3
)
-- Step 4: Finalize by marking the room as Occupied
UPDATE rooms
SET status = 'Occupied'
WHERE (hotel_id, room_num) IN (
    SELECT hotel_id, room_num FROM reservation_lookup
);