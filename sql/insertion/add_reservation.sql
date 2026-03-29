SET search_path TO "HotelProject";

WITH room_data AS (
    SELECT chain_id, hotel_id, room_num, price
    FROM rooms
    WHERE hotel_id = 5 AND room_num = '501'
),
new_reservation AS (
    INSERT INTO hotel_reservation (
        start_date, end_date, created_at, 
        reservation_type, status, person_id,
        chain_id, hotel_id, room_num
    )
    SELECT 
        '2026-04-01', 
        '2026-04-05', 
        CURRENT_TIMESTAMP, 
        'booking', 
        'Confirmed', 
        1, 
        chain_id, hotel_id, room_num
    FROM room_data
    WHERE NOT EXISTS ( -- don't want to make a reservation if there's already a conflicting one
        SELECT 1 
        FROM hotel_reservation r
        WHERE r.hotel_id = (SELECT hotel_id FROM room_data)
          AND r.chain_id = (SELECT chain_id FROM room_data)
          AND r.room_num = (SELECT room_num FROM room_data)
          AND r.status NOT IN ('Cancelled', 'CheckedOut', 'Completed')
          AND r.start_date < '2026-04-05' 
          AND r.end_date > '2026-04-01'
    );
    
    RETURNING reservation_id, chain_id, hotel_id, room_num, start_date, end_date, (SELECT price FROM room_data) as daily_price
),
booking_insert AS (
    INSERT INTO hotel_booking (reservation_id, booked_date, future_price)
    SELECT 
        reservation_id, 
        CURRENT_TIMESTAMP,
        (end_date - start_date) * daily_price * 1.23
    FROM new_reservation
    RETURNING reservation_id
)
INSERT INTO has (chain_id, hotel_id, room_num, reservation_id)
SELECT
    chain_id,
    hotel_id,
    room_num,
    reservation_id
FROM new_reservation;