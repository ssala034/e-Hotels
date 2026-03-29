SET search_path TO "HotelProject";

CREATE OR REPLACE PROCEDURE sp_delete_customer(
    p_person_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM customer
        WHERE person_id = p_person_id
    ) THEN
            RETURN;
    END IF;

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
    WHERE hr.person_id = p_person_id;

    DELETE FROM has hs
    USING hotel_reservation hr
    WHERE hs.reservation_id = hr.reservation_id
      AND hr.person_id = p_person_id;

    DELETE FROM hotel_reservation hr
    WHERE hr.person_id = p_person_id;

    IF EXISTS (
        SELECT 1
        FROM employee
        WHERE person_id = p_person_id
    ) THEN
        DELETE FROM customer
        WHERE person_id = p_person_id;
    ELSE
        DELETE FROM person
        WHERE person_id = p_person_id;
    END IF;
END;
$$;

-- Example
-- CALL sp_delete_customer(5);


-- removed active reservation check clause

-- IF EXISTS (
--         SELECT 1
--         FROM hotel_reservation hr
--         WHERE hr.person_id = p_person_id
--           AND hr.status IN ('Pending', 'Confirmed', 'CheckedIn')
--     ) THEN
--             RETURN;
--     END IF;