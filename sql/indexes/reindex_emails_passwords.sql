-- In case of major repair to DB
SET search_path TO "HotelProject";
REINDEX INDEX idx_emails_passwords;