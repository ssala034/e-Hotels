UPDATE hotel_renting
SET price_paid = rental_price
WHERE reservation_id = 2
  AND person_id = 41
  AND price_paid IS NULL
  AND 999.99::numeric >= rental_price
RETURNING rental_price;