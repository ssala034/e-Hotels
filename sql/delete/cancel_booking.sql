SET search_path TO "HotelProject";

-- This query cancels a booking by moving it to the archived_reservation table and deleting it from the active tables.
-- It assumes the reservation_id of the booking to be cancelled is provided as a parameter.

WITH booking_to_cancel AS (
    SELECT 
        hr.reservation_id,
        hr.created_at,
        h.hotel_name,
        hc.chain_name,
        hr.room_num,
        hr.person_id AS customer_id,
        p.first_name || ' ' || p.last_name AS customer_name,
        hr.status,
        hr.reservation_type,
        hb.booked_date,
        hr.start_date,
        hr.end_date
    FROM "HotelProject".hotel_reservation hr
    JOIN "HotelProject".hotel_booking hb ON hr.reservation_id = hb.reservation_id
    JOIN "HotelProject".rooms r ON hr.chain_id = r.chain_id AND hr.hotel_id = r.hotel_id AND hr.room_num = r.room_num
    JOIN "HotelProject".hotels h ON r.chain_id = h.chain_id AND r.hotel_id = h.hotel_id
    JOIN "HotelProject".hotel_chains hc ON h.chain_id = hc.chain_id
    JOIN "HotelProject".person p ON hr.person_id = p.person_id
    WHERE hr.reservation_id = %s -- Placeholder for the reservation_id
),
archived AS (
    INSERT INTO "HotelProject".archived_reservation (
        creation_date,
        archived_price_paid,
        archived_hotel_name,
        archived_chain_name,
        archived_room_num,
        archived_customer_id,
        archived_customer_name,
        archived_status,
        archived_type,
        archived_subtype,
        archived_booked_date,
        res_start_date,
        res_end_date
    )
    SELECT
        created_at,
        NULL, -- Bookings do not have a price paid upon cancellation
        hotel_name,
        chain_name,
        room_num,
        customer_id,
        customer_name,
        status,
        reservation_type,
        'cancelled_booking',
        booked_date,
        start_date,
        end_date
    FROM booking_to_cancel
    RETURNING 1
),
delete_has AS (
    DELETE FROM "HotelProject".has
    WHERE reservation_id IN (SELECT reservation_id FROM booking_to_cancel)
    RETURNING 1
)
DELETE FROM "HotelProject".hotel_reservation
WHERE reservation_id IN (SELECT reservation_id FROM booking_to_cancel);



