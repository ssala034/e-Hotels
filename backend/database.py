import psycopg2
from psycopg2.extras import RealDictCursor
from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
from datetime import datetime


def _parse_iso_date(date_value):
    return datetime.strptime(str(date_value), "%Y-%m-%d").date()


def _validate_date_range(check_in, check_out):
    try:
        check_in_date = _parse_iso_date(check_in)
        check_out_date = _parse_iso_date(check_out)
    except (TypeError, ValueError):
        raise ValueError("Invalid date format. Use YYYY-MM-DD.")

    if check_in_date >= check_out_date:
        raise ValueError("Check-out date must be after check-in date")

    return check_in_date, check_out_date


def _normalize_id_type(id_type):
    if not id_type:
        return "SSN"
    if id_type == "Driver License":
        return "Drivers License"
    return id_type


def _display_id_type(id_type):
    if id_type == "Drivers License":
        return "Driver License"
    return id_type


def _split_street(street):
    if not street:
        return None, ""
    text = str(street).strip()
    if not text:
        return None, ""
    first, *rest = text.split(" ", 1)
    street_number = None
    street_name = text
    if first.isdigit():
        street_number = int(first)
        street_name = rest[0].strip() if rest else ""
    return street_number, street_name


def _map_employee_row(row):
    return {
        "id": f"emp-{row['person_id']}",
        "personId": row["person_id"],
        "firstName": row["first_name"],
        "lastName": row["last_name"],
        "email": row["email"],
        "address": {
            "street": f"{row['street_number']} {row['street_name']}".strip(),
            "city": row["city"],
            "stateProvince": row["region"],
            "zipCode": row["postalcode"],
            "country": row["country"],
        },
        "ssnSin": row["ssn_number"],
        "role": row["role"],
        "hotelId": f"hotel-{row['hotel_id']}",
        "chainId": f"chain-{row['chain_id']}",
    }


def _map_customer_row(row):
    return {
        "id": f"cust-{row['person_id']}",
        "personId": row["person_id"],
        "firstName": row["first_name"],
        "lastName": row["last_name"],
        "email": row["email"],
        "phone": "",
        "address": {
            "street": f"{row['street_number']} {row['street_name']}".strip(),
            "city": row["city"],
            "stateProvince": row["region"],
            "zipCode": row["postalcode"],
            "country": row["country"],
        },
        "idType": _display_id_type(row["ssn_type"]),
        "idNumber": row["ssn_number"],
        "registrationDate": row["register_date"].isoformat(),
    }

def get_connection():
    """Get a connection to the PostgreSQL database."""
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )

    # Ensures all queries run with the correct schema
    with conn.cursor() as cur:
        cur.execute('SET search_path TO "HotelProject", public;')
    return conn

def _extract_numeric_id(value):
    """Accept plain numeric IDs or prefixed IDs like 'hotel-12'."""
    if value is None:
        return None
    if isinstance(value, int):
        return value
    text = str(value)
    if "-" in text:
        text = text.rsplit("-", 1)[-1]
    try:
        return int(text)
    except ValueError:
        return None


def _extract_room_parts(room_id):
    if room_id is None:
        return None, None, None

    text = str(room_id).strip()
    parts = text.split("-")
    if len(parts) == 4 and parts[0] == "room":
        return _extract_numeric_id(parts[1]), _extract_numeric_id(parts[2]), parts[3]

    return None, None, text


def _capacity_to_number(capacity):
    if isinstance(capacity, int):
        return capacity
    mapping = {
        "single": 1,
        "double": 2,
        "triple": 3,
        "suite": 5,
        "family": 4,
        "studio": 2,
    }
    return mapping.get(str(capacity).lower(), 2)


def _view_to_db(view_type):
    mapping = {
        "Sea View": "Sea",
        "Mountain View": "Mountain",
        "City View": "City",
        "Garden View": "Garden",
        "No View": "None",
        "": "None",
        None: "None",
    }
    return mapping.get(view_type, "None")


def _map_booking_row(row):
    return {
        "id": f"book-{row['reservation_id']}",
        "customerId": f"cust-{row['person_id']}",
        "roomId": f"room-{row['chain_id']}-{row['hotel_id']}-{row['room_num'].strip()}",
        "checkInDate": row["start_date"].isoformat(),
        "checkOutDate": row["end_date"].isoformat(),
        "status": row["status"],
        "bookingDate": row["booked_date"].isoformat() if row.get("booked_date") else row["created_at"].isoformat(),
        "specialRequests": None,
        "totalPrice": float(row["future_price"] or 0),
        "room": {
            "id": f"room-{row['chain_id']}-{row['hotel_id']}-{row['room_num'].strip()}",
            "hotelId": f"hotel-{row['hotel_id']}",
            "roomNumber": row["room_num"].strip(),
            "roomType": row["room_capacity_label"],
            "price": float(row["room_price"]),
            "amenities": row["amenities"] or [],
            "capacity": row["room_capacity_label"],
            "viewType": row["view_type"],
            "isExtendable": bool(row["is_extendable"]),
            "problems": (row["issues"][0] if row["issues"] else None),
            "hotel": {
                "id": f"hotel-{row['hotel_id']}",
                "name": row["hotel_name"],
                "chainId": f"chain-{row['chain_id']}",
                "category": row["hotel_category"],
                "address": {
                    "street": f"{row['hotel_street_number']} {row['hotel_street_name']}".strip(),
                    "city": row["hotel_city"],
                    "stateProvince": row["hotel_region"],
                    "zipCode": row["hotel_postalcode"],
                    "country": row["hotel_country"],
                },
                "contactEmail": row["hotel_contact_email"],
                "contactPhone": row["hotel_contact_phone"],
                "numberOfRooms": int(row["hotel_room_count"]),
                "managerId": f"emp-{row['manager_id']}" if row["manager_id"] else None,
            },
        },
        "customer": {
            "id": f"cust-{row['person_id']}",
            "firstName": row["customer_first_name"],
            "lastName": row["customer_last_name"],
            "email": row["customer_email"],
            "address": {
                "street": f"{row['customer_street_number']} {row['customer_street_name']}".strip(),
                "city": row["customer_city"],
                "stateProvince": row["customer_region"],
                "zipCode": row["customer_postalcode"],
                "country": row["customer_country"],
            },
            "idType": _display_id_type(row["customer_ssn_type"]),
            "idNumber": row["customer_ssn_number"],
            "registrationDate": row["customer_register_date"].isoformat(),
        },
    }


def _map_renting_row(row):
    room_id = f"room-{row['chain_id']}-{row['hotel_id']}-{row['room_num'].strip()}"
    status = "Completed" if row["status"] in ("CheckedOut", "Completed") else "Active"
    amount_paid = float(row["price_paid"] or 0) if status == "Completed" else 0.0
    return {
        "id": f"rent-{row['reservation_id']}",
        "customerId": f"cust-{row['customer_person_id']}",
        "roomId": room_id,
        "checkInDate": row["start_date"].isoformat(),
        "checkOutDate": row["end_date"].isoformat(),
        "status": status,
        "employeeId": f"emp-{row['employee_person_id']}" if row["employee_person_id"] else "",
        "bookingId": f"book-{row['converted_from_res_id']}" if row["converted_from_res_id"] else None,
        "createdAt": row["created_at"].isoformat(),
        "totalAmount": float(row["rental_price"] or 0),
        "amountPaid": amount_paid,
        "room": {
            "id": room_id,
            "hotelId": f"hotel-{row['hotel_id']}",
            "roomNumber": row["room_num"].strip(),
            "roomType": row["room_capacity_label"],
            "price": float(row["room_price"]),
            "amenities": row["amenities"] or [],
            "capacity": row["room_capacity_label"],
            "viewType": row["view_type"],
            "status": row["room_status"],
            "isExtendable": bool(row["is_extendable"]),
            "issues": row["issues"] or [],
            "hotel": {
                "id": f"hotel-{row['hotel_id']}",
                "name": row["hotel_name"],
                "chainId": f"chain-{row['chain_id']}",
                "category": row["hotel_category"],
                "address": {
                    "street": f"{row['hotel_street_number']} {row['hotel_street_name']}".strip(),
                    "city": row["hotel_city"],
                    "stateProvince": row["hotel_region"],
                    "zipCode": row["hotel_postalcode"],
                    "country": row["hotel_country"],
                },
                "contactEmail": row["hotel_contact_email"],
                "contactPhone": row["hotel_contact_phone"],
                "numberOfRooms": int(row["hotel_room_count"]),
                "managerId": f"emp-{row['manager_id']}" if row["manager_id"] else None,
            },
        },
        "customer": {
            "id": f"cust-{row['customer_person_id']}",
            "firstName": row["customer_first_name"],
            "lastName": row["customer_last_name"],
            "email": row["customer_email"],
            "address": {
                "street": f"{row['customer_street_number']} {row['customer_street_name']}".strip(),
                "city": row["customer_city"],
                "stateProvince": row["customer_region"],
                "zipCode": row["customer_postalcode"],
                "country": row["customer_country"],
            },
            "idType": _display_id_type(row["customer_ssn_type"]),
            "idNumber": row["customer_ssn_number"],
            "registrationDate": row["customer_register_date"].isoformat(),
        },
    }


def _map_archived_reservation_row(row):
    status_map = {
        "CheckedOut": "Completed",
        "Completed": "Completed",
        "Cancelled": "Cancelled",
        "CheckedIn": "Converted",
        "Confirmed": "Converted",
    }
    archived_price_paid = row.get("archived_price_paid")
    return {
        "id": f"arch-{row['archive_id']}",
        "chainId": f"chain-{row['chain_id']}" if row.get("chain_id") is not None else "",
        "hotelId": f"hotel-{row['hotel_id']}" if row.get("hotel_id") is not None else None,
        "hotelName": row["archived_hotel_name"] or "Unknown Hotel",
        "customerName": row["archived_customer_name"] or "Unknown Customer",
        "customerEmail": row.get("customer_email") or "",
        "roomNumber": (row["archived_room_num"] or "").strip(),
        "roomType": row.get("room_type") or "Room",
        "checkInDate": row["res_start_date"].isoformat() if row.get("res_start_date") else datetime.utcnow().date().isoformat(),
        "checkOutDate": row["res_end_date"].isoformat() if row.get("res_end_date") else datetime.utcnow().date().isoformat(),
        "archivedAt": row["archive_date"].isoformat(),
        "reservationStatus": status_map.get(row.get("archived_status"), "Completed"),
        "paymentStatus": "Paid" if archived_price_paid is not None else "Unpaid",
        "source": "Booking" if row.get("archived_type") == "booking" else "Walk-In",
        "totalAmount": float(archived_price_paid or 0),
        "amountPaid": float(archived_price_paid) if archived_price_paid is not None else None,
        "reasonArchived": row.get("archived_subtype") or "Historical reservation record",
        "notes": None,
    }


def _map_chain_row(row):
    return {
        "id": f"chain-{row['chain_id']}",
        "name": row["chain_name"],
        "centralOfficeAddress": {
            "street": f"{row['street_number']} {row['street_name']}",
            "city": row["city"],
            "stateProvince": row["region"],
            "zipCode": row["postalcode"],
            "country": row["country"],
        },
        "totalHotels": int(row["total_hotels"]),
        "contactEmails": row["contact_emails"] or [],
        "phoneNumbers": row["phone_numbers"] or [],
    }


