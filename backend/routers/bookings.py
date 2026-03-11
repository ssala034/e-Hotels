from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
import math
from models import BookingData, ConvertBookingRequest
import mock_data

router = APIRouter()


def _find(lst, id_val):
    return next((x for x in lst if x["id"] == id_val), None)


def _has_date_conflict(room_id, check_in, check_out):
    s_in = datetime.fromisoformat(check_in)
    s_out = datetime.fromisoformat(check_out)
    for b in mock_data.bookings:
        if b["roomId"] != room_id or b["status"] not in ("Confirmed", "Pending"):
            continue
        if s_in < datetime.fromisoformat(b["checkOutDate"]) and s_out > datetime.fromisoformat(b["checkInDate"]):
            return True
    for r in mock_data.rentings:
        if r["roomId"] != room_id or r["status"] != "Active":
            continue
        if s_in < datetime.fromisoformat(r["checkOutDate"]) and s_out > datetime.fromisoformat(r["checkInDate"]):
            return True
    return False


def _enrich_booking(booking):
    """Attach room, hotel, and customer data to a booking dict."""
    result = dict(booking)
    room = _find(mock_data.rooms, booking["roomId"])
    customer = _find(mock_data.customers, booking["customerId"])
    if room:
        hotel = _find(mock_data.hotels, room["hotelId"])
        result["room"] = {**room, "hotel": hotel} if hotel else room
    if customer:
        result["customer"] = customer
    return result


@router.post("")
def create_booking(data: BookingData):
    room = _find(mock_data.rooms, data.roomId)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if _has_date_conflict(data.roomId, data.checkInDate, data.checkOutDate):
        raise HTTPException(status_code=409, detail="Room not available for selected dates")

    nights = math.ceil(
        (datetime.fromisoformat(data.checkOutDate) - datetime.fromisoformat(data.checkInDate)).total_seconds()
        / 86400
    )

    new_booking = {
        "id": f"book-{len(mock_data.bookings) + 100}",
        "customerId": data.customerId,
        "roomId": data.roomId,
        "checkInDate": data.checkInDate,
        "checkOutDate": data.checkOutDate,
        "status": "Confirmed",
        "bookingDate": datetime.utcnow().isoformat() + "Z",
        "specialRequests": data.specialRequests,
        "totalPrice": room["price"] * nights,
    }
    mock_data.bookings.append(new_booking)
    return new_booking


@router.get("")
def get_all_bookings():
    return sorted(
        [_enrich_booking(b) for b in mock_data.bookings],
        key=lambda b: b["bookingDate"],
        reverse=True,
    )


@router.get("/customer/{customer_id}")
def get_customer_bookings(customer_id: str):
    results = [_enrich_booking(b) for b in mock_data.bookings if b["customerId"] == customer_id]
    return sorted(results, key=lambda b: b["bookingDate"], reverse=True)


@router.get("/hotel/{hotel_id}")
def get_hotel_bookings(hotel_id: str):
    hotel_room_ids = {r["id"] for r in mock_data.rooms if r["hotelId"] == hotel_id}
    results = [_enrich_booking(b) for b in mock_data.bookings if b["roomId"] in hotel_room_ids]
    return sorted(results, key=lambda b: b["checkInDate"])


@router.get("/{booking_id}")
def get_booking_by_id(booking_id: str):
    booking = _find(mock_data.bookings, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return _enrich_booking(booking)


@router.delete("/{booking_id}")
def cancel_booking(booking_id: str):
    booking = _find(mock_data.bookings, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] in ("Converted", "Completed"):
        raise HTTPException(status_code=400, detail="Cannot cancel completed or converted booking")
    booking["status"] = "Cancelled"
    return {"message": "Booking cancelled"}


@router.post("/{booking_id}/convert")
def convert_booking_to_renting(booking_id: str, body: ConvertBookingRequest):
    booking = _find(mock_data.bookings, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] != "Confirmed":
        raise HTTPException(status_code=400, detail="Only confirmed bookings can be converted")

    new_renting = {
        "id": f"rent-{len(mock_data.rentings) + 100}",
        "customerId": booking["customerId"],
        "roomId": booking["roomId"],
        "checkInDate": booking["checkInDate"],
        "checkOutDate": booking["checkOutDate"],
        "status": "Active",
        "employeeId": body.employeeId,
        "bookingId": booking["id"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "totalAmount": booking["totalPrice"],
        "amountPaid": 0,
    }
    mock_data.rentings.append(new_renting)
    booking["status"] = "Converted"
    return new_renting
