SET search_path TO "HotelProject";

CREATE OR REPLACE FUNCTION trg_delete_chain()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_chain_name TEXT;
    v_hotel_name TEXT;
    v_hotel_id   INTEGER;
BEGIN
    v_chain_name := OLD.chain_name;

    -- Loop over each hotel in the chain
    FOR v_hotel_id, v_hotel_name IN
        SELECT hotel_id, hotel_name
        FROM hotels
        WHERE chain_id = OLD.chain_id
    LOOP
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
            v_hotel_name,
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
          AND hr.hotel_id = v_hotel_id;

        -- Step 2: Clean up reservation dependencies
        DELETE FROM has hs
        USING hotel_reservation hr
        WHERE hs.reservation_id = hr.reservation_id
          AND hr.chain_id = OLD.chain_id
          AND hr.hotel_id = v_hotel_id;

        DELETE FROM hotel_reservation
        WHERE chain_id = OLD.chain_id
          AND hotel_id = v_hotel_id;

        -- Step 3: Delete rooms (trg_delete_room exits immediately at depth > 1)
        DELETE FROM rooms
        WHERE chain_id = OLD.chain_id
          AND hotel_id = v_hotel_id;

        -- Step 4: Delete person rows directly then employees
        -- (trg_delete_employee exits immediately at depth > 1)
        DELETE FROM person
        WHERE person_id IN (
            SELECT person_id FROM employee
            WHERE chain_id = OLD.chain_id
              AND hotel_id = v_hotel_id
        );

        DELETE FROM employee
        WHERE chain_id = OLD.chain_id
          AND hotel_id = v_hotel_id;

    END LOOP;

    -- Step 5: Delete all hotels (trg_delete_hotel exits immediately at depth > 1)
    DELETE FROM hotels
    WHERE chain_id = OLD.chain_id;

    RETURN OLD;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'trg_delete_chain failed for chain_id %: %', OLD.chain_id, SQLERRM;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_chain ON hotel_chains;

CREATE TRIGGER trg_delete_chain
    BEFORE DELETE ON hotel_chains
    FOR EACH ROW
    EXECUTE FUNCTION trg_delete_chain();

-- Example
-- DELETE FROM hotel_chains WHERE chain_id = 1;