def _map_hotel_row(row):
    return {
        "id": f"hotel-{row['hotel_id']}",
        "name": row["hotel_name"],
        "chainId": f"chain-{row['chain_id']}",
        "category": row["category"],
        "address": {
            "street": f"{row['street_number']} {row['street_name']}",
            "city": row["city"],
            "stateProvince": row["region"],
            "zipCode": row["postalcode"],
            "country": row["country"],
        },
        "contactEmail": row["contact_email"],
        "contactPhone": row["contact_phone"],
        "numberOfRooms": int(row["number_of_rooms"]),
        "managerId": f"emp-{row['manager_id']}" if row["manager_id"] is not None else None,
    }


def _map_room_row(row):
    room_type_by_capacity = {
        1: "Single",
        2: "Double",
        3: "Triple",
        4: "Family",
    }
    capacity_label = room_type_by_capacity.get(row["capacity"], "Suite")
    view = row["view"] or "None"
    view_type = f"{view} View" if view != "None" else "No View"
    issues = row["issues"] or []
    extendable_with = row.get("extendable_with") or []
    return {
        "id": f"room-{row['chain_id']}-{row['hotel_id']}-{row['room_num']}",
        "hotelId": f"hotel-{row['hotel_id']}",
        "roomNumber": str(row["room_num"]),
        "roomType": capacity_label,
        "price": float(row["price"]),
        "amenities": row["amenities"] or [],
        "capacity": capacity_label,
        "viewType": view_type,
        "status": row["status"],
        "isExtendable": bool(row["is_extendable"]),
        "extendableWith": extendable_with,
        "issues": issues,
        "problems": (issues[0] if issues else None),
    }

# --- Hotel Chains ---

def db_get_all_chains():
    query = """
        SELECT
            hc.chain_id,
            hc.chain_name,
            hc.country,
            hc.city,
            hc.region,
            hc.street_name,
            hc.street_number,
            hc.postalcode,
            (
                SELECT COUNT(*)
                FROM hotels h
                WHERE h.chain_id = hc.chain_id
            ) AS total_hotels,
            (
                SELECT ARRAY_AGG(hce.email ORDER BY hce.email)
                FROM hotelchain_emails hce
                WHERE hce.chain_id = hc.chain_id
            ) AS contact_emails,
            (
                SELECT ARRAY_AGG(hcp.phone_number ORDER BY hcp.phone_number)
                FROM hotelchain_phones hcp
                WHERE hcp.chain_id = hc.chain_id
            ) AS phone_numbers
        FROM hotel_chains hc
        ORDER BY hc.chain_id;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query)
            rows = cur.fetchall()
            return [_map_chain_row(r) for r in rows]
    finally:
        conn.close()

def db_get_chain_by_id(chain_id):
    numeric_chain_id = _extract_numeric_id(chain_id)
    if numeric_chain_id is None:
        return None

    query = """
        SELECT
            hc.chain_id,
            hc.chain_name,
            hc.country,
            hc.city,
            hc.region,
            hc.street_name,
            hc.street_number,
            hc.postalcode,
            (
                SELECT COUNT(*)
                FROM hotels h
                WHERE h.chain_id = hc.chain_id
            ) AS total_hotels,
            (
                SELECT ARRAY_AGG(hce.email ORDER BY hce.email)
                FROM hotelchain_emails hce
                WHERE hce.chain_id = hc.chain_id
            ) AS contact_emails,
            (
                SELECT ARRAY_AGG(hcp.phone_number ORDER BY hcp.phone_number)
                FROM hotelchain_phones hcp
                WHERE hcp.chain_id = hc.chain_id
            ) AS phone_numbers
        FROM hotel_chains hc
        WHERE hc.chain_id = %s;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, (numeric_chain_id,))
            row = cur.fetchone()
            return _map_chain_row(row) if row else None
    finally:
        conn.close()

def db_create_chain(data):
    street_number, street_name = _split_street(data["centralOfficeAddress"].get("street"))

    insert_chain_query = """
        INSERT INTO hotel_chains (
            chain_name, country, city, region, street_name, street_number, postalcode
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING chain_id;
    """
    insert_email_query = """
        INSERT INTO hotelchain_emails (chain_id, email)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING;
    """
    insert_phone_query = """
        INSERT INTO hotelchain_phones (chain_id, phone_number)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                insert_chain_query,
                (
                    data["name"],
                    data["centralOfficeAddress"]["country"],
                    data["centralOfficeAddress"]["city"],
                    data["centralOfficeAddress"]["stateProvince"],
                    street_name or "Unknown",
                    street_number or 1,
                    data["centralOfficeAddress"]["zipCode"] or "000000",
                ),
            )
            chain_id = cur.fetchone()["chain_id"]

            for email in data.get("contactEmails", []):
                if email:
                    cur.execute(insert_email_query, (chain_id, email))

            for phone in data.get("phoneNumbers", []):
                if phone:
                    cur.execute(insert_phone_query, (chain_id, phone))

        conn.commit()
        return db_get_chain_by_id(chain_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def db_update_chain(chain_id, data):
    numeric_chain_id = _extract_numeric_id(chain_id)
    if numeric_chain_id is None:
        return None

    street_number, street_name = _split_street(data["centralOfficeAddress"].get("street"))
    update_chain_query = """
        UPDATE hotel_chains
        SET
            chain_name = %s,
            country = %s,
            city = %s,
            region = %s,
            street_name = %s,
            street_number = %s,
            postalcode = %s
        WHERE chain_id = %s;
    """
    delete_emails_query = "DELETE FROM hotelchain_emails WHERE chain_id = %s;"
    delete_phones_query = "DELETE FROM hotelchain_phones WHERE chain_id = %s;"
    insert_email_query = """
        INSERT INTO hotelchain_emails (chain_id, email)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING;
    """
    insert_phone_query = """
        INSERT INTO hotelchain_phones (chain_id, phone_number)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING;
    """

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                update_chain_query,
                (
                    data["name"],
                    data["centralOfficeAddress"]["country"],
                    data["centralOfficeAddress"]["city"],
                    data["centralOfficeAddress"]["stateProvince"],
                    street_name or "Unknown",
                    street_number or 1,
                    data["centralOfficeAddress"]["zipCode"] or "000000",
                    numeric_chain_id,
                ),
            )
            if cur.rowcount == 0:
                conn.rollback()
                return None

            cur.execute(delete_emails_query, (numeric_chain_id,))
            cur.execute(delete_phones_query, (numeric_chain_id,))

            for email in data.get("contactEmails", []):
                if email:
                    cur.execute(insert_email_query, (numeric_chain_id, email))

            for phone in data.get("phoneNumbers", []):
                if phone:
                    cur.execute(insert_phone_query, (numeric_chain_id, phone))

        conn.commit()
        return db_get_chain_by_id(numeric_chain_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def db_delete_chain(chain_id):
    numeric_chain_id = _extract_numeric_id(chain_id)
    if numeric_chain_id is None:
        return False

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM hotel_chains WHERE chain_id = %s RETURNING chain_id;",
                (numeric_chain_id,)
            )
            if not cur.fetchone():
                return False

        conn.commit()
        return True
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# --- Hotels ---

def db_get_all_hotels(filters=None):
    filters = filters or {}
    where_clauses = []
    params = []

    chain_id = _extract_numeric_id(filters.get("chainId"))
    if chain_id is not None:
        where_clauses.append("h.chain_id = %s")
        params.append(chain_id)

    category = filters.get("category")
    if category is not None:
        where_clauses.append("h.category = %s")
        params.append(category)

    city = filters.get("city")
    if city:
        where_clauses.append("LOWER(h.city) = LOWER(%s)")
        params.append(city)

    manager_id = _extract_numeric_id(filters.get("managerId"))
    if manager_id is not None:
        where_clauses.append("h.manager_id = %s")
        params.append(manager_id)

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    query = f"""
        SELECT
            h.chain_id,
            h.hotel_id,
            h.hotel_name,
            h.category,
            h.country,
            h.city,
            h.region,
            h.street_name,
            h.street_number,
            h.postalcode,
            h.manager_id,
            (
                SELECT he.email
                FROM hotel_email he
                WHERE he.chain_id = h.chain_id AND he.hotel_id = h.hotel_id
                ORDER BY he.email
                LIMIT 1
            ) AS contact_email,
            (
                SELECT hp.phone_number
                FROM hotel_phone hp
                WHERE hp.chain_id = h.chain_id AND hp.hotel_id = h.hotel_id
                ORDER BY hp.phone_number
                LIMIT 1
            ) AS contact_phone,
            (
                SELECT COUNT(*)
                FROM rooms r
                WHERE r.chain_id = h.chain_id AND r.hotel_id = h.hotel_id
            ) AS number_of_rooms
        FROM hotels h
        {where_sql}
        ORDER BY h.chain_id, h.hotel_id;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [_map_hotel_row(r) for r in rows]
    finally:
        conn.close()

