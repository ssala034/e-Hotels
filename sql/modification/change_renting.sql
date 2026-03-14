SET search_path TO "HotelProject";

-- 1. Extend the stay by 7 days ONLY for extendible rooms (Room 102)
UPDATE hotel_reservation
SET end_date = end_date + INTERVAL '7 days'
WHERE hotel_id = 1 AND room_num = '102'
  AND EXISTS (
      SELECT 1 FROM room_extendible 
      WHERE hotel_id = 1 AND room_num = '102' AND extendible = 'Yes'
  );

-- 2. Recalculate the Total Price for the modified stay
UPDATE hotel_renting
SET total_price = rental_price * (
    SELECT (end_date - start_date) 
    FROM hotel_reservation 
    WHERE hotel_id = 1 AND room_num = '102'
)
WHERE reservation_id = (
    SELECT reservation_id FROM hotel_reservation 
    WHERE hotel_id = 1 AND room_num = '102'
);