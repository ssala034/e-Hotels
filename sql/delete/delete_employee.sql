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
        WHERE manager_id = p_person_id -- can't delete the employee if he is a manager, user defined constraint, must make a new one first
    ) THEN
        RETURN;
    END IF;

    DELETE FROM employee
    WHERE person_id = p_person_id;

    -- assign the renting to the manager of the hotel, user defined constraint
    UPDATE hotel_renting
    SET person_id = (SELECT manager_id FROM hotels WHERE manager_id = p_person_id)
    WHERE person_id = p_person_id;

    DELETE FROM person
    WHERE person_id = p_person_id;
END;
$$;

-- Example
-- CALL sp_delete_employee(12);


-- remove this check because don't make sense why? cause person_id is unique, so if he is also a customer, they will have different id for them

-- -- only delete from person if the person is not a customer, if he is a customer then let him live, will finally get him then
--     IF NOT EXISTS (
--         SELECT 1
--         FROM customer
--         WHERE person_id = p_person_id
--     ) THEN