def db_get_hotel_by_id(hotel_id):
    numeric_hotel_id = _extract_numeric_id(hotel_id)
    if numeric_hotel_id is None:
        return None

    query = """
        SELECT
            h.chain_id,
            h.hotel_id,
            h.hotel_name,
            h.category,
            h.country,
            h.city,
            h.region,
            h.street_name,
            h.street_number,
            h.postalcode,
            h.manager_id,
            (
                SELECT he.email
                FROM hotel_email he
                WHERE he.chain_id = h.chain_id AND he.hotel_id = h.hotel_id
                ORDER BY he.email
                LIMIT 1
            ) AS contact_email,
            (
                SELECT hp.phone_number
                FROM hotel_phone hp
                WHERE hp.chain_id = h.chain_id AND hp.hotel_id = h.hotel_id
                ORDER BY hp.phone_number
                LIMIT 1
            ) AS contact_phone,
            (
                SELECT COUNT(*)
                FROM rooms r
                WHERE r.chain_id = h.chain_id AND r.hotel_id = h.hotel_id
            ) AS number_of_rooms
        FROM hotels h
        WHERE h.hotel_id = %s;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, (numeric_hotel_id,))
            row = cur.fetchone()
            return _map_hotel_row(row) if row else None
    finally:
        conn.close()

def db_create_hotel(data):
    chain_id = _extract_numeric_id(data.get("chainId"))
    manager_id = _extract_numeric_id(data.get("managerId"))
    if chain_id is None:
        return None

    street_number, street_name = _split_street(data["address"].get("street"))
    insert_hotel_query = """
        INSERT INTO hotels (
            chain_id, hotel_name, category, country, city, region, street_number, street_name, postalcode, manager_id
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING hotel_id;
    """
    insert_email_query = """
        INSERT INTO hotel_email (chain_id, hotel_id, email)
        VALUES (%s, %s, %s)
        ON CONFLICT DO NOTHING;
    """
    insert_phone_query = """
        INSERT INTO hotel_phone (chain_id, hotel_id, phone_number)
        VALUES (%s, %s, %s)
        ON CONFLICT DO NOTHING;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                insert_hotel_query,
                (
                    chain_id,
                    data["name"],
                    data["category"],
                    data["address"]["country"],
                    data["address"]["city"],
                    data["address"]["stateProvince"],
                    street_number or 1,
                    street_name or "Unknown",
                    data["address"]["zipCode"] or "000000",
                    manager_id,
                ),
            )
            hotel_id = cur.fetchone()["hotel_id"]
            if data.get("contactEmail"):
                cur.execute(insert_email_query, (chain_id, hotel_id, data["contactEmail"]))
            if data.get("contactPhone"):
                cur.execute(insert_phone_query, (chain_id, hotel_id, data["contactPhone"]))

        conn.commit()
        return db_get_hotel_by_id(hotel_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def db_update_hotel(hotel_id, data):
    numeric_hotel_id = _extract_numeric_id(hotel_id)
    numeric_chain_id = _extract_numeric_id(data.get("chainId"))
    manager_id = _extract_numeric_id(data.get("managerId"))
    if numeric_hotel_id is None or numeric_chain_id is None:
        return None

    street_number, street_name = _split_street(data["address"].get("street"))
    query_find = "SELECT chain_id FROM hotels WHERE hotel_id = %s LIMIT 1;"
    query_update = """
        UPDATE hotels
        SET
            chain_id = %s,
            hotel_name = %s,
            category = %s,
            country = %s,
            city = %s,
            region = %s,
            street_number = %s,
            street_name = %s,
            postalcode = %s,
            manager_id = %s
        WHERE hotel_id = %s;
    """
    delete_email = "DELETE FROM hotel_email WHERE hotel_id = %s;"
    delete_phone = "DELETE FROM hotel_phone WHERE hotel_id = %s;"
    insert_email = "INSERT INTO hotel_email (chain_id, hotel_id, email) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING;"
    insert_phone = "INSERT INTO hotel_phone (chain_id, hotel_id, phone_number) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING;"

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query_find, (numeric_hotel_id,))
            row = cur.fetchone()
            if not row:
                conn.rollback()
                return None

            cur.execute(
                query_update,
                (
                    numeric_chain_id,
                    data["name"],
                    data["category"],
                    data["address"]["country"],
                    data["address"]["city"],
                    data["address"]["stateProvince"],
                    street_number or 1,
                    street_name or "Unknown",
                    data["address"]["zipCode"] or "000000",
                    manager_id,
                    numeric_hotel_id,
                ),
            )

            cur.execute(delete_email, (numeric_hotel_id,))
            cur.execute(delete_phone, (numeric_hotel_id,))
            if data.get("contactEmail"):
                cur.execute(insert_email, (numeric_chain_id, numeric_hotel_id, data["contactEmail"]))
            if data.get("contactPhone"):
                cur.execute(insert_phone, (numeric_chain_id, numeric_hotel_id, data["contactPhone"]))

        conn.commit()
        return db_get_hotel_by_id(numeric_hotel_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def db_delete_hotel(hotel_id):
    numeric_hotel_id = _extract_numeric_id(hotel_id)
    if numeric_hotel_id is None:
        return False

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT chain_id FROM hotels WHERE hotel_id = %s LIMIT 1;", (numeric_hotel_id,))
            row = cur.fetchone()
            if not row:
                conn.rollback()
                return False
            
            chain_id = row["chain_id"]

            cur.execute(
                "DELETE FROM hotels WHERE chain_id = %s AND hotel_id = %s RETURNING hotel_id;",
                (chain_id, numeric_hotel_id)
            )
            if not cur.fetchone():
                conn.rollback()
                return False

        conn.commit()
        return True
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# --- Rooms ---

def db_get_all_rooms(filters=None):
    filters = filters or {}
    where_clauses = []
    params = []

    hotel_id = _extract_numeric_id(filters.get("hotelId"))
    if hotel_id is not None:
        where_clauses.append("r.hotel_id = %s")
        params.append(hotel_id)

    capacity = filters.get("capacity")
    if capacity:
        capacity_map = {
            "single": 1,
            "double": 2,
            "triple": 3,
            "suite": 5,
            "family": 4,
            "studio": 2,
        }
        mapped_capacity = capacity_map.get(str(capacity).lower())
        if mapped_capacity is not None:
            where_clauses.append("r.capacity = %s")
            params.append(mapped_capacity)

    min_price = filters.get("minPrice")
    if min_price is not None:
        where_clauses.append("r.price >= %s")
        params.append(min_price)

    max_price = filters.get("maxPrice")
    if max_price is not None:
        where_clauses.append("r.price <= %s")
        params.append(max_price)

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    query = f"""
        SELECT
            r.chain_id,
            r.hotel_id,
            r.room_num,
            r.price,
            r.capacity,
            r.view,
            r.status,
            (
                SELECT ARRAY_AGG(ra.amenity ORDER BY ra.amenity)
                FROM room_amenities ra
                WHERE ra.chain_id = r.chain_id
                  AND ra.hotel_id = r.hotel_id
                  AND ra.room_num = r.room_num
            ) AS amenities,
            EXISTS (
                SELECT 1
                FROM room_extendible re
                WHERE re.chain_id = r.chain_id
                  AND re.hotel_id = r.hotel_id
                  AND re.room_num = r.room_num
            ) AS is_extendable,
                        (
                                SELECT ARRAY_AGG(re.extendible ORDER BY re.extendible)
                                FROM room_extendible re
                                WHERE re.chain_id = r.chain_id
                                    AND re.hotel_id = r.hotel_id
                                    AND re.room_num = r.room_num
                        ) AS extendable_with,
            (
                SELECT ARRAY_AGG(ri.issue ORDER BY ri.issue)
                FROM room_issues ri
                WHERE ri.chain_id = r.chain_id
                  AND ri.hotel_id = r.hotel_id
                  AND ri.room_num = r.room_num
            ) AS issues
        FROM rooms r
        {where_sql}
        ORDER BY r.chain_id, r.hotel_id, r.room_num;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [_map_room_row(r) for r in rows]
    finally:
        conn.close()

def db_get_room_by_id(room_id):
    room_num = None
    chain_id = None
    hotel_id = None

    if room_id is not None:
        room_text = str(room_id)
        parts = room_text.split("-")

        if len(parts) == 4 and parts[0] == "room":
            chain_id = _extract_numeric_id(parts[1])
            hotel_id = _extract_numeric_id(parts[2])
            room_num = parts[3]
        elif "-" in room_text:
            room_num = room_text.rsplit("-", 1)[-1]
        else:
            room_num = room_text

    if not room_num:
        return None

    where_clauses = ["r.room_num = %s"]
    params = [room_num]
    if chain_id is not None:
        where_clauses.append("r.chain_id = %s")
        params.append(chain_id)
    if hotel_id is not None:
        where_clauses.append("r.hotel_id = %s")
        params.append(hotel_id)

    where_sql = " AND ".join(where_clauses)

    query = f"""
        SELECT
            r.chain_id,
            r.hotel_id,
            r.room_num,
            r.price,
            r.capacity,
            r.view,
            r.status,
            (
                SELECT ARRAY_AGG(ra.amenity ORDER BY ra.amenity)
                FROM room_amenities ra
                WHERE ra.chain_id = r.chain_id
                  AND ra.hotel_id = r.hotel_id
                  AND ra.room_num = r.room_num
            ) AS amenities,
            EXISTS (
                SELECT 1
                FROM room_extendible re
                WHERE re.chain_id = r.chain_id
                  AND re.hotel_id = r.hotel_id
                  AND re.room_num = r.room_num
            ) AS is_extendable,
                (
                    SELECT ARRAY_AGG(re.extendible ORDER BY re.extendible)
                    FROM room_extendible re
                    WHERE re.chain_id = r.chain_id
                        AND re.hotel_id = r.hotel_id
                        AND re.room_num = r.room_num
            ) AS extendable_with,
            (
                SELECT ARRAY_AGG(ri.issue ORDER BY ri.issue)
                FROM room_issues ri
                WHERE ri.chain_id = r.chain_id
                  AND ri.hotel_id = r.hotel_id
                  AND ri.room_num = r.room_num
            ) AS issues
        FROM rooms r
        WHERE {where_sql}
        ORDER BY r.chain_id, r.hotel_id
        LIMIT 1;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            return _map_room_row(row) if row else None
    finally:
        conn.close()

def db_create_room(data):
    hotel_id = _extract_numeric_id(data.get("hotelId"))
    if hotel_id is None:
        return None

    chain_lookup = "SELECT chain_id FROM hotels WHERE hotel_id = %s LIMIT 1;"
    insert_room = """
        INSERT INTO rooms (chain_id, hotel_id, room_num, price, capacity, view, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s);
    """
    insert_amenity = """
        INSERT INTO room_amenities (chain_id, hotel_id, room_num, amenity)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT DO NOTHING;
    """
    insert_extendible = """
        INSERT INTO room_extendible (chain_id, hotel_id, room_num, extendible)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT DO NOTHING;
    """
    insert_issue = """
        INSERT INTO room_issues (chain_id, hotel_id, room_num, issue)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT DO NOTHING;
    """

    room_num = str(data["roomNumber"]).strip()
    capacity_number = _capacity_to_number(data.get("capacity"))
    view_value = _view_to_db(data.get("viewType"))
    status = "Maintenance" if data.get("problems") else "Available"

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(chain_lookup, (hotel_id,))
            hotel_row = cur.fetchone()
            if not hotel_row:
                conn.rollback()
                return None
            chain_id = hotel_row["chain_id"]

            cur.execute(insert_room, (chain_id, hotel_id, room_num, data["price"], capacity_number, view_value, status))

            for amenity in data.get("amenities", []):
                if amenity:
                    cur.execute(insert_amenity, (chain_id, hotel_id, room_num, amenity))

            if data.get("isExtendable"):
                cur.execute(insert_extendible, (chain_id, hotel_id, room_num, "Yes"))

            if data.get("problems"):
                cur.execute(insert_issue, (chain_id, hotel_id, room_num, data["problems"]))

        conn.commit()
        return db_get_room_by_id(f"room-{chain_id}-{hotel_id}-{room_num}")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def db_update_room(room_id, data):
    chain_id, hotel_id, room_num = _extract_room_parts(room_id)
    if room_num is None:
        return None
    if hotel_id is None:
        hotel_id = _extract_numeric_id(data.get("hotelId"))
    if hotel_id is None:
        return None

    chain_lookup = "SELECT chain_id FROM hotels WHERE hotel_id = %s LIMIT 1;"
    update_room = """
        UPDATE rooms
        SET
            price = %s,
            capacity = %s,
            view = %s,
            status = %s
        WHERE chain_id = %s AND hotel_id = %s AND TRIM(room_num) = TRIM(%s);
    """
    delete_amenities = "DELETE FROM room_amenities WHERE chain_id = %s AND hotel_id = %s AND TRIM(room_num) = TRIM(%s);"
    insert_amenity = "INSERT INTO room_amenities (chain_id, hotel_id, room_num, amenity) VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING;"
    delete_extend = "DELETE FROM room_extendible WHERE chain_id = %s AND hotel_id = %s AND TRIM(room_num) = TRIM(%s);"
    insert_extend = "INSERT INTO room_extendible (chain_id, hotel_id, room_num, extendible) VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING;"
    delete_issues = "DELETE FROM room_issues WHERE chain_id = %s AND hotel_id = %s AND TRIM(room_num) = TRIM(%s);"
    insert_issue = "INSERT INTO room_issues (chain_id, hotel_id, room_num, issue) VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING;"

    capacity_number = _capacity_to_number(data.get("capacity"))
    view_value = _view_to_db(data.get("viewType"))
    status = "Maintenance" if data.get("problems") else "Available"

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if chain_id is None:
                cur.execute(chain_lookup, (hotel_id,))
                row = cur.fetchone()
                if not row:
                    conn.rollback()
                    return None
                chain_id = row["chain_id"]

            cur.execute(update_room, (data["price"], capacity_number, view_value, status, chain_id, hotel_id, room_num))
            if cur.rowcount == 0:
                conn.rollback()
                return None

            cur.execute(delete_amenities, (chain_id, hotel_id, room_num))
            for amenity in data.get("amenities", []):
                if amenity:
                    cur.execute(insert_amenity, (chain_id, hotel_id, room_num, amenity))

            cur.execute(delete_extend, (chain_id, hotel_id, room_num))
            if data.get("isExtendable"):
                cur.execute(insert_extend, (chain_id, hotel_id, room_num, "Yes"))

            cur.execute(delete_issues, (chain_id, hotel_id, room_num))
            if data.get("problems"):
                cur.execute(insert_issue, (chain_id, hotel_id, room_num, data["problems"]))

        conn.commit()
        return db_get_room_by_id(f"room-{chain_id}-{hotel_id}-{room_num}")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def db_delete_room(room_id):
    chain_id, hotel_id, room_num = _extract_room_parts(room_id)
    if room_num is None:
        return False

    find_query = """
        SELECT chain_id, hotel_id
        FROM rooms
        WHERE TRIM(room_num) = TRIM(%s)
          AND (%s IS NULL OR chain_id = %s)
          AND (%s IS NULL OR hotel_id = %s)
        ORDER BY chain_id, hotel_id
        LIMIT 1;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(find_query, (room_num, chain_id, chain_id, hotel_id, hotel_id))
            row = cur.fetchone()
            if not row:
                conn.rollback()
                return False
            
            chain_id = row["chain_id"]
            hotel_id = row["hotel_id"]

            cur.execute(
                "DELETE FROM rooms WHERE chain_id = %s AND hotel_id = %s AND TRIM(room_num) = TRIM(%s) RETURNING room_num;",
                (chain_id, hotel_id, room_num)
            )
            if not cur.fetchone():
                conn.rollback()
                return False

        conn.commit()
        return True
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# --- Authentication ---

def db_get_user_by_credentials(email, password):
    query = """
        SELECT
            p.person_id,
            p.first_name,
            p.last_name,
            p.email,
            p.country,
            p.city,
            p.region,
            p.street_name,
            p.street_number,
            p.postalcode,
            e.role AS employee_role,
            e.chain_id,
            e.hotel_id,
            c.person_id AS customer_person_id
        FROM person p
        LEFT JOIN employee e ON e.person_id = p.person_id
        LEFT JOIN customer c ON c.person_id = p.person_id
        WHERE LOWER(p.email) = LOWER(%s) AND p.password = %s
        LIMIT 1;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, (email, password))
            row = cur.fetchone()
            if not row:
                return None

            base_user = {
                "personId": row["person_id"],
                "firstName": row["first_name"],
                "lastName": row["last_name"],
                "email": row["email"],
                "address": {
                    "street": f"{row['street_number']} {row['street_name']}".strip(),
                    "city": row["city"],
                    "stateProvince": row["region"],
                    "zipCode": row["postalcode"],
                    "country": row["country"],
                },
            }

            if row["employee_role"]:
                is_manager = row["employee_role"] == "Manager"
                return {
                    **base_user,
                    "id": f"emp-{row['person_id']}",
                    "role": "Admin" if is_manager else "Employee",
                    "employeeRole": row["employee_role"],
                    "employeeId": f"emp-{row['person_id']}",
                    "chainId": f"chain-{row['chain_id']}",
                    "hotelId": f"hotel-{row['hotel_id']}",
                }

            if row["customer_person_id"]:
                return {
                    **base_user,
                    "id": f"cust-{row['person_id']}",
                    "role": "Customer",
                    "customerId": f"cust-{row['person_id']}",
                }

            return None
    finally:
        conn.close()


