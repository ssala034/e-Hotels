SET search_path TO "HotelProject";

INSERT INTO room_issue (chain_id, hotel_id, room_num, room_issue)
SELECT 1, 1, '101', 'Bathroom light flickering'
WHERE NOT EXISTS (
    SELECT 1 FROM room_issue 
    WHERE chain_id = 1 
      AND hotel_id = 1 
      AND room_num = '101' 
      AND room_issue = 'Bathroom light flickering'
);

UPDATE rooms
SET status = 'Maintenance'
WHERE chain_id = 1 AND hotel_id = 1 AND room_num = '101';