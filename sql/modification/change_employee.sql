SET search_path TO "HotelProject";

UPDATE employee
SET hotel_id = 4,
    role = 'General Manager'
WHERE person_id = 1;

UPDATE hotels
SET manager_id = 1
WHERE hotel_id = 4;

-- promote employee id=1 to manager for another hotel under the same chain