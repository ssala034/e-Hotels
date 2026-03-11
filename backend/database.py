import psycopg2
from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD


def get_connection():
    """Get a connection to the PostgreSQL database."""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )


# ============================================================================
# BLANK QUERY STUBS
# Replace 'pass' with actual SQL queries when ready to use the database.
# Each function shows the intended query as a comment.
# ============================================================================


# --- Hotel Chains ---

def db_get_all_chains():
    # query = "SELECT * FROM hotel_chain"
    pass

def db_get_chain_by_id(chain_id):
    # query = "SELECT * FROM hotel_chain WHERE id = %s"
    pass

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
    # query = "SELECT * FROM hotel WHERE ..."
    pass

def db_get_hotel_by_id(hotel_id):
    # query = "SELECT * FROM hotel WHERE id = %s"
    pass

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
    # query = "SELECT * FROM room WHERE ..."
    pass

def db_get_room_by_id(room_id):
    # query = "SELECT * FROM room WHERE id = %s"
    pass

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
