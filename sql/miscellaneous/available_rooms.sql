SELECT
  r.chain_id,
  r.hotel_id,
  r.room_num,
  r.price,
  r.capacity,
  r.view,
  r.status,
  (
    SELECT ARRAY_AGG(ra.amenity ORDER BY ra.amenity)
    FROM room_amenities ra
    WHERE ra.chain_id = r.chain_id
      AND ra.hotel_id = r.hotel_id
      AND ra.room_num = r.room_num
  ) AS amenities,
  EXISTS (
    SELECT 1
    FROM room_extendible re
    WHERE re.chain_id = r.chain_id
      AND re.hotel_id = r.hotel_id
      AND re.room_num = r.room_num
  ) AS is_extendable,
  (
    SELECT ARRAY_AGG(re.extendible ORDER BY re.extendible)
    FROM room_extendible re
    WHERE re.chain_id = r.chain_id
      AND re.hotel_id = r.hotel_id
      AND re.room_num = r.room_num
  ) AS extendable_with,
  (
    SELECT ARRAY_AGG(ri.issue ORDER BY ri.issue)
    FROM room_issues ri
    WHERE ri.chain_id = r.chain_id
      AND ri.hotel_id = r.hotel_id
      AND ri.room_num = r.room_num
  ) AS issues
FROM rooms r
WHERE r.status = 'Available'
ORDER BY r.chain_id, r.hotel_id, r.room_num;