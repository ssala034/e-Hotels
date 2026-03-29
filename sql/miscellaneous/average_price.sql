-- Average room price for hotels in a hotel_chain
SET search_path TO "HotelProject";

SELECT
	h.hotel_id,
    AVG(r.price) AS average_room_price
FROM rooms r
JOIN hotels h ON r.hotel_id = h.hotel_id
WHERE h.chain_id = 1 -- Random hotel chain ID
GROUP BY h.hotel_id, h.category;