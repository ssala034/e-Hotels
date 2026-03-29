SET search_path TO "HotelProject";

-- 1. Extend the stay by 7 days ONLY for extendible rooms (Room 102)
UPDATE hotel_reservation
SET end_date = end_date + INTERVAL '7 days'
WHERE hotel_id = 1 AND room_num = '102'
  AND EXISTS (
      SELECT 1 FROM room_extendible 
      WHERE hotel_id = 1 AND room_num = '102' AND extendible = 'Yes'
  );

-- 2. Recalculate the rental amount and reset payment state
UPDATE hotel_renting
SET rental_price = (
        SELECT rm.price * (hr.end_date - hr.start_date)
        FROM hotel_reservation hr
        JOIN rooms rm ON rm.hotel_id = hr.hotel_id AND TRIM(rm.room_num) = TRIM(hr.room_num)
        WHERE hr.hotel_id = 1 AND hr.room_num = '102'
    ),
    price_paid = NULL
WHERE reservation_id = (
    SELECT reservation_id FROM hotel_reservation 
    WHERE hotel_id = 1 AND room_num = '102'
);