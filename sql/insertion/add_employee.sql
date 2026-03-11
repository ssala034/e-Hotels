SET search_path TO "HotelProject";

WITH new_person AS (
    INSERT INTO person (
        first_name, last_name, ssn_type, ssn_number, country, city, region, street_name, street_number, postalcode
    )
    VALUES('Jane', 'Smith', 'SIN', '123-999-000', 
        'Canada', 'Ottawa', 'Ontario', 'Laurier Ave E', 75, 'K1N6N5')
    
    RETURNING person_id
)
INSERT INTO employee (person_id, chain_id, hotel_id, role)
SELECT 
    person_id, 
    1,             -- The ChainID this employee works for
    5,             -- The HotelID this employee works for
    'Receptionist' -- The specific role
FROM new_person;