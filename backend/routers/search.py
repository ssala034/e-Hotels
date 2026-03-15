from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime
from models import SearchCriteria
import mock_data
from database import db_get_all_rooms, db_get_all_hotels, db_get_all_chains

router = APIRouter()


def _has_date_conflict(room_id: str, check_in: str, check_out: str) -> bool:
    """Check if a room has a booking/renting conflict for the given dates."""
    search_in = datetime.fromisoformat(check_in)
    search_out = datetime.fromisoformat(check_out)

    for b in mock_data.bookings:
        if b["roomId"] != room_id:
            continue
        if b["status"] not in ("Confirmed", "Pending"):
            continue
        res_in = datetime.fromisoformat(b["checkInDate"])
        res_out = datetime.fromisoformat(b["checkOutDate"])
        if search_in < res_out and search_out > res_in:
            return True

    for r in mock_data.rentings:
        if r["roomId"] != room_id:
            continue
        if r["status"] != "Active":
            continue
        res_in = datetime.fromisoformat(r["checkInDate"])
        res_out = datetime.fromisoformat(r["checkOutDate"])
        if search_in < res_out and search_out > res_in:
            return True

    return False


def _find_hotel(hotel_id: str):
    return next((h for h in mock_data.hotels if h["id"] == hotel_id), None)


def _find_chain(chain_id: str):
    return next((c for c in mock_data.chains if c["id"] == chain_id), None)


@router.post("/rooms")
def search_rooms(criteria: SearchCriteria):
    base_rooms = db_get_all_rooms({
        "minPrice": criteria.minPrice,
        "maxPrice": criteria.maxPrice,
    })
    all_hotels = db_get_all_hotels({})
    all_chains = db_get_all_chains()

    hotel_by_id = {h["id"]: h for h in all_hotels}
    chain_by_id = {c["id"]: c for c in all_chains}

    results = list(base_rooms)

    # Filter by date availability (mock booking data currently uses mock room IDs).
    if criteria.checkInDate and criteria.checkOutDate:
        results = [
            r for r in results if not _has_date_conflict(r["id"], criteria.checkInDate, criteria.checkOutDate)
        ]

    if criteria.area:
        results = [
            r for r in results
            if (h := hotel_by_id.get(r["hotelId"])) and h["address"]["city"] in criteria.area
        ]

    if criteria.chainId:
        results = [
            r for r in results
            if (h := hotel_by_id.get(r["hotelId"])) and h["chainId"] in criteria.chainId
        ]

    if criteria.category:
        results = [
            r for r in results
            if (h := hotel_by_id.get(r["hotelId"])) and h["category"] in criteria.category
        ]

    if criteria.capacity:
        results = [r for r in results if r["capacity"] in criteria.capacity]

    if criteria.minHotelRooms is not None or criteria.maxHotelRooms is not None:
        def _room_count_ok(room):
            hotel = hotel_by_id.get(room["hotelId"])
            if not hotel:
                return False
            if criteria.minHotelRooms is not None and hotel["numberOfRooms"] < criteria.minHotelRooms:
                return False
            if criteria.maxHotelRooms is not None and hotel["numberOfRooms"] > criteria.maxHotelRooms:
                return False
            return True

        results = [r for r in results if _room_count_ok(r)]

    if criteria.amenities:
        results = [r for r in results if all(a in r.get("amenities", []) for a in criteria.amenities)]

    if criteria.viewType:
        results = [r for r in results if r["viewType"] in criteria.viewType]

    if criteria.extendableOnly:
        results = [r for r in results if r.get("isExtendable")]

    if criteria.excludeDamaged:
        results = [
            r for r in results
            if not r.get("problems") and not r.get("issues")
        ]

    enriched = []
    for room in results:
        hotel = hotel_by_id.get(room["hotelId"])
        if hotel:
            chain = chain_by_id.get(hotel["chainId"])
            hotel_with_chain = {**hotel, "chain": chain} if chain else hotel
            enriched.append({**room, "hotel": hotel_with_chain})
        else:
            enriched.append(room)

    return enriched


@router.get("/availability")
def check_availability(
    roomId: str = Query(...),
    checkInDate: str = Query(...),
    checkOutDate: str = Query(...),
):
    available = not _has_date_conflict(roomId, checkInDate, checkOutDate)
    return {"available": available}
