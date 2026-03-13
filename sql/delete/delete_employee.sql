SET search_path TO "HotelProject";

CREATE OR REPLACE PROCEDURE sp_delete_employee(
    p_person_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM employee
        WHERE person_id = p_person_id
    ) THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM hotels
        WHERE manager_id = p_person_id
    ) THEN
        RETURN;
    END IF;

    DELETE FROM employee
    WHERE person_id = p_person_id;

    IF NOT EXISTS (
        SELECT 1
        FROM customer
        WHERE person_id = p_person_id
    ) THEN
        DELETE FROM person
        WHERE person_id = p_person_id;
    END IF;
END;
$$;

-- Example
-- CALL sp_delete_employee(12);
