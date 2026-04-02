SET search_path TO "HotelProject";

CREATE OR REPLACE FUNCTION trg_delete_room()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Called from hotel/chain cascade — exit immediately, parent handles everything
    IF pg_trigger_depth() > 1 THEN
        RETURN OLD;
    END IF;

    -- Direct single room deletion — safe to JOIN hotels/hotel_chains (no mid-delete conflict)
    INSERT INTO archived_reservation (
        archive_date,
        creation_date,
        archived_price_paid,
        archived_hotel_name,
        archived_chain_name,
        archived_room_num,
        archived_customer_id,
        archived_employee_id,
        archived_customer_name,
        archived_status,
        archived_type,
        archived_subtype,
        archived_checked_in,
        archived_checked_out,
        archived_booked_date,
        res_start_date,
        res_end_date
    )
    SELECT
        CURRENT_TIMESTAMP,
        hr.created_at,
        CASE
            WHEN hr.reservation_type = 'renting' THEN hrt.price_paid
            ELSE NULL
        END,
        h.hotel_name,
        hc.chain_name,
        hr.room_num,
        hr.person_id,
        hrt.person_id,
        COALESCE(NULLIF(TRIM(CONCAT(p.first_name, ' ', p.last_name)), ''), 'Unknown Customer'),
        hr.status,
        hr.reservation_type,
        CASE
            WHEN hr.reservation_type = 'booking' AND hr.status = 'Cancelled' THEN 'cancelled_booking'
            WHEN hr.reservation_type = 'booking' THEN 'completed_booking'
            WHEN hr.reservation_type = 'renting' AND hr.converted_from_res_id IS NOT NULL THEN 'converted_from_booking'
            WHEN hr.reservation_type = 'renting' AND hr.status IN ('Completed', 'CheckedOut') THEN 'completed_renting'
            ELSE 'direct_renting'
        END,
        hrt.checked_in_time,
        hrt.checked_out_time,
        hb.booked_date,
        hr.start_date,
        hr.end_date
    FROM hotel_reservation hr
    LEFT JOIN hotels h
        ON h.chain_id = hr.chain_id AND h.hotel_id = hr.hotel_id
    LEFT JOIN hotel_chains hc
        ON hc.chain_id = hr.chain_id
    LEFT JOIN person p
        ON p.person_id = hr.person_id
    LEFT JOIN hotel_booking hb
        ON hb.reservation_id = hr.reservation_id
    LEFT JOIN hotel_renting hrt
        ON hrt.reservation_id = hr.reservation_id
    WHERE hr.chain_id = OLD.chain_id
      AND hr.hotel_id = OLD.hotel_id
      AND TRIM(hr.room_num) = TRIM(OLD.room_num);

    DELETE FROM has hs
    USING hotel_reservation hr
    WHERE hs.reservation_id = hr.reservation_id
      AND hr.chain_id = OLD.chain_id
      AND hr.hotel_id = OLD.hotel_id
      AND TRIM(hr.room_num) = TRIM(OLD.room_num);

    DELETE FROM hotel_reservation
    WHERE chain_id = OLD.chain_id
      AND hotel_id = OLD.hotel_id
      AND TRIM(room_num) = TRIM(OLD.room_num);

    RETURN OLD;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'trg_delete_room failed for room %: %', OLD.room_num, SQLERRM;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_room ON rooms;

CREATE TRIGGER trg_delete_room
    BEFORE DELETE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION trg_delete_room();

-- Example
-- DELETE FROM rooms WHERE chain_id = 1 AND hotel_id = 1 AND TRIM(room_num) = '101';