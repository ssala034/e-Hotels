from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
from models import ChainData, HotelData, RoomData, EmployeeData, CustomerData
import logging
import mock_data
from database import (
    db_get_all_chains,
    db_get_chain_by_id,
    db_get_all_hotels,
    db_get_hotel_by_id,
    db_get_all_rooms,
    db_get_room_by_id,
    db_get_all_employees,
    db_get_employee_by_id,
    db_create_employee_for_manager,
    db_get_all_customers,
    db_get_customer_by_id,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _find(lst, id_val):
    return next((x for x in lst if x["id"] == id_val), None)


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
    new_chain = {
        "id": f"chain-{len(mock_data.chains) + 100}",
        "name": data.name,
        "centralOfficeAddress": data.centralOfficeAddress.model_dump(),
        "totalHotels": 0,
        "contactEmails": data.contactEmails,
        "phoneNumbers": data.phoneNumbers,
    }
    mock_data.chains.append(new_chain)
    return new_chain


@router.put("/chains/{chain_id}")
def update_chain(chain_id: str, data: ChainData):
    chain = _find(mock_data.chains, chain_id)
    if not chain:
        raise HTTPException(status_code=404, detail="Chain not found")
    chain["name"] = data.name
    chain["centralOfficeAddress"] = data.centralOfficeAddress.model_dump()
    chain["contactEmails"] = data.contactEmails
    chain["phoneNumbers"] = data.phoneNumbers
    return chain


@router.delete("/chains/{chain_id}")
def delete_chain(chain_id: str):
    if any(h["chainId"] == chain_id for h in mock_data.hotels):
        raise HTTPException(status_code=400, detail="Cannot delete chain with existing hotels")
    mock_data.chains[:] = [c for c in mock_data.chains if c["id"] != chain_id]
    return {"message": "Chain deleted"}


# ============================================================================
# HOTELS
# ============================================================================

def _enrich_hotel(hotel):
    result = dict(hotel)
    chain = _find(mock_data.chains, hotel["chainId"])
    manager = _find(mock_data.employees, hotel["managerId"])
    if chain:
        result["chain"] = chain
    if manager:
        result["manager"] = manager
    return result


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
    new_hotel = {
        "id": f"hotel-{len(mock_data.hotels) + 100}",
        "name": data.name,
        "chainId": data.chainId,
        "category": data.category,
        "address": data.address.model_dump(),
        "contactEmail": data.contactEmail,
        "contactPhone": data.contactPhone,
        "numberOfRooms": 0,
        "managerId": data.managerId,
    }
    mock_data.hotels.append(new_hotel)
    chain = _find(mock_data.chains, data.chainId)
    if chain:
        chain["totalHotels"] += 1
    return new_hotel


@router.put("/hotels/{hotel_id}")
def update_hotel(hotel_id: str, data: HotelData):
    hotel = _find(mock_data.hotels, hotel_id)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    hotel.update({
        "name": data.name,
        "chainId": data.chainId,
        "category": data.category,
        "address": data.address.model_dump(),
        "contactEmail": data.contactEmail,
        "contactPhone": data.contactPhone,
        "managerId": data.managerId,
    })
    return hotel


@router.delete("/hotels/{hotel_id}")
def delete_hotel(hotel_id: str):
    if any(r["hotelId"] == hotel_id for r in mock_data.rooms):
        raise HTTPException(status_code=400, detail="Cannot delete hotel with existing rooms")
    hotel = _find(mock_data.hotels, hotel_id)
    if hotel:
        chain = _find(mock_data.chains, hotel["chainId"])
        if chain:
            chain["totalHotels"] -= 1
    mock_data.hotels[:] = [h for h in mock_data.hotels if h["id"] != hotel_id]
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
    new_room = {
        "id": f"room-{len(mock_data.rooms) + 1000}",
        "hotelId": data.hotelId,
        "roomNumber": data.roomNumber,
        "roomType": data.roomType,
        "price": data.price,
        "amenities": data.amenities,
        "capacity": data.capacity,
        "viewType": data.viewType,
        "isExtendable": data.isExtendable,
        "problems": data.problems,
        "images": [],
    }
    mock_data.rooms.append(new_room)
    hotel = _find(mock_data.hotels, data.hotelId)
    if hotel:
        hotel["numberOfRooms"] += 1
    return new_room


@router.put("/rooms/{room_id}")
def update_room(room_id: str, data: RoomData):
    room = _find(mock_data.rooms, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    room.update({
        "hotelId": data.hotelId,
        "roomNumber": data.roomNumber,
        "roomType": data.roomType,
        "price": data.price,
        "amenities": data.amenities,
        "capacity": data.capacity,
        "viewType": data.viewType,
        "isExtendable": data.isExtendable,
        "problems": data.problems,
    })
    return room


@router.delete("/rooms/{room_id}")
def delete_room(room_id: str):
    active_bookings = [b for b in mock_data.bookings if b["roomId"] == room_id and b["status"] in ("Confirmed", "Pending")]
    active_rentings = [r for r in mock_data.rentings if r["roomId"] == room_id and r["status"] == "Active"]
    if active_bookings or active_rentings:
        raise HTTPException(status_code=400, detail="Cannot delete room with active bookings or rentings")
    room = _find(mock_data.rooms, room_id)
    if room:
        hotel = _find(mock_data.hotels, room["hotelId"])
        if hotel:
            hotel["numberOfRooms"] -= 1
    mock_data.rooms[:] = [r for r in mock_data.rooms if r["id"] != room_id]
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
            raise HTTPException(status_code=403, detail="Only a logged-in manager can create employees")
        logger.info("POST /api/employees success person_id=%s role=%s", new_emp["personId"], new_emp["role"])
        return new_emp
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("POST /api/employees failed manager_person_id=%s", managerPersonId)
        raise HTTPException(status_code=400, detail=f"Could not create employee: {exc}")


@router.put("/employees/{employee_id}")
def update_employee(employee_id: str, data: EmployeeData):
    emp = _find(mock_data.employees, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    if any(e["email"] == data.email and e["id"] != employee_id for e in mock_data.employees):
        raise HTTPException(status_code=400, detail="Email already exists")
    hotel = _find(mock_data.hotels, data.hotelId)
    emp.update({
        "firstName": data.firstName,
        "lastName": data.lastName,
        "email": data.email,
        "password": data.password,
        "address": data.address.model_dump(),
        "ssnSin": data.ssnSin,
        "role": data.role,
        "hotelId": data.hotelId,
        "chainId": data.chainId or (hotel["chainId"] if hotel else None),
    })
    return emp


@router.delete("/employees/{employee_id}")
def delete_employee(employee_id: str):
    emp = _find(mock_data.employees, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    if emp["role"] == "Manager":
        same_hotel_managers = [e for e in mock_data.employees if e["hotelId"] == emp["hotelId"] and e["role"] == "Manager"]
        if len(same_hotel_managers) == 1:
            raise HTTPException(status_code=400, detail="Cannot delete the only manager of a hotel")
    mock_data.employees[:] = [e for e in mock_data.employees if e["id"] != employee_id]
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
    if any(c["email"] == data.email for c in mock_data.customers):
        raise HTTPException(status_code=400, detail="Email already exists")
    new_cust = {
        "id": f"cust-{len(mock_data.customers) + 100}",
        "firstName": data.firstName,
        "lastName": data.lastName,
        "email": data.email,
        "phone": data.phone,
        "address": data.address.model_dump(),
        "idType": data.idType,
        "idNumber": data.idNumber,
        "registrationDate": datetime.utcnow().strftime("%Y-%m-%d"),
    }
    mock_data.customers.append(new_cust)
    return new_cust


@router.put("/customers/{customer_id}")
def update_customer(customer_id: str, data: CustomerData):
    cust = _find(mock_data.customers, customer_id)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    if any(c["email"] == data.email and c["id"] != customer_id for c in mock_data.customers):
        raise HTTPException(status_code=400, detail="Email already exists")
    cust.update({
        "firstName": data.firstName,
        "lastName": data.lastName,
        "email": data.email,
        "phone": data.phone,
        "address": data.address.model_dump(),
        "idType": data.idType,
        "idNumber": data.idNumber,
    })
    return cust


@router.delete("/customers/{customer_id}")
def delete_customer(customer_id: str):
    active_bookings = [b for b in mock_data.bookings if b["customerId"] == customer_id and b["status"] in ("Confirmed", "Pending")]
    active_rentings = [r for r in mock_data.rentings if r["customerId"] == customer_id and r["status"] == "Active"]
    if active_bookings or active_rentings:
        raise HTTPException(status_code=400, detail="Cannot delete customer with active bookings or rentings")
    mock_data.customers[:] = [c for c in mock_data.customers if c["id"] != customer_id]
    return {"message": "Customer deleted"}


# ============================================================================
# ANALYTICS
# ============================================================================

@router.get("/analytics/rooms-per-area")
def get_available_rooms_per_area():
    area_data = {}
    for hotel in mock_data.hotels:
        city = hotel["address"]["city"]
        if city not in area_data:
            area_data[city] = {"total": 0, "available": 0}

    today = datetime.utcnow()
    for room in mock_data.rooms:
        hotel = _find(mock_data.hotels, room["hotelId"])
        if not hotel:
            continue
        area = hotel["address"]["city"]
        area_data[area]["total"] += 1

        has_active = any(
            room["id"] == res["roomId"]
            and datetime.fromisoformat(res["checkInDate"]) <= today <= datetime.fromisoformat(res["checkOutDate"])
            for res in [*mock_data.bookings, *mock_data.rentings]
        )
        if not has_active:
            area_data[area]["available"] += 1

    return [
        {
            "area": area,
            "totalRooms": d["total"],
            "availableRooms": d["available"],
            "occupancyRate": ((d["total"] - d["available"]) / d["total"] * 100) if d["total"] > 0 else 0,
        }
        for area, d in area_data.items()
    ]


@router.get("/analytics/hotel-capacity")
def get_hotel_capacity_view():
    capacity_map = {"Single": 1, "Double": 2, "Triple": 3, "Suite": 2, "Family": 4, "Studio": 2}
    result = []
    for hotel in mock_data.hotels:
        hotel_rooms = [r for r in mock_data.rooms if r["hotelId"] == hotel["id"]]
        chain = _find(mock_data.chains, hotel["chainId"])
        total_cap = sum(capacity_map.get(r["capacity"], 2) for r in hotel_rooms)
        result.append({
            "hotelId": hotel["id"],
            "hotelName": hotel["name"],
            "chainName": chain["name"] if chain else "Unknown",
            "totalRooms": len(hotel_rooms),
            "totalCapacity": total_cap,
            "averageCapacityPerRoom": total_cap / len(hotel_rooms) if hotel_rooms else 0,
        })
    return result
