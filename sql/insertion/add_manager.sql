SET search_path TO "HotelProject";

WITH new_person AS (
    -- Step 1: Create the identity in the Person table
    INSERT INTO person (
        first_name, last_name, ssn_type, ssn_number, 
        country, city, region, street_name, street_number, postalcode, email, password
    )
    VALUES (
        'Alice', 'Lait', 'SIN', '555-000-111', 
        'Canada', 'Ottawa', 'Ontario', 'Metcalfe St', 100, 'K1P5M1', 'alice.lait@hotels.com', 'password123'
    )
    RETURNING person_id
),
new_employee AS (
    -- Step 2: Register them as an Employee for Hotel 5
    -- We use the ChainID lookup to ensure they are assigned to the correct chain
    INSERT INTO employee (person_id, chain_id, hotel_id, role)
    SELECT 
        person_id, 
        (SELECT chain_id FROM hotels  WHERE hotel_id = 5), 
        5, 
        'Manager' -- Must contain "Manager" 
    FROM new_person
    RETURNING person_id
)
-- Step 3: Set this new employee as the ManagerID for Hotel 5
UPDATE hotels
SET manager_id = (SELECT person_id FROM new_employee)
WHERE hotel_id = 5;