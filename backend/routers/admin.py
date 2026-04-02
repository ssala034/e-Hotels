from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models import ChainData, HotelData, RoomData, EmployeeData, CustomerData
import logging
from database import (
    db_get_all_chains,
    db_get_chain_by_id,
    db_create_chain,
    db_update_chain,
    db_delete_chain,
    db_get_all_hotels,
    db_get_hotel_by_id,
    db_create_hotel,
    db_update_hotel,
    db_delete_hotel,
    db_get_all_rooms,
    db_get_room_by_id,
    db_create_room,
    db_update_room,
    db_delete_room,
    db_get_all_employees,
    db_get_employee_by_id,
    db_create_employee_for_manager,
    db_update_employee,
    db_delete_employee,
    db_get_all_customers,
    db_get_customer_by_id,
    db_create_customer,
    db_update_customer,
    db_delete_customer,
    db_get_archived_reservations,
    db_get_available_rooms_per_area,
    db_get_hotel_capacity,
)

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# CHAINS
# ============================================================================

@router.get("/chains")
def get_all_chains():
    return db_get_all_chains()


@router.get("/chains/{chain_id}")
def get_chain_by_id(chain_id: str):
    chain = db_get_chain_by_id(chain_id)
    if not chain:
        raise HTTPException(status_code=404, detail="Chain not found")
    return chain


