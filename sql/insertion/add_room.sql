SET search_path TO "HotelProject";

-- add a room to hotel 5
WITH hotel_info AS (
    SELECT chain_id, hotel_id 
    FROM hotels 
    WHERE hotel_id = 5
),

new_room AS (
    INSERT INTO rooms (chain_id, hotel_id, room_num, price, capacity, view, status)
    SELECT 
        chain_id, 
        hotel_id, 
        '501',     
        250.00,     
        2,        
        'Sea',    
        'Available' 
    FROM hotel_info
    RETURNING chain_id, hotel_id, room_num
)
INSERT INTO room_amenities (chain_id, hotel_id, room_num, amenity)
SELECT chain_id, hotel_id, room_num, 'Ocean View'
FROM new_room;