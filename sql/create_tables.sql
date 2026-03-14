SET search_path TO "HotelProject";

-- ========================
-- Hotel Chain
-- ========================

CREATE TABLE IF NOT EXISTS hotel_chains(
	chain_id		INTEGER GENERATED ALWAYS AS IDENTITY, -- will increment surrogate key for us
	chain_name		VARCHAR(20) NOT NULL,
	country			VARCHAR(20) NOT NULL,
    city 			VARCHAR(30) NOT NULL,
    region			VARCHAR(30) NOT NULL,
	street_name		VARCHAR(30) NOT NULL, -- removed street
	street_number	SMALLINT NOT NULL,
    postalcode		CHAR(6) NOT NULL,
	PRIMARY KEY		(chain_id)
);


CREATE TABLE IF NOT EXISTS hotelchain_emails (
    chain_id        INTEGER NOT NULL,
    email           VARCHAR(35) NOT NULL,
    PRIMARY KEY (chain_id, email),
    FOREIGN KEY (chain_id) REFERENCES hotel_chains (chain_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (email SIMILAR TO '(\w|\.)+@(\w|\.)+')
);


CREATE TABLE IF NOT EXISTS hotelchain_phones (
    chain_id        INTEGER NOT NULL,
    phone_number    VARCHAR(20) NOT NULL,
    PRIMARY KEY (chain_id, phone_number),
    FOREIGN KEY (chain_id) REFERENCES hotel_chains (chain_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (phone_number SIMILAR TO '[0-9 \-\+\(\)]{7,20}')
);

-- ========================
-- PERSON
-- ========================
CREATE TABLE IF NOT EXISTS person (
    person_id       INTEGER GENERATED ALWAYS AS IDENTITY,
    first_name      VARCHAR(30) NOT NULL,
    last_name       VARCHAR(30) NOT NULL,
    ssn_type        VARCHAR(20) NOT NULL,
    ssn_number      VARCHAR(30) NOT NULL,
    country         VARCHAR(20) NOT NULL,
    city            VARCHAR(30) NOT NULL,
    region          VARCHAR(30),
    street_name     VARCHAR(30),
    street_number   SMALLINT,
    postalcode      VARCHAR(10),
    PRIMARY KEY (person_id),
    UNIQUE (ssn_number, ssn_type),
    CHECK (ssn_type IN ('SSN', 'SIN', 'Drivers License', 'Passport'))
);

-- ========================
-- Hotel
-- ========================
CREATE TABLE IF NOT EXISTS hotels (
   chain_id			INTEGER,
   hotel_id			INTEGER GENERATED ALWAYS AS IDENTITY, -- should I removed GENERATED ALWAYS AS IDENTITY cuz its (chain_id, hotel_id) that is unique, maybe too much logic?
   hotel_name		VARCHAR(25) NOT NULL,
   category			SMALLINT NOT NULL,
   country			VARCHAR(20) NOT NULL,
   city 			VARCHAR(30) NOT NULL,
   region			VARCHAR(30) NOT NULL,
   street_name		VARCHAR(30) NOT NULL, -- removed street
   street_number	SMALLINT NOT NULL,
   postalcode		CHAR(6) NOT NULL,
   manager_id		INTEGER, -- don't forget to add trigger for this

   PRIMARY KEY (chain_id, hotel_id),
   FOREIGN KEY (chain_id) references hotel_chains 
   		ON DELETE CASCADE ON UPDATE CASCADE,
   FOREIGN KEY (manager_id) REFERENCES person(person_id)  -- double check here
   		ON DELETE SET NULL ON UPDATE CASCADE,
   CHECK (postalcode SIMILAR TO '[A-Za-z0-9 \-]{3,10}'),
   CHECK (category >= 1 AND category <= 5),
   UNIQUE (chain_id, hotel_name)
);


CREATE TABLE IF NOT EXISTS hotel_email (
    chain_id        INTEGER NOT NULL,
    hotel_id        INTEGER NOT NULL,
    email           VARCHAR(35) NOT NULL,
    PRIMARY KEY (chain_id, hotel_id, email),
    FOREIGN KEY (chain_id, hotel_id) REFERENCES hotels (chain_id, hotel_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (email SIMILAR TO '(\w|\.)+@(\w|\.)+')
);


CREATE TABLE IF NOT EXISTS hotel_phone (
    chain_id        INTEGER NOT NULL,
    hotel_id        INTEGER NOT NULL,
    phone_number    VARCHAR(20) NOT NULL,
    PRIMARY KEY (chain_id, hotel_id, phone_number),
    FOREIGN KEY (chain_id, hotel_id) REFERENCES hotels (chain_id, hotel_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (phone_number SIMILAR TO '[0-9 \-\+\(\)]{7,20}')
);

-- ========================
-- ROOMS
-- ========================
CREATE TABLE IF NOT EXISTS rooms (
    chain_id        INTEGER NOT NULL,
    hotel_id        INTEGER NOT NULL,
    room_num        VARCHAR(5) NOT NULL,  -- format: FloorNumUnitNum, min 3 digits e.g. '405', assume max is 5 digits
    price           NUMERIC(8,2) NOT NULL,
    capacity        SMALLINT NOT NULL,
    view            VARCHAR(10),
    status          VARCHAR(15) NOT NULL,
    PRIMARY KEY (chain_id, hotel_id, room_num),
    FOREIGN KEY (chain_id, hotel_id) REFERENCES hotels (chain_id, hotel_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (price > 0 AND price < 100000),
    CHECK (capacity >= 1 AND capacity <= 10),
    CHECK (status IN ('Available', 'Occupied', 'Maintenance', 'Reserved')),
    CHECK (view IN ('Sea', 'Mountain', 'City', 'Garden', 'None') OR view IS NULL),
    CHECK (room_num SIMILAR TO '[0-9]{3,}')
);

CREATE TABLE IF NOT EXISTS room_amenities (
    chain_id        INTEGER NOT NULL,
    hotel_id        INTEGER NOT NULL,
    room_num        CHAR(5) NOT NULL,
    amenity         VARCHAR(20) NOT NULL,
    PRIMARY KEY (chain_id, hotel_id, room_num, amenity),
    FOREIGN KEY (chain_id, hotel_id, room_num) REFERENCES rooms (chain_id, hotel_id, room_num)
        ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE IF NOT EXISTS room_extendible (
    chain_id        INTEGER NOT NULL,
    hotel_id        INTEGER NOT NULL,
    room_num        CHAR(5) NOT NULL,
    extendible      VARCHAR(50) NOT NULL,
    PRIMARY KEY (chain_id, hotel_id, room_num, extendible),
    FOREIGN KEY (chain_id, hotel_id, room_num) REFERENCES rooms (chain_id, hotel_id, room_num)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS room_issues (
    chain_id        INTEGER NOT NULL,
    hotel_id        INTEGER NOT NULL,
    room_num        CHAR(5) NOT NULL,
    issue      		VARCHAR(100) NOT NULL,
    PRIMARY KEY (chain_id, hotel_id, room_num, issue),
    FOREIGN KEY (chain_id, hotel_id, room_num) REFERENCES rooms (chain_id, hotel_id, room_num)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ========================
-- CUSTOMER
-- ========================
CREATE TABLE IF NOT EXISTS customer (
    person_id       INTEGER,
    register_date   DATE NOT NULL,
    PRIMARY KEY (person_id),
    FOREIGN KEY (person_id) REFERENCES person (person_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (register_date <= CURRENT_DATE)
);

-- ========================
-- EMPLOYEE 
-- ========================
CREATE TABLE IF NOT EXISTS employee (
    person_id       INTEGER NOT NULL,
    chain_id        INTEGER NOT NULL,
    hotel_id        INTEGER NOT NULL,
    role            VARCHAR(20) NOT NULL,
    PRIMARY KEY (person_id),
    FOREIGN KEY (person_id) REFERENCES person (person_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (chain_id, hotel_id) REFERENCES hotels (chain_id, hotel_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ========================
-- RESERVATION
-- ========================
CREATE TABLE IF NOT EXISTS hotel_reservation (
    reservation_id          INTEGER GENERATED ALWAYS AS IDENTITY,
    chain_id                INTEGER NOT NULL,
    hotel_id                INTEGER NOT NULL,
    room_num                CHAR(3) NOT NULL,
    person_id               INTEGER NOT NULL,
    start_date              DATE NOT NULL,
    end_date                DATE NOT NULL,
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reservation_type        VARCHAR(10) NOT NULL,
    status                  VARCHAR(15) NOT NULL,
    converted_from_res_id   INTEGER,
    PRIMARY KEY (reservation_id),
    FOREIGN KEY (chain_id, hotel_id, room_num) REFERENCES rooms (chain_id, hotel_id, room_num)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (person_id) REFERENCES person (person_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CHECK (reservation_type IN ('booking', 'renting')),
    CHECK (status IN ('Pending', 'Confirmed', 'Cancelled', 'CheckedIn', 'CheckedOut', 'Completed')),
    CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS has (
	chain_id        INTEGER NOT NULL,
    hotel_id        INTEGER NOT NULL,
    room_num        CHAR(5) NOT NULL,
	reservation_id	INTEGER,

	PRIMARY KEY (chain_id, hotel_id, room_num, reservation_id),
	FOREIGN KEY (chain_id, hotel_id, room_num) REFERENCES rooms (chain_id, hotel_id, room_num)
        ON DELETE RESTRICT ON UPDATE CASCADE,
	FOREIGN KEY (reservation_id) REFERENCES hotel_reservation (reservation_id)
		ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ========================
-- BOOKING
-- ========================
CREATE TABLE IF NOT EXISTS hotel_booking (
    reservation_id  INTEGER,
    booked_date     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    future_price    NUMERIC(8,2),
    PRIMARY KEY (reservation_id),
    FOREIGN KEY (reservation_id) REFERENCES hotel_reservation (reservation_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (future_price IS NULL OR future_price > 0),
    CHECK (booked_date <= CURRENT_TIMESTAMP)
);

-- ========================
-- RENTING
-- ========================
CREATE TABLE IF NOT EXISTS hotel_renting (
    reservation_id      INTEGER,
    checked_in_time     TIMESTAMP NOT NULL,
    checked_out_time    TIMESTAMP,
    rental_price        NUMERIC(8,2) NOT NULL,
    total_price         NUMERIC(8,2),
    person_id           INTEGER,    -- employee who processed check-in
    PRIMARY KEY (reservation_id),
    FOREIGN KEY (reservation_id) REFERENCES hotel_reservation (reservation_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (person_id) REFERENCES employee (person_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CHECK (rental_price > 0),
    CHECK (total_price IS NULL OR total_price >= rental_price),
    CHECK (checked_out_time IS NULL OR checked_out_time > checked_in_time)
);

-- ========================
-- ARCHIVED RESERVATION
-- ========================
CREATE TABLE IF NOT EXISTS archived_reservation (
    archive_id              INTEGER GENERATED ALWAYS AS IDENTITY,
    archive_date            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creation_date           TIMESTAMP,
    archived_price_paid     NUMERIC(8,2),
    archived_hotel_name     VARCHAR(50),
    archived_chain_name     VARCHAR(50),
    archived_room_num       CHAR(3),
    archived_customer_id    INTEGER NOT NULL,
    archived_employee_id    INTEGER,
    archived_customer_name  VARCHAR(60) NOT NULL,
    archived_status         VARCHAR(15),
    archived_type           VARCHAR(10),
    archived_subtype        VARCHAR(30),
    archived_checked_in     TIMESTAMP,
    archived_checked_out    TIMESTAMP,
    archived_booked_date    TIMESTAMP,
    res_start_date          DATE,
    res_end_date            DATE,
    PRIMARY KEY (archive_id),
    -- No foreign keys by design (constraint 21: snapshots only)
    CHECK (archive_date <= CURRENT_TIMESTAMP),
    CHECK (archived_type IN ('booking', 'renting') OR archived_type IS NULL),
    CHECK (archived_subtype IN (
        'cancelled_booking', 'completed_booking',
        'converted_from_booking', 'direct_renting', 'completed_renting'
    ) OR archived_subtype IS NULL),
    CHECK (archived_price_paid IS NULL OR archived_price_paid >= 0),
    CHECK (res_end_date IS NULL OR res_start_date IS NULL OR res_end_date > res_start_date),
    CHECK (
        archived_type != 'renting' OR archived_price_paid IS NOT NULL
    )
);


-- see all tables
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'HotelProject'
ORDER BY table_name, ordinal_position;