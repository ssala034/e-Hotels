from fastapi import APIRouter, HTTPException
from models import RentingData
from database import (
    db_create_renting,
    db_get_all_rentings,
    db_get_rentings_by_customer,
    db_get_rentings_by_hotel,
    db_get_renting_by_id,
)

router = APIRouter()

@router.post("")
def create_direct_renting(data: RentingData):
    try:
        renting = db_create_renting(data.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not create renting: {exc}")

    if not renting:
        raise HTTPException(status_code=404, detail="Room not found")
    return renting


@router.get("")
def get_all_rentings():
    return db_get_all_rentings()


@router.get("/customer/{customer_id}")
def get_customer_rentings(customer_id: str):
    return db_get_rentings_by_customer(customer_id)


@router.get("/hotel/{hotel_id}")
def get_hotel_rentings(hotel_id: str):
    return db_get_rentings_by_hotel(hotel_id)


@router.get("/{renting_id}")
def get_renting_by_id(renting_id: str):
    renting = db_get_renting_by_id(renting_id)
    if not renting:
        raise HTTPException(status_code=404, detail="Renting not found")
    return renting