def db_create_customer_account(data):
    insert_person_query = """
        INSERT INTO person (
            first_name,
            last_name,
            ssn_type,
            ssn_number,
            country,
            city,
            region,
            street_name,
            street_number,
            postalcode,
            email,
            password
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING person_id;
    """
    insert_customer_query = """
        INSERT INTO customer (person_id, register_date)
        VALUES (%s, CURRENT_DATE);
    """

    street_number = _extract_numeric_id(data.get("streetNumber"))
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                insert_person_query,
                (
                    data["firstName"],
                    data["lastName"],
                    _normalize_id_type(data["idType"]),
                    data["idNumber"],
                    data["country"],
                    data["city"],
                    data["stateProvince"],
                    data["streetName"],
                    street_number,
                    data["zipCode"],
                    data["email"],
                    data["password"],
                ),
            )
            person_id = cur.fetchone()["person_id"]
            cur.execute(insert_customer_query, (person_id,))

        conn.commit()
        return {
            "id": f"cust-{person_id}",
            "personId": person_id,
            "email": data["email"],
            "role": "Customer",
            "firstName": data["firstName"],
            "lastName": data["lastName"],
            "customerId": f"cust-{person_id}",
            "address": {
                "street": f"{street_number or ''} {data['streetName']}".strip(),
                "city": data["city"],
                "stateProvince": data["stateProvince"],
                "zipCode": data["zipCode"],
                "country": data["country"],
            },
        }
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def db_create_employee_for_manager(data, manager_person_id):
    manager_query = """
        SELECT e.chain_id, e.hotel_id, h.hotel_name
        FROM employee e
        JOIN hotels h ON h.chain_id = e.chain_id AND h.hotel_id = e.hotel_id
        WHERE e.person_id = %s
          AND e.role = 'Manager'
          AND e.chain_id = %s
          AND LOWER(TRIM(h.hotel_name)) = LOWER(TRIM(%s))
        LIMIT 1;
    """
    insert_person_query = """
        INSERT INTO person (
            first_name,
            last_name,
            ssn_type,
            ssn_number,
            country,
            city,
            region,
            street_name,
            street_number,
            postalcode,
            email,
            password
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING person_id;
    """
    insert_employee_query = """
        INSERT INTO employee (person_id, chain_id, hotel_id, role)
        VALUES (%s, %s, %s, %s);
    """

    street_number, street_name = _split_street(data["address"].get("street"))
    target_chain_id = _extract_numeric_id(data.get("chainId"))
    target_hotel_name = str(data.get("hotelName") or "").strip()

    if data.get("role") == "Manager":
        raise ValueError("Manager role cannot be assigned when creating an employee")

    if target_chain_id is None or not target_hotel_name:
        return None

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(manager_query, (manager_person_id, target_chain_id, target_hotel_name))
            manager_assignment = cur.fetchone()
            if not manager_assignment:
                return None

            cur.execute(
                insert_person_query,
                (
                    data["firstName"],
                    data["lastName"],
                    _normalize_id_type(data.get("idType", "SSN")),
                    data["ssnSin"],
                    data["address"]["country"],
                    data["address"]["city"],
                    data["address"]["stateProvince"],
                    street_name,
                    street_number,
                    data["address"]["zipCode"],
                    data["email"],
                    data["password"],
                ),
            )
            person_id = cur.fetchone()["person_id"]

            cur.execute(
                insert_employee_query,
                (
                    person_id,
                    manager_assignment["chain_id"],
                    manager_assignment["hotel_id"],
                    data["role"],
                ),
            )

        conn.commit()
        return {
            "id": f"emp-{person_id}",
            "personId": person_id,
            "firstName": data["firstName"],
            "lastName": data["lastName"],
            "email": data["email"],
            "address": data["address"],
            "ssnSin": data["ssnSin"],
            "role": data["role"],
            "hotelId": f"hotel-{manager_assignment['hotel_id']}",
            "chainId": f"chain-{manager_assignment['chain_id']}",
        }
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# --- Employees ---

def db_get_all_employees(filters=None):
    filters = filters or {}
    where_clauses = []
    params = []

    hotel_id = _extract_numeric_id(filters.get("hotelId"))
    if hotel_id is not None:
        where_clauses.append("e.hotel_id = %s")
        params.append(hotel_id)

    role = filters.get("role")
    if role:
        where_clauses.append("e.role = %s")
        params.append(role)

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    query = f"""
        SELECT
            p.person_id,
            p.first_name,
            p.last_name,
            p.email,
            p.country,
            p.city,
            p.region,
            p.street_name,
            p.street_number,
            p.postalcode,
            p.ssn_number,
            e.chain_id,
            e.hotel_id,
            e.role
        FROM employee e
        JOIN person p ON p.person_id = e.person_id
        {where_sql}
        ORDER BY p.person_id;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, tuple(params))
            return [_map_employee_row(row) for row in cur.fetchall()]
    finally:
        conn.close()

def db_get_employee_by_id(employee_id):
    person_id = _extract_numeric_id(employee_id)
    if person_id is None:
        return None

    query = """
        SELECT
            p.person_id,
            p.first_name,
            p.last_name,
            p.email,
            p.country,
            p.city,
            p.region,
            p.street_name,
            p.street_number,
            p.postalcode,
            p.ssn_number,
            e.chain_id,
            e.hotel_id,
            e.role
        FROM employee e
        JOIN person p ON p.person_id = e.person_id
        WHERE e.person_id = %s
        LIMIT 1;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, (person_id,))
            row = cur.fetchone()
            return _map_employee_row(row) if row else None
    finally:
        conn.close()

