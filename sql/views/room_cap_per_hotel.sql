SET search_path TO "HotelProject";

DROP MATERIALIZED VIEW IF EXISTS rooms_cap_per_hotel;

CREATE MATERIALIZED VIEW rooms_cap_per_hotel AS
SELECT
    h.chain_id,
    h.hotel_id,
    h.hotel_name,
    COALESCE(SUM(r.capacity), 0) AS aggregate_capacity
FROM hotels h LEFT JOIN rooms r
   ON r.chain_id = h.chain_id
   AND r.hotel_id = h.hotel_id
GROUP BY
    h.chain_id,
    h.hotel_id,
    h.hotel_name;

-- select * from rooms_cap_per_hotel;