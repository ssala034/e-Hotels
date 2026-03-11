SET search_path TO "HotelProject";

WITH new_person AS (
    INSERT INTO person (
        first_name, last_name, ssn_type, ssn_number, country, city, region, street_name, street_number, postalcode
    )
    VALUES('Michael', 'Smith', 'SIN', '300-348-238', 
        'Canada', 'Ottawa', 'Ontario', 'Laurier Ave E', 75, 'K1N6N5')
    
    RETURNING person_id
)

INSERT INTO customer (person_id, register_date)
SELECT 
    person_id, 
    CURRENT_DATE
FROM new_person;