def db_update_employee(employee_id, data, manager_person_id=None, replacement_manager_person_id=None):
    person_id = _extract_numeric_id(employee_id)
    if person_id is None:
        return None

    hotel_id = _extract_numeric_id(data.get("hotelId"))
    chain_id = _extract_numeric_id(data.get("chainId"))
    street_number, street_name = _split_street(data["address"].get("street"))

    query_person = """
        UPDATE person
        SET
            first_name = %s,
            last_name = %s,
            ssn_type = %s,
            ssn_number = %s,
            country = %s,
            city = %s,
            region = %s,
            street_name = %s,
            street_number = %s,
            postalcode = %s,
            email = %s,
            password = %s
        WHERE person_id = %s;
    """
    query_employee = """
        UPDATE employee
        SET
            chain_id = COALESCE(%s, chain_id),
            hotel_id = COALESCE(%s, hotel_id),
            role = %s
        WHERE person_id = %s;
    """

    query_employee_context = """
        SELECT chain_id, hotel_id, role
        FROM employee
        WHERE person_id = %s
        LIMIT 1;
    """

    query_replacement_employee = """
        SELECT person_id
        FROM employee
        WHERE person_id = %s
          AND chain_id = %s
          AND hotel_id = %s
        LIMIT 1;
    """

    update_employee_role = """
        UPDATE employee
        SET role = %s
        WHERE person_id = %s;
    """

    promote_replacement_manager = """
        UPDATE employee
        SET role = 'Manager'
        WHERE person_id = %s
          AND chain_id = %s
          AND hotel_id = %s;
    """

    update_hotel_manager = """
        UPDATE hotels
        SET manager_id = %s
        WHERE chain_id = %s
          AND hotel_id = %s;
    """

    manager_person_numeric_id = _extract_numeric_id(manager_person_id)
    replacement_manager_numeric_id = _extract_numeric_id(replacement_manager_person_id)
    new_role = data["role"]

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query_employee_context, (person_id,))
            employee_context = cur.fetchone()
            if not employee_context:
                conn.rollback()
                return None

            current_chain_id, current_hotel_id, current_role = employee_context
            is_manager_transfer = current_role == "Manager" and new_role != "Manager"

            if current_role != "Manager" and new_role == "Manager":
                raise ValueError("Manager role cannot be assigned directly. Use manager transfer.")

            if is_manager_transfer:
                if manager_person_numeric_id is None or manager_person_numeric_id != person_id:
                    raise PermissionError("Only the current manager can transfer the manager role.")
                if replacement_manager_numeric_id is None:
                    raise ValueError("A replacement manager must be selected.")
                if replacement_manager_numeric_id == person_id:
                    raise ValueError("Replacement manager must be a different employee.")

                cur.execute(
                    query_replacement_employee,
                    (replacement_manager_numeric_id, current_chain_id, current_hotel_id),
                )
                replacement_employee = cur.fetchone()
                if not replacement_employee:
                    raise ValueError("Replacement manager must belong to the same hotel.")

            cur.execute(
                query_person,
                (
                    data["firstName"],
                    data["lastName"],
                    _normalize_id_type(data.get("idType", "SSN")),
                    data["ssnSin"],
                    data["address"]["country"],
                    data["address"]["city"],
                    data["address"]["stateProvince"],
                    street_name,
                    street_number,
                    data["address"]["zipCode"],
                    data["email"],
                    data["password"],
                    person_id,
                ),
            )
            if cur.rowcount == 0:
                conn.rollback()
                return None

            if is_manager_transfer:
                cur.execute(update_employee_role, (new_role, person_id))
                cur.execute(
                    promote_replacement_manager,
                    (replacement_manager_numeric_id, current_chain_id, current_hotel_id),
                )
                if cur.rowcount == 0:
                    raise ValueError("Could not promote the selected replacement manager.")
                cur.execute(
                    update_hotel_manager,
                    (replacement_manager_numeric_id, current_chain_id, current_hotel_id),
                )
            else:
                cur.execute(query_employee, (chain_id, hotel_id, data["role"], person_id))

        conn.commit()
        return db_get_employee_by_id(person_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def db_delete_employee(employee_id):
    person_id = _extract_numeric_id(employee_id)
    if person_id is None:
        return False

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM employee WHERE person_id = %s RETURNING person_id;", (person_id,))
            if not cur.fetchone():
                return False

        conn.commit()
        return True
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# --- Customers ---

def db_get_all_customers(filters=None):
    filters = filters or {}
    search_term = (filters.get("searchTerm") or "").strip().lower()
    chain_id = _extract_numeric_id(filters.get("chainId"))
    hotel_id = _extract_numeric_id(filters.get("hotelId"))

    query = """
        SELECT
            p.person_id,
            p.first_name,
            p.last_name,
            p.email,
            p.country,
            p.city,
            p.region,
            p.street_name,
            p.street_number,
            p.postalcode,
            p.ssn_type,
            p.ssn_number,
            c.register_date
        FROM customer c
        JOIN person p ON p.person_id = c.person_id
        WHERE (
            %s = ''
            OR LOWER(p.first_name) LIKE %s
            OR LOWER(p.last_name) LIKE %s
            OR LOWER(p.email) LIKE %s
            OR LOWER(p.ssn_number) LIKE %s
        )
        AND (
            (%s IS NULL AND %s IS NULL)
            OR EXISTS (
                SELECT 1
                FROM hotel_reservation hr
                WHERE hr.person_id = c.person_id
                    AND (%s IS NULL OR hr.chain_id = %s)
                    AND (%s IS NULL OR hr.hotel_id = %s)
            )
        )
        ORDER BY p.person_id;
    """

    like_value = f"%{search_term}%"
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                query,
                (
                    search_term,
                    like_value,
                    like_value,
                    like_value,
                    like_value,
                    chain_id,
                    hotel_id,
                    chain_id,
                    chain_id,
                    hotel_id,
                    hotel_id,
                ),
            )
            return [_map_customer_row(row) for row in cur.fetchall()]
    finally:
        conn.close()

