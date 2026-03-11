from fastapi import APIRouter, HTTPException
from datetime import datetime
import math
from models import RentingData
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


def _enrich_renting(renting):
    result = dict(renting)
    room = _find(mock_data.rooms, renting["roomId"])
    customer = _find(mock_data.customers, renting["customerId"])
    employee = _find(mock_data.employees, renting["employeeId"])
    if room:
        hotel = _find(mock_data.hotels, room["hotelId"])
        result["room"] = {**room, "hotel": hotel} if hotel else room
    if customer:
        result["customer"] = customer
    if employee:
        result["employee"] = employee
    return result


@router.post("")
def create_direct_renting(data: RentingData):
    room = _find(mock_data.rooms, data.roomId)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if _has_date_conflict(data.roomId, data.checkInDate, data.checkOutDate):
        raise HTTPException(status_code=409, detail="Room not available for selected dates")

    nights = math.ceil(
        (datetime.fromisoformat(data.checkOutDate) - datetime.fromisoformat(data.checkInDate)).total_seconds()
        / 86400
    )

    new_renting = {
        "id": f"rent-{len(mock_data.rentings) + 100}",
        "customerId": data.customerId,
        "roomId": data.roomId,
        "checkInDate": data.checkInDate,
        "checkOutDate": data.checkOutDate,
        "status": "Active",
        "employeeId": data.employeeId,
        "bookingId": data.bookingId,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "totalAmount": room["price"] * nights,
        "amountPaid": 0,
    }
    mock_data.rentings.append(new_renting)
    return new_renting


@router.get("")
def get_all_rentings():
    return sorted(
        [_enrich_renting(r) for r in mock_data.rentings],
        key=lambda r: r["createdAt"],
        reverse=True,
    )


@router.get("/customer/{customer_id}")
def get_customer_rentings(customer_id: str):
    results = [_enrich_renting(r) for r in mock_data.rentings if r["customerId"] == customer_id]
    return sorted(results, key=lambda r: r["createdAt"], reverse=True)


@router.get("/hotel/{hotel_id}")
def get_hotel_rentings(hotel_id: str):
    hotel_room_ids = {r["id"] for r in mock_data.rooms if r["hotelId"] == hotel_id}
    results = [_enrich_renting(r) for r in mock_data.rentings if r["roomId"] in hotel_room_ids]
    return sorted(results, key=lambda r: r["createdAt"], reverse=True)


@router.get("/{renting_id}")
def get_renting_by_id(renting_id: str):
    renting = _find(mock_data.rentings, renting_id)
    if not renting:
        raise HTTPException(status_code=404, detail="Renting not found")
    return _enrich_renting(renting)
