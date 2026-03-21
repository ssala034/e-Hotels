SET search_path TO "HotelProject";

CREATE OR REPLACE FUNCTION refresh_rooms_per_area_mv_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW rooms_per_area;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS refresh_rooms_per_area_mv_on_rooms ON rooms;
CREATE TRIGGER refresh_rooms_per_area_mv_on_rooms
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
ON rooms
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_rooms_per_area_mv_fn();

DROP TRIGGER IF EXISTS refresh_rooms_per_area_mv_on_hotels ON hotels;
CREATE TRIGGER refresh_rooms_per_area_mv_on_hotels
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
ON hotels
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_rooms_per_area_mv_fn();

DROP TRIGGER IF EXISTS refresh_rooms_per_area_mv_on_hotel_chains ON hotel_chains;
CREATE TRIGGER refresh_rooms_per_area_mv_on_hotel_chains
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
ON hotel_chains
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_rooms_per_area_mv_fn();
