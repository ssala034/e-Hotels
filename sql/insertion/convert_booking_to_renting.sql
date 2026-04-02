SET search_path TO "HotelProject";

WITH reservation_lookup AS (
    -- Step 1: Find the original booking reservation to convert
    SELECT
        r.reservation_id,
        r.chain_id,
        r.person_id,
        r.hotel_id,
        r.room_num,
        r.created_at,
        r.status,
        h.hotel_name,
        hc.chain_name,
        COALESCE(NULLIF(TRIM(CONCAT(p.first_name, ' ', p.last_name)), ''), 'Unknown Customer') AS customer_name,
        r.start_date,
        r.end_date,
        rm.price AS daily_price,
        hb.booked_date
    FROM hotel_reservation r
    JOIN rooms rm
        ON r.chain_id = rm.chain_id
       AND r.hotel_id = rm.hotel_id
       AND TRIM(r.room_num) = TRIM(rm.room_num)
    JOIN hotels h
        ON h.chain_id = r.chain_id
       AND h.hotel_id = r.hotel_id
    JOIN hotel_chains hc
        ON hc.chain_id = r.chain_id
    LEFT JOIN person p
        ON p.person_id = r.person_id
    LEFT JOIN hotel_booking hb
        ON hb.reservation_id = r.reservation_id
    WHERE r.reservation_id = 3
      AND r.reservation_type = 'booking'
      AND r.status IN ('Pending', 'Confirmed')
),
new_renting_reservation AS (
    -- Step 2: Create a new reservation row dedicated to renting
    INSERT INTO hotel_reservation (
        chain_id,
        hotel_id,
        room_num,
        person_id,
        start_date,
        end_date,
        reservation_type,
        status,
        converted_from_res_id
    )
    SELECT
        chain_id,
        hotel_id,
        room_num,
        person_id,
        start_date,
        end_date,
        'renting',
        'CheckedIn',
        reservation_id
    FROM reservation_lookup
    RETURNING reservation_id, chain_id, hotel_id, room_num, person_id, start_date, end_date, converted_from_res_id
),
insert_renting AS (
    -- Step 3: Create the renting details tied to the new renting reservation
    INSERT INTO hotel_renting (
        reservation_id,
        checked_in_time,
        rental_price,
        price_paid,
        person_id
    )
    SELECT
        nrr.reservation_id,
        CURRENT_TIMESTAMP,
        (rl.daily_price * (nrr.end_date - nrr.start_date)),
        NULL,
        10
    FROM new_renting_reservation nrr
    JOIN reservation_lookup rl
      ON rl.reservation_id = nrr.converted_from_res_id
    RETURNING reservation_id
),
insert_has AS (
    -- Step 4: Link the new renting reservation to has
    INSERT INTO has (chain_id, hotel_id, room_num, reservation_id)
    SELECT
        chain_id,
        hotel_id,
        room_num,
        reservation_id
    FROM new_renting_reservation
    RETURNING reservation_id
),
archive_original_booking AS (
    -- Step 5: Archive original booking before deleting it
    INSERT INTO archived_reservation (
        archive_date,
        creation_date,
        archived_price_paid,
        archived_hotel_name,
        archived_chain_name,
        archived_room_num,
        archived_customer_id,
        archived_employee_id,
        archived_customer_name,
        archived_status,
        archived_type,
        archived_subtype,
        archived_checked_in,
        archived_checked_out,
        archived_booked_date,
        res_start_date,
        res_end_date
    )
    SELECT
        CURRENT_TIMESTAMP,
        created_at,
        NULL,
        hotel_name,
        chain_name,
        room_num,
        person_id,
        NULL,
        customer_name,
        status,
        'booking',
        'converted_from_booking',
        NULL,
        NULL,
        booked_date,
        start_date,
        end_date
    FROM reservation_lookup
    RETURNING archive_id
),
delete_original_booking AS (
    -- Step 6: Delete the original booking reservation row
    DELETE FROM hotel_reservation
    WHERE reservation_id IN (SELECT reservation_id FROM reservation_lookup)
    RETURNING reservation_id
)
-- Step 7: Mark room as occupied for the active renting reservation
UPDATE rooms
SET status = 'Occupied'
WHERE (chain_id, hotel_id, room_num) IN (
    SELECT chain_id, hotel_id, room_num FROM new_renting_reservation
);