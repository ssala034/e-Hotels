SET search_path TO "HotelProject";

-- Refresh materialized view when source tables change.
CREATE OR REPLACE FUNCTION refresh_rooms_cap_per_hotel_mv_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW rooms_cap_per_hotel;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS refresh_rooms_cap_per_hotel_mv_on_rooms ON rooms;
CREATE TRIGGER refresh_rooms_cap_per_hotel_mv_on_rooms
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
ON rooms
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_rooms_cap_per_hotel_mv_fn();

DROP TRIGGER IF EXISTS refresh_rooms_cap_per_hotel_mv_on_hotels ON hotels;
CREATE TRIGGER refresh_rooms_cap_per_hotel_mv_on_hotels
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
ON hotels
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_rooms_cap_per_hotel_mv_fn();
