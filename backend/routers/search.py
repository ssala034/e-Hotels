from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime
from models import SearchCriteria
import logging
from database import (
    db_search_available_rooms,
    db_check_room_availability,
    db_get_all_hotels,
    db_get_all_chains,
    db_get_avg_price_by_chain,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/rooms")
def search_rooms(criteria: SearchCriteria):
    """
    Search for available rooms using database queries.
    Applies filters from the database view and applies additional client-side filters.
    """
    # Use database to get rooms matching price criteria
    base_rooms = db_search_available_rooms({
        "minPrice": criteria.minPrice,
        "maxPrice": criteria.maxPrice,
        "checkInDate": criteria.checkInDate,
        "checkOutDate": criteria.checkOutDate,
    })
    
    all_hotels = db_get_all_hotels({})
    all_chains = db_get_all_chains()

    hotel_by_id = {h["id"]: h for h in all_hotels}
    chain_by_id = {c["id"]: c for c in all_chains}

    results = list(base_rooms)

    # Apply geographic area filter
    if criteria.area:
        results = [
            r for r in results
            if (h := hotel_by_id.get(r["hotelId"])) and h["address"]["stateProvince"] in criteria.area
        ]

    # Apply chain filter
    if criteria.chainId:
        results = [
            r for r in results
            if (h := hotel_by_id.get(r["hotelId"])) and h["chainId"] in criteria.chainId
        ]

    # Apply category filter
    if criteria.category:
        results = [
            r for r in results
            if (h := hotel_by_id.get(r["hotelId"])) and h["category"] in criteria.category
        ]

    # Apply capacity filter
    if criteria.capacity:
        results = [r for r in results if r["capacity"] in criteria.capacity]

    # Apply hotel room count filters
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

    # Apply amenities filter
    if criteria.amenities:
        results = [r for r in results if all(a in r.get("amenities", []) for a in criteria.amenities)]

    # Apply view type filter
    if criteria.viewType:
        results = [r for r in results if r["viewType"] in criteria.viewType]

    # Apply extendable filter
    if criteria.extendableOnly:
        results = [r for r in results if r.get("isExtendable")]

    # Exclude damaged rooms filter
    if criteria.excludeDamaged:
        results = [
            r for r in results
            if not r.get("problems") and not r.get("issues")
        ]

    # Enrich results with hotel and chain information
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
    available = not db_check_room_availability(roomId, checkInDate, checkOutDate)
    return {"available": available}


@router.get("/chains/{chain_id}/average-price")
def get_chain_average_prices(chain_id: str):
    """
    Get average room prices for all hotels in a given chain.
    """
    results = db_get_avg_price_by_chain(chain_id)
    if not results:
        raise HTTPException(status_code=404, detail="Chain not found or no rooms available")
    return {"chainId": chain_id, "hotels": results}
