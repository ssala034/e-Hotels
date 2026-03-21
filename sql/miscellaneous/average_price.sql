SET search_path TO "HotelProject";

SELECT
    h.category AS stars, 
    AVG(r.price) AS average_room_price
FROM rooms r
JOIN hotels h ON r.hotel_id = h.hotel_id
GROUP BY h.category
ORDER BY stars DESC;