@router.post("/chains")
def create_chain(data: ChainData):
    try:
        return db_create_chain(data.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not create chain: {exc}")


@router.put("/chains/{chain_id}")
def update_chain(chain_id: str, data: ChainData):
    chain = db_update_chain(chain_id, data.model_dump())
    if not chain:
        raise HTTPException(status_code=404, detail="Chain not found")
    return chain


@router.delete("/chains/{chain_id}")
def delete_chain(chain_id: str):
    deleted = db_delete_chain(chain_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Chain not found")
    return {"message": "Chain deleted"}


# ============================================================================
# HOTELS
# ============================================================================

@router.get("/hotels")
def get_all_hotels(
    chainId: Optional[str] = Query(None),
    category: Optional[int] = Query(None),
    city: Optional[str] = Query(None),
    managerId: Optional[int] = Query(None),
):
    results = db_get_all_hotels({
        "chainId": chainId,
        "category": category,
        "city": city,
        "managerId": managerId,
    })
    return results


@router.get("/hotels/{hotel_id}")
def get_hotel(hotel_id: str):
    hotel = db_get_hotel_by_id(hotel_id)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return hotel


@router.post("/hotels")
def create_hotel(data: HotelData):
    try:
        hotel = db_create_hotel(data.model_dump())
        if not hotel:
            raise HTTPException(status_code=400, detail="Could not create hotel")
        return hotel
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not create hotel: {exc}")


@router.put("/hotels/{hotel_id}")
def update_hotel(hotel_id: str, data: HotelData):
    hotel = db_update_hotel(hotel_id, data.model_dump())
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return hotel


@router.delete("/hotels/{hotel_id}")
def delete_hotel(hotel_id: str):
    deleted = db_delete_hotel(hotel_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return {"message": "Hotel deleted"}


# ============================================================================
# ROOMS
# ============================================================================

@router.get("/rooms")
def get_all_rooms(
    hotelId: Optional[str] = Query(None),
    capacity: Optional[str] = Query(None),
    minPrice: Optional[float] = Query(None),
    maxPrice: Optional[float] = Query(None),
):
    return db_get_all_rooms({
        "hotelId": hotelId,
        "capacity": capacity,
        "minPrice": minPrice,
        "maxPrice": maxPrice,
    })


@router.get("/rooms/{room_id}")
def get_room(room_id: str):
    room = db_get_room_by_id(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    hotel = db_get_hotel_by_id(room["hotelId"])
    if hotel:
        chain = db_get_chain_by_id(hotel["chainId"])
        room["hotel"] = {**hotel, "chain": chain} if chain else hotel
    return room


@router.post("/rooms")
def create_room(data: RoomData):
    try:
        room = db_create_room(data.model_dump())
        if not room:
            raise HTTPException(status_code=400, detail="Could not create room")
        return room
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not create room: {exc}")


@router.put("/rooms/{room_id}")
def update_room(room_id: str, data: RoomData):
    room = db_update_room(room_id, data.model_dump())
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.delete("/rooms/{room_id}")
def delete_room(room_id: str):
    deleted = db_delete_room(room_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"message": "Room deleted"}


# ============================================================================
# EMPLOYEES
# ============================================================================

@router.get("/employees")
def get_all_employees(
    hotelId: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
):
    return db_get_all_employees({
        "hotelId": hotelId,
        "role": role,
    })


@router.get("/employees/{employee_id}")
def get_employee(employee_id: str):
    emp = db_get_employee_by_id(employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.post("/employees")
def create_employee(data: EmployeeData, managerPersonId: int = Query(..., ge=1)):
    logger.info("POST /api/employees hit manager_person_id=%s", managerPersonId)
    try:
        new_emp = db_create_employee_for_manager(data.model_dump(), managerPersonId)
        if not new_emp:
            logger.warning("POST /api/employees unauthorized manager_person_id=%s", managerPersonId)
            raise HTTPException(status_code=403, detail="Manager is not assigned to the provided chain ID and hotel name")
        logger.info("POST /api/employees success person_id=%s role=%s", new_emp["personId"], new_emp["role"])
        return new_emp
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("POST /api/employees failed manager_person_id=%s", managerPersonId)
        raise HTTPException(status_code=400, detail=f"Could not create employee: {exc}")


@router.put("/employees/{employee_id}")
def update_employee(
    employee_id: str,
    data: EmployeeData,
    managerPersonId: Optional[int] = Query(None, ge=1),
    replacementManagerPersonId: Optional[int] = Query(None, ge=1),
):
    try:
        emp = db_update_employee(
            employee_id,
            data.model_dump(),
            manager_person_id=managerPersonId,
            replacement_manager_person_id=replacementManagerPersonId,
        )
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
        return emp
    except HTTPException:
        raise
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/employees/{employee_id}")
def delete_employee(employee_id: str):
    deleted = db_delete_employee(employee_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted"}


# ============================================================================
# CUSTOMERS
# ============================================================================

@router.get("/customers")
def get_all_customers(
    searchTerm: Optional[str] = Query(None),
    chainId: Optional[str] = Query(None),
    hotelId: Optional[str] = Query(None),
):
    return db_get_all_customers({
        "searchTerm": searchTerm,
        "chainId": chainId,
        "hotelId": hotelId,
    })


@router.get("/customers/{customer_id}")
def get_customer(customer_id: str):
    cust = db_get_customer_by_id(customer_id)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    return cust


@router.post("/customers")
def create_customer(data: CustomerData):
    try:
        customer = db_create_customer(data.model_dump())
        if not customer:
            raise HTTPException(status_code=400, detail="Could not create customer")
        return customer
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not create customer: {exc}")


@router.put("/customers/{customer_id}")
def update_customer(customer_id: str, data: CustomerData):
    cust = db_update_customer(customer_id, data.model_dump())
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    return cust


@router.delete("/customers/{customer_id}")
def delete_customer(customer_id: str):
    deleted = db_delete_customer(customer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted"}


# ============================================================================
# ANALYTICS
# ============================================================================

@router.get("/archived-reservations")
def get_archived_reservations(
    chainId: Optional[str] = Query(None),
    hotelId: Optional[str] = Query(None),
):
    return db_get_archived_reservations(chainId, hotelId)

#views
@router.get("/analytics/rooms-per-area")
def get_available_rooms_per_area():
    """Get available rooms aggregated by geographic area from materialized view."""
    try:
        return db_get_available_rooms_per_area()
    except Exception as exc:
        logger.error(f"Error fetching rooms per area: {exc}")
        raise HTTPException(status_code=500, detail=f"Could not fetch rooms per area: {exc}")


@router.get("/analytics/hotel-capacity")
def get_hotel_capacity_view():
    """Get hotel capacity aggregated by hotel from materialized view."""
    try:
        return db_get_hotel_capacity()
    except Exception as exc:
        logger.error(f"Error fetching hotel capacity: {exc}")
        raise HTTPException(status_code=500, detail=f"Could not fetch hotel capacity: {exc}")