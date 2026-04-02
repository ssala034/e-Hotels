SET search_path TO "HotelProject";

CREATE OR REPLACE FUNCTION trg_delete_hotel()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_chain_name TEXT;
BEGIN
    -- Chain trigger already handles hotel internals; avoid duplicate work on nested calls.
    IF pg_trigger_depth() > 1 THEN
        RETURN OLD;
    END IF;

    SELECT chain_name INTO v_chain_name
    FROM hotel_chains
    WHERE chain_id = OLD.chain_id;

    -- Step 1: Archive all reservations for this hotel
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
        OLD.hotel_name,
        v_chain_name,
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
    LEFT JOIN person p
        ON p.person_id = hr.person_id
    LEFT JOIN hotel_booking hb
        ON hb.reservation_id = hr.reservation_id
    LEFT JOIN hotel_renting hrt
        ON hrt.reservation_id = hr.reservation_id
    WHERE hr.chain_id = OLD.chain_id
      AND hr.hotel_id = OLD.hotel_id;

    -- Step 2: Clean up reservation dependencies
    DELETE FROM has hs
    USING hotel_reservation hr
    WHERE hs.reservation_id = hr.reservation_id
      AND hr.chain_id = OLD.chain_id
      AND hr.hotel_id = OLD.hotel_id;

    DELETE FROM hotel_reservation
    WHERE chain_id = OLD.chain_id
      AND hotel_id = OLD.hotel_id;

    -- Step 3: Delete rooms (trg_delete_room exits at depth > 1)
    DELETE FROM rooms
    WHERE chain_id = OLD.chain_id
      AND hotel_id = OLD.hotel_id;

    -- Step 4: Delete person rows for non-manager employees (chain-style cleanup).
    DELETE FROM person
    WHERE person_id IN (
        SELECT e.person_id
        FROM employee e
        WHERE e.chain_id = OLD.chain_id
          AND e.hotel_id = OLD.hotel_id
          AND e.person_id <> OLD.manager_id
    );

    -- Step 5: Delete all employees for this hotel (manager included).
    DELETE FROM employee
    WHERE chain_id = OLD.chain_id
      AND hotel_id = OLD.hotel_id;

    RETURN OLD;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'trg_delete_hotel failed for hotel_id %: %', OLD.hotel_id, SQLERRM;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_hotel ON hotels;
DROP TRIGGER IF EXISTS trg_delete_hotel_manager_person ON hotels;

CREATE TRIGGER trg_delete_hotel
    BEFORE DELETE ON hotels
    FOR EACH ROW
    EXECUTE FUNCTION trg_delete_hotel();

CREATE OR REPLACE FUNCTION trg_delete_hotel_manager_person()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Remove former manager person row only when no role/reference remains.
    IF OLD.manager_id IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM employee WHERE person_id = OLD.manager_id
       )
       AND NOT EXISTS (
           SELECT 1 FROM customer WHERE person_id = OLD.manager_id
       )
       AND NOT EXISTS (
           SELECT 1 FROM hotels WHERE manager_id = OLD.manager_id
       ) THEN
        DELETE FROM person
        WHERE person_id = OLD.manager_id;
    END IF;

    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_delete_hotel_manager_person
    AFTER DELETE ON hotels
    FOR EACH ROW
    EXECUTE FUNCTION trg_delete_hotel_manager_person();

-- Example
-- DELETE FROM hotels WHERE chain_id = 1 AND hotel_id = 1;