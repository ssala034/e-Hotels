SET search_path TO "HotelProject";

CREATE OR REPLACE FUNCTION trg_delete_employee_before()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Nested deletes from hotel/chain cleanup should only remove employee rows.
    IF pg_trigger_depth() > 1 THEN
        RETURN OLD;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM hotels
        WHERE manager_id = OLD.person_id
    ) AND pg_trigger_depth() = 1 THEN
        RETURN NULL;
    END IF;

    -- Direct employee delete flow: clear renting handler.
    UPDATE hotel_renting
    SET person_id = NULL
    WHERE person_id = OLD.person_id;

    RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION trg_delete_employee_after()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete person only when no remaining role references exist.
    IF NOT EXISTS (
        SELECT 1
        FROM employee
        WHERE person_id = OLD.person_id
    )
    AND NOT EXISTS (
        SELECT 1
        FROM customer
        WHERE person_id = OLD.person_id
    )
    AND NOT EXISTS (
        SELECT 1
        FROM hotels
        WHERE manager_id = OLD.person_id
    ) THEN
        DELETE FROM person
        WHERE person_id = OLD.person_id;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_employee ON employee;
DROP TRIGGER IF EXISTS trg_delete_employee_after ON employee;

CREATE TRIGGER trg_delete_employee
    BEFORE DELETE ON employee
    FOR EACH ROW
    EXECUTE FUNCTION trg_delete_employee_before();

CREATE TRIGGER trg_delete_employee_after
    AFTER DELETE ON employee
    FOR EACH ROW
    EXECUTE FUNCTION trg_delete_employee_after();

-- Example
-- DELETE FROM employee WHERE person_id = 12;
