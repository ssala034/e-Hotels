from fastapi import APIRouter, HTTPException
from models import BookingData, ConvertBookingRequest
from database import (
    db_create_booking,
    db_get_all_bookings,
    db_get_bookings_by_customer,
    db_get_bookings_by_hotel,
    db_get_booking_by_id,
    db_cancel_booking,
    db_convert_booking_to_renting,
)

router = APIRouter()

@router.post("")
def create_booking(data: BookingData):
    try:
        booking = db_create_booking(data.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not create booking: {exc}")

    if not booking:
        raise HTTPException(status_code=404, detail="Room not found")
    return booking


@router.get("")
def get_all_bookings():
    return db_get_all_bookings()


@router.get("/customer/{customer_id}")
def get_customer_bookings(customer_id: str):
    return db_get_bookings_by_customer(customer_id)


@router.get("/hotel/{hotel_id}")
def get_hotel_bookings(hotel_id: str):
    return db_get_bookings_by_hotel(hotel_id)


@router.get("/{booking_id}")
def get_booking_by_id(booking_id: str):
    booking = db_get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.delete("/{booking_id}")
def cancel_booking(booking_id: str):
    success = db_cancel_booking(booking_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not cancel booking")
    return {"message": "Booking cancelled"}


@router.post("/{booking_id}/convert")
def convert_booking_to_renting(booking_id: str, body: ConvertBookingRequest):
    try:
        renting = db_convert_booking_to_renting(booking_id, body.employeeId)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    if not renting:
        raise HTTPException(status_code=404, detail="Booking not found")
    return renting
