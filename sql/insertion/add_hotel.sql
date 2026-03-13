SET search_path TO "HotelProject";

CREATE OR REPLACE FUNCTION update_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hotel_id IS NULL THEN
        SELECT COALESCE(MAX(hotel_id), 0) + 1 
        INTO NEW.hotel_id
        FROM hotels 
        WHERE chain_id = NEW.chain_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_insert ON "hotels";
CREATE TRIGGER after_insert
AFTER INSERT ON "hotels"
FOR EACH ROW
EXECUTE FUNCTION update_count();

INSERT INTO "hotels" (
    "chain_id", "hotel_name", "category", 
    "country", "city", "region", "stree_number", "street_name", "postalcode"
)
VALUES (
    3,       
    'E-Hotel Downtown', 
    4,         
    'Canada', 'Ottawa', 'Ontario', 150, 'Elgin St', 'K2P1L4'
);

INSERT INTO hotel_email (chain_id, hotel_id, email)
VALUES (3, (SELECT hotel_id FROM hotels WHERE hotel_name = 'E-Hotel Downtown' AND chain_id = 3), 'downtown@ehotel.ca');

INSERT INTO hotel_phone (chain_id, hotel_id, phone_number)
VALUES (3, (SELECT hotel_id FROM hotels WHERE hotel_name = 'E-Hotel Downtown' AND chain_id = 3), '613-555-0111');