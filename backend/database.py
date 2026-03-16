import psycopg2
from psycopg2.extras import RealDictCursor
from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD


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


# ============================================================================
# BLANK QUERY STUBS
# Replace 'pass' with actual SQL queries when ready to use the database.
# Each function shows the intended query as a comment.
# ============================================================================


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
    # query = "INSERT INTO hotel_chain (...) VALUES (...) RETURNING *"
    pass

def db_update_chain(chain_id, data):
    # query = "UPDATE hotel_chain SET ... WHERE id = %s RETURNING *"
    pass

def db_delete_chain(chain_id):
    # query = "DELETE FROM hotel_chain WHERE id = %s"
    pass


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
    # query = "INSERT INTO hotel (...) VALUES (...) RETURNING *"
    pass

def db_update_hotel(hotel_id, data):
    # query = "UPDATE hotel SET ... WHERE id = %s RETURNING *"
    pass

def db_delete_hotel(hotel_id):
    # query = "DELETE FROM hotel WHERE id = %s"
    pass


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
    # query = "INSERT INTO room (...) VALUES (...) RETURNING *"
    pass

def db_update_room(room_id, data):
    # query = "UPDATE room SET ... WHERE id = %s RETURNING *"
    pass

def db_delete_room(room_id):
    # query = "DELETE FROM room WHERE id = %s"
    pass


# --- Employees ---

def db_get_all_employees(filters=None):
    # query = "SELECT * FROM employee WHERE ..."
    pass

def db_get_employee_by_id(employee_id):
    # query = "SELECT * FROM employee WHERE id = %s"
    pass

def db_create_employee(data):
    # query = "INSERT INTO employee (...) VALUES (...) RETURNING *"
    pass

def db_update_employee(employee_id, data):
    # query = "UPDATE employee SET ... WHERE id = %s RETURNING *"
    pass

def db_delete_employee(employee_id):
    # query = "DELETE FROM employee WHERE id = %s"
    pass


# --- Customers ---

def db_get_all_customers(filters=None):
    # query = "SELECT * FROM customer WHERE ..."
    pass

def db_get_customer_by_id(customer_id):
    # query = "SELECT * FROM customer WHERE id = %s"
    pass

def db_create_customer(data):
    # query = "INSERT INTO customer (...) VALUES (...) RETURNING *"
    pass

def db_update_customer(customer_id, data):
    # query = "UPDATE customer SET ... WHERE id = %s RETURNING *"
    pass

def db_delete_customer(customer_id):
    # query = "DELETE FROM customer WHERE id = %s"
    pass


# --- Bookings ---

def db_get_all_bookings():
    # query = "SELECT * FROM booking"
    pass

def db_get_booking_by_id(booking_id):
    # query = "SELECT * FROM booking WHERE id = %s"
    pass

def db_get_bookings_by_customer(customer_id):
    # query = "SELECT * FROM booking WHERE customer_id = %s"
    pass

def db_get_bookings_by_hotel(hotel_id):
    # query = "SELECT * FROM booking b JOIN room r ON b.room_id = r.id WHERE r.hotel_id = %s"
    pass

def db_create_booking(data):
    # query = "INSERT INTO booking (...) VALUES (...) RETURNING *"
    pass

def db_cancel_booking(booking_id):
    # query = "UPDATE booking SET status = 'Cancelled' WHERE id = %s"
    pass


# --- Rentings ---

def db_get_all_rentings():
    # query = "SELECT * FROM renting"
    pass

def db_get_renting_by_id(renting_id):
    # query = "SELECT * FROM renting WHERE id = %s"
    pass

def db_get_rentings_by_customer(customer_id):
    # query = "SELECT * FROM renting WHERE customer_id = %s"
    pass

def db_get_rentings_by_hotel(hotel_id):
    # query = "SELECT * FROM renting r JOIN room rm ON r.room_id = rm.id WHERE rm.hotel_id = %s"
    pass

def db_create_renting(data):
    # query = "INSERT INTO renting (...) VALUES (...) RETURNING *"
    pass


# --- Payments ---

def db_get_payments_by_renting(renting_id):
    # query = "SELECT * FROM payment WHERE renting_id = %s"
    pass

def db_create_payment(data):
    # query = "INSERT INTO payment (...) VALUES (...) RETURNING *"
    pass


# --- Search ---

def db_search_available_rooms(criteria):
    # query = "SELECT * FROM room r JOIN hotel h ON ... WHERE ... (availability check)"
    pass

def db_check_room_availability(room_id, check_in, check_out):
    # query = "SELECT COUNT(*) FROM booking WHERE room_id = %s AND status IN ('Confirmed','Pending') AND ..."
    pass


# --- Analytics (SQL Views) ---

def db_get_available_rooms_per_area():
    # query = "SELECT * FROM available_rooms_per_area"  (uses your SQL view)
    pass

def db_get_hotel_capacity():
    # query = "SELECT * FROM hotel_capacity"  (uses your SQL view)
    pass
