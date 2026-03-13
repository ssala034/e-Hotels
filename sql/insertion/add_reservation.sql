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
        '2026-04-01', -- Start Date
        '2026-04-05', -- End Date
        CURRENT_TIMESTAMP, 
        'booking',    -- Type must be 'booking' per business rules 
        'Confirmed', 
        1,           -- The PersonID of the Customer
        chain_id, hotel_id, room_num
    FROM room_data
    RETURNING reservation_id, start_date, end_date, (SELECT price FROM room_data) as daily_price
)

INSERT INTO hotel_booking (reservation_id, booked_date, future_price)
SELECT 
    reservation_id, 
    CURRENT_TIMESTAMP,
    -- FuturePrice calculation: (EndDate - StartDate) * DailyPrice [cite: 108]
    (end_date - start_date) * daily_price
FROM new_reservation;