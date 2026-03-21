SET search_path TO "HotelProject";

DROP MATERIALIZED VIEW IF EXISTS rooms_per_area;

CREATE MATERIALIZED VIEW rooms_per_area AS
SELECT
    h.region,
    hc.chain_name,
    h.hotel_name,
    COUNT(*) FILTER (WHERE r.status = 'Available') AS available_rooms
FROM hotels h JOIN hotel_chains hc 
     ON hc.chain_id = h.chain_id LEFT JOIN rooms r 
     ON r.chain_id = h.chain_id AND r.hotel_id = h.hotel_id
GROUP BY
    h.region,
    hc.chain_name,
    h.hotel_name;