def db_get_customer_by_id(customer_id):
    person_id = _extract_numeric_id(customer_id)
    if person_id is None:
        return None

    query = """
        SELECT
            p.person_id,
            p.first_name,
            p.last_name,
            p.email,
            p.country,
            p.city,
            p.region,
            p.street_name,
            p.street_number,
            p.postalcode,
            p.ssn_type,
            p.ssn_number,
            c.register_date
        FROM customer c
        JOIN person p ON p.person_id = c.person_id
        WHERE c.person_id = %s
        LIMIT 1;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, (person_id,))
            row = cur.fetchone()
            return _map_customer_row(row) if row else None
    finally:
        conn.close()

def db_create_customer(data):
    return db_create_customer_account(
        {
            "firstName": data["firstName"],
            "lastName": data["lastName"],
            "email": data["email"],
            "password": data.get("password") or "password123",
            "streetName": data["address"]["street"],
            "streetNumber": "",
            "city": data["address"]["city"],
            "stateProvince": data["address"]["stateProvince"],
            "zipCode": data["address"]["zipCode"],
            "country": data["address"]["country"],
            "idType": data["idType"],
            "idNumber": data["idNumber"],
        }
    )

def db_update_customer(customer_id, data):
    person_id = _extract_numeric_id(customer_id)
    if person_id is None:
        return None

    street_number, street_name = _split_street(data["address"].get("street"))
    query = """
        UPDATE person
        SET
            first_name = %s,
            last_name = %s,
            ssn_type = %s,
            ssn_number = %s,
            country = %s,
            city = %s,
            region = %s,
            street_name = %s,
            street_number = %s,
            postalcode = %s,
            email = %s,
            password = COALESCE(NULLIF(NULLIF(%s, ''), '***'), password)
        WHERE person_id = %s
          AND person_id IN (SELECT person_id FROM customer);
    """

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                query,
                (
                    data["firstName"],
                    data["lastName"],
                    _normalize_id_type(data["idType"]),
                    data["idNumber"],
                    data["address"]["country"],
                    data["address"]["city"],
                    data["address"]["stateProvince"],
                    street_name,
                    street_number,
                    data["address"]["zipCode"],
                    data["email"],
                    data.get("password") or "",
                    person_id,
                ),
            )
            if cur.rowcount == 0:
                conn.rollback()
                return None

        conn.commit()
        return db_get_customer_by_id(person_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def db_delete_customer(customer_id):
    person_id = _extract_numeric_id(customer_id)
    if person_id is None:
        return False

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM customer WHERE person_id = %s RETURNING person_id;", (person_id,))
            if not cur.fetchone():
                return False

        conn.commit()
        return True
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# --- Bookings ---

def db_get_all_bookings():
    query = """
        SELECT
            hr.reservation_id,
            hr.person_id,
            hr.chain_id,
            hr.hotel_id,
            hr.room_num,
            hr.start_date,
            hr.end_date,
            hr.created_at,
            hr.status,
            hb.booked_date,
            hb.future_price,
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
                SELECT he.email FROM hotel_email he
                WHERE he.chain_id = h.chain_id AND he.hotel_id = h.hotel_id
                ORDER BY he.email LIMIT 1
            ) AS hotel_contact_email,
            (
                SELECT hp.phone_number FROM hotel_phone hp
                WHERE hp.chain_id = h.chain_id AND hp.hotel_id = h.hotel_id
                ORDER BY hp.phone_number LIMIT 1
            ) AS hotel_contact_phone,
            (
                SELECT COUNT(*) FROM rooms rr
                WHERE rr.chain_id = h.chain_id AND rr.hotel_id = h.hotel_id
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
                SELECT 1 FROM room_extendible re
                WHERE re.chain_id = r.chain_id AND re.hotel_id = r.hotel_id AND TRIM(re.room_num) = TRIM(r.room_num)
            ) AS is_extendable,
            (
                SELECT ARRAY_AGG(ra.amenity ORDER BY ra.amenity)
                FROM room_amenities ra
                WHERE ra.chain_id = r.chain_id AND ra.hotel_id = r.hotel_id AND TRIM(ra.room_num) = TRIM(r.room_num)
            ) AS amenities,
            (
                SELECT ARRAY_AGG(ri.issue ORDER BY ri.issue)
                FROM room_issues ri
                WHERE ri.chain_id = r.chain_id AND ri.hotel_id = r.hotel_id AND TRIM(ri.room_num) = TRIM(r.room_num)
            ) AS issues
        FROM hotel_reservation hr
        JOIN hotel_booking hb ON hb.reservation_id = hr.reservation_id
        JOIN rooms r ON r.chain_id = hr.chain_id AND r.hotel_id = hr.hotel_id AND TRIM(r.room_num) = TRIM(hr.room_num)
        JOIN hotels h ON h.chain_id = hr.chain_id AND h.hotel_id = hr.hotel_id
        JOIN person p ON p.person_id = hr.person_id
        JOIN customer c ON c.person_id = hr.person_id
        WHERE hr.reservation_type = 'booking'
        ORDER BY hb.booked_date DESC;
    """
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query)
            return [_map_booking_row(r) for r in cur.fetchall()]
    finally:
        conn.close()

def db_get_booking_by_id(booking_id):
    reservation_id = _extract_numeric_id(booking_id)
    if reservation_id is None:
        return None
    all_rows = db_get_all_bookings()
    return next((b for b in all_rows if b["id"] == f"book-{reservation_id}"), None)

def db_get_bookings_by_customer(customer_id):
    person_id = _extract_numeric_id(customer_id)
    if person_id is None:
        return []
    all_rows = db_get_all_bookings()
    return [b for b in all_rows if b["customerId"] == f"cust-{person_id}"]

def db_get_bookings_by_hotel(hotel_id):
    numeric_hotel_id = _extract_numeric_id(hotel_id)
    if numeric_hotel_id is None:
        return []
    all_rows = db_get_all_bookings()
    return [b for b in all_rows if b["room"]["hotelId"] == f"hotel-{numeric_hotel_id}"]

def db_create_booking(data):
    customer_person_id = _extract_numeric_id(data.get("customerId"))
    chain_id, hotel_id, room_num = _extract_room_parts(data.get("roomId"))

    if customer_person_id is None or room_num is None:
        return None

    _validate_date_range(data.get("checkInDate"), data.get("checkOutDate"))

    room_lookup = """
        SELECT chain_id, hotel_id, room_num, price
        FROM rooms
        WHERE TRIM(room_num) = TRIM(%s)
          AND (%s IS NULL OR chain_id = %s)
          AND (%s IS NULL OR hotel_id = %s)
        ORDER BY chain_id, hotel_id
        LIMIT 1;
    """
    conflict_query = """
        SELECT 1
        FROM hotel_reservation hr
        WHERE hr.chain_id = %s
          AND hr.hotel_id = %s
          AND TRIM(hr.room_num) = TRIM(%s)
          AND hr.status NOT IN ('Cancelled', 'CheckedOut', 'Completed')
          AND hr.start_date < %s::date
          AND hr.end_date > %s::date
        LIMIT 1;
    """
    insert_res = """
        INSERT INTO hotel_reservation (
            start_date, end_date, created_at,
            reservation_type, status, person_id,
            chain_id, hotel_id, room_num
        )
        VALUES (%s, %s, CURRENT_TIMESTAMP, 'booking', 'Confirmed', %s, %s, %s, %s)
        RETURNING reservation_id;
    """
    insert_booking = """
        INSERT INTO hotel_booking (reservation_id, booked_date, future_price)
        VALUES (%s, CURRENT_TIMESTAMP, ((%s::date - %s::date) * %s * 1.23));
    """
    insert_has = """
        INSERT INTO has (chain_id, hotel_id, room_num, reservation_id)
        VALUES (%s, %s, %s, %s);
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(room_lookup, (room_num, chain_id, chain_id, hotel_id, hotel_id))
            room_row = cur.fetchone()
            if not room_row:
                conn.rollback()
                return None

            resolved_chain_id = room_row["chain_id"]
            resolved_hotel_id = room_row["hotel_id"]
            resolved_room_num = room_row["room_num"].strip()

            cur.execute(
                conflict_query,
                (resolved_chain_id, resolved_hotel_id, resolved_room_num, data["checkOutDate"], data["checkInDate"]),
            )
            if cur.fetchone():
                conn.rollback()
                raise ValueError("Room not available for selected dates")

            cur.execute(
                insert_res,
                (
                    data["checkInDate"],
                    data["checkOutDate"],
                    customer_person_id,
                    resolved_chain_id,
                    resolved_hotel_id,
                    resolved_room_num,
                ),
            )
            reservation_id = cur.fetchone()["reservation_id"]

            cur.execute(insert_booking, (reservation_id, data["checkOutDate"], data["checkInDate"], room_row["price"]))
            cur.execute(insert_has, (resolved_chain_id, resolved_hotel_id, resolved_room_num, reservation_id))

        conn.commit()
        return db_get_booking_by_id(f"book-{reservation_id}")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def db_cancel_booking(booking_id):
    reservation_id = _extract_numeric_id(booking_id)
    if reservation_id is None:
        return False

    query = """
        WITH booking_to_cancel AS (
            SELECT 
                hr.reservation_id,
                hr.created_at,
                h.hotel_name,
                hc.chain_name,
                hr.room_num,
                hr.person_id AS customer_id,
                p.first_name || ' ' || p.last_name AS customer_name,
                hr.status,
                hr.reservation_type,
                hb.booked_date,
                hr.start_date,
                hr.end_date
            FROM "HotelProject".hotel_reservation hr
            JOIN "HotelProject".hotel_booking hb ON hr.reservation_id = hb.reservation_id
            JOIN "HotelProject".rooms r ON hr.chain_id = r.chain_id AND hr.hotel_id = r.hotel_id AND TRIM(r.room_num) = TRIM(hr.room_num)
            JOIN "HotelProject".hotels h ON r.chain_id = h.chain_id AND r.hotel_id = h.hotel_id
            JOIN "HotelProject".hotel_chains hc ON h.chain_id = hc.chain_id
            JOIN "HotelProject".person p ON hr.person_id = p.person_id
            WHERE hr.reservation_id = %s
        ),
        archived AS (
            INSERT INTO "HotelProject".archived_reservation (
                creation_date,
                archived_price_paid,
                archived_hotel_name,
                archived_chain_name,
                archived_room_num,
                archived_customer_id,
                archived_customer_name,
                archived_status,
                archived_type,
                archived_subtype,
                archived_booked_date,
                res_start_date,
                res_end_date
            )
            SELECT
                created_at,
                NULL,
                hotel_name,
                chain_name,
                room_num,
                customer_id,
                customer_name,
                status,
                reservation_type,
                'cancelled_booking',
                booked_date,
                start_date,
                end_date
            FROM booking_to_cancel
            RETURNING 1
        ),
        delete_has AS (
            DELETE FROM "HotelProject".has
            WHERE reservation_id IN (SELECT reservation_id FROM booking_to_cancel)
            RETURNING 1
        )
        DELETE FROM "HotelProject".hotel_reservation
        WHERE reservation_id IN (SELECT reservation_id FROM booking_to_cancel);
    """

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, (reservation_id,))
            if cur.rowcount == 0:
                conn.rollback()
                return False
        conn.commit()
        return True
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def db_archive_renting(renting_id, employee_id):
    reservation_id = _extract_numeric_id(renting_id)
    employee_person_id = _extract_numeric_id(employee_id)
    if reservation_id is None or employee_person_id is None:
        return False

    query = """
        WITH renting_to_archive AS (
            SELECT
                hr.reservation_id,
                hr.chain_id,
                hr.hotel_id,
                hr.room_num,
                hr.created_at,
                hr.person_id AS customer_id,
                hr.status,
                hr.reservation_type,
                hr.converted_from_res_id,
                hr.start_date,
                hr.end_date,
                h.hotel_name,
                hc.chain_name,
                hrt.checked_in_time,
                hrt.checked_out_time,
                hrt.price_paid,
                hrt.person_id AS renting_employee_id,
                p.first_name || ' ' || p.last_name AS customer_name
            FROM hotel_reservation hr
            JOIN hotel_renting hrt ON hrt.reservation_id = hr.reservation_id
            JOIN hotels h ON h.chain_id = hr.chain_id AND h.hotel_id = hr.hotel_id
            JOIN hotel_chains hc ON hc.chain_id = hr.chain_id
            JOIN person p ON p.person_id = hr.person_id
            WHERE hr.reservation_id = %s
              AND hr.reservation_type = 'renting'
              AND EXISTS (
                  SELECT 1
                  FROM employee e
                  WHERE e.person_id = %s
                    AND e.chain_id = hr.chain_id
                    AND e.hotel_id = hr.hotel_id
              )
        ),
        archived AS (
            INSERT INTO archived_reservation (
                archive_date,
                creation_date,
                archived_price_paid,
                archived_hotel_name,
                archived_chain_name,
                archived_room_num,
                archived_customer_id,
                archived_employee_id,
                archived_customer_name,
                archived_status,
                archived_type,
                archived_subtype,
                archived_checked_in,
                archived_checked_out,
                archived_booked_date,
                res_start_date,
                res_end_date
            )
            SELECT
                CURRENT_TIMESTAMP,
                created_at,
                COALESCE(price_paid, 0),
                hotel_name,
                chain_name,
                room_num,
                customer_id,
                %s,
                customer_name,
                status,
                reservation_type,
                CASE
                    WHEN converted_from_res_id IS NOT NULL THEN 'converted_from_booking'
                    WHEN status IN ('Completed', 'CheckedOut') THEN 'completed_renting'
                    ELSE 'direct_renting'
                END,
                checked_in_time,
                checked_out_time,
                NULL,
                start_date,
                end_date
            FROM renting_to_archive
            RETURNING archive_id
        ),
        update_room AS (
            UPDATE rooms r
            SET status = 'Available'
            FROM renting_to_archive ra
            WHERE r.chain_id = ra.chain_id
              AND r.hotel_id = ra.hotel_id
              AND TRIM(r.room_num) = TRIM(ra.room_num)
            RETURNING r.room_num
        ),
        delete_has AS (
            DELETE FROM has
            WHERE reservation_id IN (SELECT reservation_id FROM renting_to_archive)
            RETURNING reservation_id
        )
        DELETE FROM hotel_reservation
        WHERE reservation_id IN (SELECT reservation_id FROM renting_to_archive);
    """

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, (reservation_id, employee_person_id, employee_person_id))
            if cur.rowcount == 0:
                conn.rollback()
                return False
        conn.commit()
        return True
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def db_convert_booking_to_renting(booking_id, employee_id):
    reservation_id = _extract_numeric_id(booking_id)
    employee_person_id = _extract_numeric_id(employee_id)
    if reservation_id is None or employee_person_id is None:
        return None

    booking_lookup = """
        SELECT
            hr.reservation_id,
            hr.chain_id,
            hr.hotel_id,
            hr.room_num,
            hr.start_date,
            hr.end_date,
            hr.created_at,
            hr.person_id,
            hr.status,
            rm.price,
            hb.booked_date,
            hb.future_price,
            h.hotel_name,
            hc.chain_name,
            p.first_name,
            p.last_name
        FROM hotel_reservation hr
        JOIN hotel_booking hb ON hb.reservation_id = hr.reservation_id
        JOIN rooms rm ON rm.chain_id = hr.chain_id AND rm.hotel_id = hr.hotel_id AND TRIM(rm.room_num) = TRIM(hr.room_num)
        LEFT JOIN hotels h ON h.chain_id = hr.chain_id AND h.hotel_id = hr.hotel_id
        LEFT JOIN hotel_chains hc ON hc.chain_id = hr.chain_id
        LEFT JOIN person p ON p.person_id = hr.person_id
        WHERE hr.reservation_id = %s
          AND hr.reservation_type = 'booking'
          AND hr.status = 'Confirmed'
        LIMIT 1;
    """
    employee_hotel_check = """
        SELECT 1
        FROM employee
        WHERE person_id = %s
          AND chain_id = %s
          AND hotel_id = %s
        LIMIT 1;
    """
    archive_booking = """
        INSERT INTO archived_reservation (
            archive_date,
            creation_date,
            archived_price_paid,
            archived_hotel_name,
            archived_chain_name,
            archived_room_num,
            archived_customer_id,
            archived_employee_id,
            archived_customer_name,
            archived_status,
            archived_type,
            archived_subtype,
            archived_checked_in,
            archived_checked_out,
            archived_booked_date,
            res_start_date,
            res_end_date
        )
        VALUES (
            CURRENT_TIMESTAMP,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            'booking',
            'converted_from_booking',
            CURRENT_TIMESTAMP,
            NULL,
            %s,
            %s,
            %s
        );
    """
    insert_renting = """
        INSERT INTO hotel_renting (reservation_id, checked_in_time, rental_price, price_paid, person_id)
        VALUES (%s, CURRENT_TIMESTAMP, ((%s::date - %s::date) * %s), NULL, %s)
        ON CONFLICT (reservation_id) DO UPDATE
        SET
            rental_price = EXCLUDED.rental_price,
            price_paid = EXCLUDED.price_paid,
            person_id = EXCLUDED.person_id;
    """
    update_reservation = """
        UPDATE hotel_reservation
        SET reservation_type = 'renting',
            status = 'CheckedIn',
            converted_from_res_id = %s
        WHERE reservation_id = %s;
    """
    delete_booking = "DELETE FROM hotel_booking WHERE reservation_id = %s;"
    update_room = """
        UPDATE rooms
        SET status = 'Occupied'
        WHERE chain_id = %s AND hotel_id = %s AND TRIM(room_num) = TRIM(%s);
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(booking_lookup, (reservation_id,))
            row = cur.fetchone()
            if not row:
                conn.rollback()
                return None

            cur.execute(employee_hotel_check, (employee_person_id, row["chain_id"], row["hotel_id"]))
            if not cur.fetchone():
                conn.rollback()
                raise ValueError("Employee is not authorized to check in this booking")

            customer_name = " ".join(
                part for part in [row.get("first_name"), row.get("last_name")] if part
            ).strip() or "Unknown Customer"

            cur.execute(
                archive_booking,
                (
                    row["created_at"],
                    None,  # No price paid for the original booking
                    row.get("hotel_name"),
                    row.get("chain_name"),
                    row["room_num"].strip(),
                    row["person_id"],
                    employee_person_id,
                    customer_name,
                    row["status"],
                    row.get("booked_date"),
                    row["start_date"],
                    row["end_date"],
                ),
            )

            cur.execute(
                insert_renting,
                (
                    reservation_id,
                    row["end_date"].isoformat(),
                    row["start_date"].isoformat(),
                    row["price"],
                    employee_person_id,
                ),
            )
            cur.execute(update_reservation, (reservation_id, reservation_id))
            cur.execute(delete_booking, (reservation_id,))
            cur.execute(update_room, (row["chain_id"], row["hotel_id"], row["room_num"].strip()))

        conn.commit()
        return db_get_renting_by_id(f"rent-{reservation_id}")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def db_get_archived_reservations(chain_id=None, hotel_id=None):
    numeric_chain_id = _extract_numeric_id(chain_id)
    numeric_hotel_id = _extract_numeric_id(hotel_id)
    query = """
        SELECT
            ar.archive_id,
            ar.archive_date,
            ar.archived_price_paid,
            ar.archived_hotel_name,
            ar.archived_chain_name,
            ar.archived_room_num,
            ar.archived_customer_id,
            ar.archived_customer_name,
            ar.archived_status,
            ar.archived_type,
            ar.archived_subtype,
            ar.res_start_date,
            ar.res_end_date,
            hc.chain_id,
            h.hotel_id,
            p.email AS customer_email,
            CASE
                WHEN r.capacity = 1 THEN 'Single'
                WHEN r.capacity = 2 THEN 'Double'
                WHEN r.capacity = 3 THEN 'Triple'
                WHEN r.capacity = 4 THEN 'Family'
                ELSE 'Suite'
            END AS room_type
        FROM archived_reservation ar
        LEFT JOIN hotel_chains hc ON hc.chain_name = ar.archived_chain_name
        LEFT JOIN hotels h ON h.chain_id = hc.chain_id AND h.hotel_name = ar.archived_hotel_name
        LEFT JOIN person p ON p.person_id = ar.archived_customer_id
        LEFT JOIN rooms r ON r.chain_id = h.chain_id AND r.hotel_id = h.hotel_id AND TRIM(r.room_num) = TRIM(ar.archived_room_num)
        WHERE (%s IS NULL OR hc.chain_id = %s)
          AND (%s IS NULL OR h.hotel_id = %s)
        ORDER BY ar.archive_date DESC;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, (numeric_chain_id, numeric_chain_id, numeric_hotel_id, numeric_hotel_id))
            return [_map_archived_reservation_row(row) for row in cur.fetchall()]
    finally:
        conn.close()


