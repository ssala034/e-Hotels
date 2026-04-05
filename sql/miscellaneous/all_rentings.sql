SET search_path TO "HotelProject";

SELECT
    hr.reservation_id,
    hr.person_id AS customer_person_id,
    hr.chain_id,
    hr.hotel_id,
    hr.room_num,
    hr.start_date,
    hr.end_date,
    hr.created_at,
    hr.status,
    hr.converted_from_res_id,
    hrt.person_id AS employee_person_id,
    hrt.rental_price,
    hrt.price_paid,
    r.price AS room_price,
    r.capacity,
    r.view,
    r.status AS room_status,
    h.hotel_name,
    h.category AS hotel_category,
    h.country AS hotel_country,
    h.city AS hotel_city,
    h.region AS hotel_region,
    h.street_name AS hotel_street_name,
    h.street_number AS hotel_street_number,
    h.postalcode AS hotel_postalcode,
    h.manager_id,
    (
        SELECT he.email
        FROM hotel_email he
        WHERE he.chain_id = h.chain_id
            AND he.hotel_id = h.hotel_id
        ORDER BY he.email
        LIMIT 1
    ) AS hotel_contact_email,
    (
        SELECT hp.phone_number
        FROM hotel_phone hp
        WHERE hp.chain_id = h.chain_id
            AND hp.hotel_id = h.hotel_id
        ORDER BY hp.phone_number
        LIMIT 1
    ) AS hotel_contact_phone,
    (
        SELECT COUNT(*)
        FROM rooms rr
        WHERE rr.chain_id = h.chain_id
            AND rr.hotel_id = h.hotel_id
    ) AS hotel_room_count,
    p.first_name AS customer_first_name,
    p.last_name AS customer_last_name,
    p.email AS customer_email,
    p.country AS customer_country,
    p.city AS customer_city,
    p.region AS customer_region,
    p.street_name AS customer_street_name,
    p.street_number AS customer_street_number,
    p.postalcode AS customer_postalcode,
    p.ssn_type AS customer_ssn_type,
    p.ssn_number AS customer_ssn_number,
    c.register_date AS customer_register_date,
    CASE
        WHEN r.capacity = 1 THEN 'Single'
        WHEN r.capacity = 2 THEN 'Double'
        WHEN r.capacity = 3 THEN 'Triple'
        WHEN r.capacity = 4 THEN 'Family'
        ELSE 'Suite'
    END AS room_capacity_label,
    CASE
        WHEN COALESCE(r.view, 'None') = 'None' THEN 'No View'
        ELSE r.view || ' View'
    END AS view_type,
    EXISTS (
        SELECT 1
        FROM room_extendible re
        WHERE re.chain_id = r.chain_id
            AND re.hotel_id = r.hotel_id
            AND TRIM(re.room_num) = TRIM(r.room_num)
    ) AS is_extendable,
    (
        SELECT ARRAY_AGG(ra.amenity ORDER BY ra.amenity)
        FROM room_amenities ra
        WHERE ra.chain_id = r.chain_id
            AND ra.hotel_id = r.hotel_id
            AND TRIM(ra.room_num) = TRIM(r.room_num)
    ) AS amenities,
    (
        SELECT ARRAY_AGG(ri.issue ORDER BY ri.issue)
        FROM room_issues ri
        WHERE ri.chain_id = r.chain_id
            AND ri.hotel_id = r.hotel_id
            AND TRIM(ri.room_num) = TRIM(r.room_num)
    ) AS issues
FROM hotel_reservation hr
JOIN hotel_renting hrt
    ON hrt.reservation_id = hr.reservation_id
JOIN rooms r
    ON r.chain_id = hr.chain_id
    AND r.hotel_id = hr.hotel_id
    AND TRIM(r.room_num) = TRIM(hr.room_num)
JOIN hotels h
    ON h.chain_id = hr.chain_id
    AND h.hotel_id = hr.hotel_id
JOIN person p
    ON p.person_id = hr.person_id
JOIN customer c
    ON c.person_id = hr.person_id
WHERE hr.reservation_type = 'renting'
ORDER BY hr.created_at DESC;