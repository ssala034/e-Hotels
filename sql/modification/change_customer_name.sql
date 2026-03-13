SET search_path TO "HotelProject";

UPDATE person
SET 
    first_name = 'Michelle', 
    last_name = 'Jackson'
WHERE ssn_number = '300-348-238' 
  AND ssn_type = 'SIN'
  AND person_id IN (SELECT person_id FROM customer);