# --- Rentings ---

def db_get_all_rentings():
    query = """
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
                SELECT he.email FROM hotel_email he
                WHERE he.chain_id = h.chain_id AND he.hotel_id = h.hotel_id
                ORDER BY he.email LIMIT 1
            ) AS hotel_contact_email,
            (
                SELECT hp.phone_number FROM hotel_phone hp
                WHERE hp.chain_id = h.chain_id AND hp.hotel_id = h.hotel_id
                ORDER BY hp.phone_number LIMIT 1
            ) AS hotel_contact_phone,
            (
                SELECT COUNT(*) FROM rooms rr
                WHERE rr.chain_id = h.chain_id AND rr.hotel_id = h.hotel_id
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
                SELECT 1 FROM room_extendible re
                WHERE re.chain_id = r.chain_id AND re.hotel_id = r.hotel_id AND TRIM(re.room_num) = TRIM(r.room_num)
            ) AS is_extendable,
            (
                SELECT ARRAY_AGG(ra.amenity ORDER BY ra.amenity)
                FROM room_amenities ra
                WHERE ra.chain_id = r.chain_id AND ra.hotel_id = r.hotel_id AND TRIM(ra.room_num) = TRIM(r.room_num)
            ) AS amenities,
            (
                SELECT ARRAY_AGG(ri.issue ORDER BY ri.issue)
                FROM room_issues ri
                WHERE ri.chain_id = r.chain_id AND ri.hotel_id = r.hotel_id AND TRIM(ri.room_num) = TRIM(r.room_num)
            ) AS issues
        FROM hotel_reservation hr
        JOIN hotel_renting hrt ON hrt.reservation_id = hr.reservation_id
        JOIN rooms r ON r.chain_id = hr.chain_id AND r.hotel_id = hr.hotel_id AND TRIM(r.room_num) = TRIM(hr.room_num)
        JOIN hotels h ON h.chain_id = hr.chain_id AND h.hotel_id = hr.hotel_id
        JOIN person p ON p.person_id = hr.person_id
        JOIN customer c ON c.person_id = hr.person_id
        WHERE hr.reservation_type = 'renting'
        ORDER BY hr.created_at DESC;
    """
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query)
            return [_map_renting_row(r) for r in cur.fetchall()]
    finally:
        conn.close()

def db_get_renting_by_id(renting_id):
    reservation_id = _extract_numeric_id(renting_id)
    if reservation_id is None:
        return None
    all_rows = db_get_all_rentings()
    return next((r for r in all_rows if r["id"] == f"rent-{reservation_id}"), None)

def db_get_rentings_by_customer(customer_id):
    person_id = _extract_numeric_id(customer_id)
    if person_id is None:
        return []
    all_rows = db_get_all_rentings()
    return [r for r in all_rows if r["customerId"] == f"cust-{person_id}"]

def db_get_rentings_by_hotel(hotel_id):
    numeric_hotel_id = _extract_numeric_id(hotel_id)
    if numeric_hotel_id is None:
        return []
    all_rows = db_get_all_rentings()
    return [r for r in all_rows if r["room"]["hotelId"] == f"hotel-{numeric_hotel_id}"]

def db_create_renting(data):
    customer_person_id = _extract_numeric_id(data.get("customerId"))
    employee_person_id = _extract_numeric_id(data.get("employeeId"))
    chain_id, hotel_id, room_num = _extract_room_parts(data.get("roomId"))

    if customer_person_id is None or employee_person_id is None or room_num is None:
        return None

    room_lookup = """
        SELECT chain_id, hotel_id, room_num, price
        FROM rooms
        WHERE TRIM(room_num) = TRIM(%s)
          AND (%s IS NULL OR chain_id = %s)
          AND (%s IS NULL OR hotel_id = %s)
        ORDER BY chain_id, hotel_id
        LIMIT 1;
    """
    conflict_query = """
        SELECT 1
        FROM hotel_reservation hr
        WHERE hr.chain_id = %s
          AND hr.hotel_id = %s
          AND TRIM(hr.room_num) = TRIM(%s)
          AND hr.status NOT IN ('Cancelled', 'CheckedOut', 'Completed')
          AND hr.start_date < %s::date
          AND hr.end_date > %s::date
        LIMIT 1;
    """
    insert_res = """
        INSERT INTO hotel_reservation (
            start_date, end_date, created_at,
            reservation_type, status, person_id,
            chain_id, hotel_id, room_num
        )
        VALUES (%s, %s, CURRENT_TIMESTAMP, 'renting', 'CheckedIn', %s, %s, %s, %s)
        RETURNING reservation_id;
    """
    insert_rent = """
        INSERT INTO hotel_renting (reservation_id, checked_in_time, rental_price, price_paid, person_id)
        VALUES (%s, CURRENT_TIMESTAMP, ((%s::date - %s::date) * %s), NULL, %s);
    """
    insert_has = "INSERT INTO has (chain_id, hotel_id, room_num, reservation_id) VALUES (%s, %s, %s, %s);"
    update_room = "UPDATE rooms SET status = 'Occupied' WHERE chain_id = %s AND hotel_id = %s AND TRIM(room_num) = TRIM(%s);"

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(room_lookup, (room_num, chain_id, chain_id, hotel_id, hotel_id))
            room_row = cur.fetchone()
            if not room_row:
                conn.rollback()
                return None

            resolved_chain_id = room_row["chain_id"]
            resolved_hotel_id = room_row["hotel_id"]
            resolved_room_num = room_row["room_num"].strip()

            cur.execute(
                conflict_query,
                (resolved_chain_id, resolved_hotel_id, resolved_room_num, data["check_out_date"], data["check_in_date"]),
            )
            if cur.fetchone():
                conn.rollback()
                raise ValueError("Room not available for selected dates")

            cur.execute(
                insert_res,
                (
                    data["check_in_date"],
                    data["check_out_date"],
                    customer_person_id,
                    resolved_chain_id,
                    resolved_hotel_id,
                    resolved_room_num,
                ),
            )
            reservation_id = cur.fetchone()["reservation_id"]

            cur.execute(
                insert_rent,
                (
                    reservation_id,
                    data["check_out_date"],
                    data["check_in_date"],
                    room_row["price"],
                    employee_person_id,
                ),
            )
            cur.execute(insert_has, (resolved_chain_id, resolved_hotel_id, resolved_room_num, reservation_id))
            cur.execute(update_room, (resolved_chain_id, resolved_hotel_id, resolved_room_num))

        conn.commit()
        return db_get_renting_by_id(f"rent-{reservation_id}")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def db_create_walkin_renting(data):
    customer = data.get("customer") or {}

    employee_person_id = _extract_numeric_id(data.get("employee_id"))
    chain_id, hotel_id, room_num = _extract_room_parts(data.get("room_id"))
    street_number = _extract_numeric_id(customer.get("street_number"))

    if employee_person_id is None or room_num is None:
        return None

    room_lookup = """
        SELECT chain_id, hotel_id, room_num, price
        FROM rooms
        WHERE TRIM(room_num) = TRIM(%s)
          AND (%s IS NULL OR chain_id = %s)
          AND (%s IS NULL OR hotel_id = %s)
        ORDER BY chain_id, hotel_id
        LIMIT 1;
    """
    conflict_query = """
        SELECT 1
        FROM hotel_reservation hr
        WHERE hr.chain_id = %s
          AND hr.hotel_id = %s
          AND TRIM(hr.room_num) = TRIM(%s)
          AND hr.status NOT IN ('Cancelled', 'CheckedOut', 'Completed')
          AND hr.start_date < %s::date
          AND hr.end_date > %s::date
        LIMIT 1;
    """
    insert_person = """
        INSERT INTO person (
            first_name,
            last_name,
            ssn_type,
            ssn_number,
            country,
            city,
            region,
            street_name,
            street_number,
            postalcode,
            email,
            password
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING person_id;
    """
    insert_customer = """
        INSERT INTO customer (person_id, register_date)
        VALUES (%s, CURRENT_DATE);
    """
    insert_res = """
        INSERT INTO hotel_reservation (
            start_date, end_date, created_at,
            reservation_type, status, person_id,
            chain_id, hotel_id, room_num
        )
        VALUES (%s, %s, CURRENT_TIMESTAMP, 'renting', 'CheckedIn', %s, %s, %s, %s)
        RETURNING reservation_id;
    """
    insert_rent = """
        INSERT INTO hotel_renting (reservation_id, checked_in_time, rental_price, price_paid, person_id)
        VALUES (%s, CURRENT_TIMESTAMP, ((%s::date - %s::date) * %s), NULL, %s);
    """
    insert_has = "INSERT INTO has (chain_id, hotel_id, room_num, reservation_id) VALUES (%s, %s, %s, %s);"
    update_room = "UPDATE rooms SET status = 'Occupied' WHERE chain_id = %s AND hotel_id = %s AND TRIM(room_num) = TRIM(%s);"

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(room_lookup, (room_num, chain_id, chain_id, hotel_id, hotel_id))
            room_row = cur.fetchone()
            if not room_row:
                conn.rollback()
                return None

            resolved_chain_id = room_row["chain_id"]
            resolved_hotel_id = room_row["hotel_id"]
            resolved_room_num = room_row["room_num"].strip()

            cur.execute(
                conflict_query,
                (
                    resolved_chain_id,
                    resolved_hotel_id,
                    resolved_room_num,
                    data["check_out_date"],
                    data["check_in_date"],
                ),
            )
            if cur.fetchone():
                conn.rollback()
                raise ValueError("Room not available for selected dates")

            cur.execute(
                insert_person,
                (
                    customer["first_name"],
                    customer["last_name"],
                    _normalize_id_type(customer["ssn_type"]),
                    customer["ssn_number"],
                    customer["country"],
                    customer["city"],
                    customer["region"],
                    customer["street_name"],
                    street_number,
                    customer["postalcode"],
                    customer["email"],
                    customer["password"],
                ),
            )
            customer_person_id = cur.fetchone()["person_id"]
            cur.execute(insert_customer, (customer_person_id,))

            cur.execute(
                insert_res,
                (
                    data["check_in_date"],
                    data["check_out_date"],
                    customer_person_id,
                    resolved_chain_id,
                    resolved_hotel_id,
                    resolved_room_num,
                ),
            )
            reservation_id = cur.fetchone()["reservation_id"]

            cur.execute(
                insert_rent,
                (
                    reservation_id,
                    data["check_out_date"],
                    data["check_in_date"],
                    room_row["price"],
                    employee_person_id,
                ),
            )
            cur.execute(insert_has, (resolved_chain_id, resolved_hotel_id, resolved_room_num, reservation_id))
            cur.execute(update_room, (resolved_chain_id, resolved_hotel_id, resolved_room_num))

        conn.commit()
        return db_get_renting_by_id(f"rent-{reservation_id}")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# --- Payments ---

def db_get_payments_by_renting(renting_id):
    renting = db_get_renting_by_id(renting_id)
    if not renting:
        return []
    if renting["amountPaid"] <= 0:
        return []

    return [
        {
            "id": f"pay-{_extract_numeric_id(renting_id)}",
            "rentingId": renting["id"],
            "amount": renting["amountPaid"],
            "paymentMethod": "Credit Card",
            "paymentDate": renting["createdAt"],
            "employeeId": renting["employeeId"],
            "notes": "Derived from renting completion",
        }
    ]

def db_create_payment(data):
    reservation_id = _extract_numeric_id(data.get("rentingId"))
    employee_person_id = _extract_numeric_id(data.get("employeeId"))
    if reservation_id is None or employee_person_id is None:
        return None

    mark_paid_query = """
        UPDATE hotel_renting
        SET price_paid = rental_price
        WHERE reservation_id = %s
                    AND person_id = %s
          AND price_paid IS NULL
          AND %s::numeric >= rental_price
        RETURNING rental_price;
    """
    complete_reservation_query = """
        UPDATE hotel_reservation
        SET status = 'Completed'
        WHERE reservation_id = %s
          AND reservation_type = 'renting';
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(mark_paid_query, (reservation_id, employee_person_id, data["amount"]))
            paid_row = cur.fetchone()
            if not paid_row:
                cur.execute(
                    "SELECT 1 FROM hotel_renting WHERE reservation_id = %s LIMIT 1;",
                    (reservation_id,),
                )
                renting_exists = cur.fetchone() is not None
                if not renting_exists:
                    conn.rollback()
                    return None
                raise PermissionError("You can only process payments for rentings you converted.")

            cur.execute(complete_reservation_query, (reservation_id,))
            if cur.rowcount == 0:
                conn.rollback()
                return None
        conn.commit()
        return {
            "id": f"pay-{reservation_id}-{int(datetime.utcnow().timestamp())}",
            "rentingId": f"rent-{reservation_id}",
            "amount": float(paid_row[0]),
            "paymentMethod": data["paymentMethod"],
            "paymentDate": datetime.utcnow().isoformat() + "Z",
            "employeeId": data["employeeId"],
            "notes": data.get("notes"),
        }
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# --- Search ---

def db_search_available_rooms(criteria):  # shuaib0-0
    """
    Search for available rooms based on criteria.
    Filters by price range and applies date-based availability checks.
    """
    where_clauses = []
    params = []

    min_price = criteria.get("minPrice")
    if min_price is not None:
        where_clauses.append("r.price >= %s")
        params.append(min_price)

    max_price = criteria.get("maxPrice")
    if max_price is not None:
        where_clauses.append("r.price <= %s")
        params.append(max_price)

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    query = f"""
        SELECT
            r.chain_id,
            r.hotel_id,
            r.room_num,
            r.price,
            r.capacity,
            r.view,
            r.status,
            (
                SELECT ARRAY_AGG(ra.amenity ORDER BY ra.amenity)
                FROM room_amenities ra
                WHERE ra.chain_id = r.chain_id
                  AND ra.hotel_id = r.hotel_id
                  AND ra.room_num = r.room_num
            ) AS amenities,
            EXISTS (
                SELECT 1
                FROM room_extendible re
                WHERE re.chain_id = r.chain_id
                  AND re.hotel_id = r.hotel_id
                  AND re.room_num = r.room_num
            ) AS is_extendable,
            (
                SELECT ARRAY_AGG(re.extendible ORDER BY re.extendible)
                FROM room_extendible re
                WHERE re.chain_id = r.chain_id
                    AND re.hotel_id = r.hotel_id
                    AND re.room_num = r.room_num
            ) AS extendable_with,
            (
                SELECT ARRAY_AGG(ri.issue ORDER BY ri.issue)
                FROM room_issues ri
                WHERE ri.chain_id = r.chain_id
                  AND ri.hotel_id = r.hotel_id
                  AND ri.room_num = r.room_num
            ) AS issues
        FROM rooms r
        {where_sql}
        ORDER BY r.chain_id, r.hotel_id, r.room_num;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, tuple(params))
            rooms = cur.fetchall()
            
            # Filter by availability if dates provided
            if criteria.get("checkInDate") and criteria.get("checkOutDate"):
                available_rooms = []
                for room in rooms:
                    if not db_check_room_availability(
                        f"room-{room['chain_id']}-{room['hotel_id']}-{room['room_num']}",
                        criteria["checkInDate"],
                        criteria["checkOutDate"]
                    ):
                        available_rooms.append(room)
                rooms = available_rooms
            
            return [_map_room_row(r) for r in rooms]
    finally:
        conn.close()


def db_check_room_availability(room_id, check_in, check_out):
    """
    Check if a room is available for the given date range.
    Returns False if available, True if there's a conflict.
    """
    chain_id, hotel_id, room_num = _extract_room_parts(room_id)
    if room_num is None:
        return True  # Not available if room cannot be identified

    try:
        _validate_date_range(check_in, check_out)
    except ValueError:
        return True

    query = """
        SELECT 1
        FROM hotel_reservation hr
        WHERE hr.chain_id = %s
          AND hr.hotel_id = %s
          AND TRIM(hr.room_num) = TRIM(%s)
          AND hr.status NOT IN ('Cancelled', 'CheckedOut', 'Completed')
          AND hr.start_date < %s::date
          AND hr.end_date > %s::date
        LIMIT 1;
    """

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, (chain_id, hotel_id, room_num, check_out, check_in))
            return cur.fetchone() is not None  # True if conflict exists
    finally:
        conn.close()


# --- Analytics (SQL Views) ---

def db_get_available_rooms_per_area():
    """
    Retrieve the materialized view of available rooms grouped by area, chain, and hotel.
    This shows room availability per geographic area and chain.
    """
    query = """
        SELECT
            rpa.region,
            rpa.chain_name,
            rpa.hotel_name,
            rpa.available_rooms
        FROM rooms_per_area rpa
        ORDER BY rpa.region, rpa.chain_name, rpa.hotel_name;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("REFRESH MATERIALIZED VIEW rooms_per_area;")
            cur.execute(query)
            rows = cur.fetchall()
            
            # Format the response
            result = []
            for row in rows:
                result.append({
                    "region": row["region"],
                    "chainName": row["chain_name"],
                    "hotelName": row["hotel_name"],
                    "availableRooms": int(row["available_rooms"] or 0),
                })
            return result
    finally:
        conn.close()


def db_get_hotel_capacity():
    """
    Retrieve the materialized view of aggregated room capacity per hotel.
    This shows total room capacity grouped by hotel and chain.
    """
    query = """
        SELECT
            hrc.chain_id,
            hrc.hotel_id,
            hrc.hotel_name,
            hc.chain_name,
            COALESCE(rc.total_rooms, 0) AS total_rooms,
            hrc.aggregate_capacity
        FROM rooms_cap_per_hotel hrc
        LEFT JOIN hotel_chains hc ON hc.chain_id = hrc.chain_id
        LEFT JOIN (
            SELECT chain_id, hotel_id, COUNT(*) AS total_rooms
            FROM rooms
            GROUP BY chain_id, hotel_id
        ) rc ON rc.chain_id = hrc.chain_id AND rc.hotel_id = hrc.hotel_id
        ORDER BY hrc.chain_id, hrc.hotel_id;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("REFRESH MATERIALIZED VIEW rooms_cap_per_hotel;")
            cur.execute(query)
            rows = cur.fetchall()
            
            # Format and enrich the response
            result = []
            for row in rows:
                total_rooms = int(row["total_rooms"] or 0)
                total_capacity = int(row["aggregate_capacity"] or 0)
                result.append({
                    "hotelId": f"hotel-{row['hotel_id']}",
                    "chainId": f"chain-{row['chain_id']}",
                    "hotelName": row["hotel_name"],
                    "chainName": row.get("chain_name") or "Unknown",
                    "totalRooms": total_rooms,
                    "totalCapacity": total_capacity,
                    "averageCapacityPerRoom": (total_capacity / total_rooms) if total_rooms > 0 else 0,
                })
            return result
    finally:
        conn.close()


def db_get_avg_price_by_chain(chain_id):
    """
    Get the average room price for all hotels in a given chain.
    """
    numeric_chain_id = _extract_numeric_id(chain_id)
    if numeric_chain_id is None:
        return []

    query = """
        SELECT
            h.hotel_id,
            AVG(r.price) AS average_room_price
        FROM rooms r
        JOIN hotels h ON r.hotel_id = h.hotel_id
        WHERE h.chain_id = %s
        GROUP BY h.hotel_id;
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, (numeric_chain_id,))
            return cur.fetchall()
    finally:
        conn.close()
