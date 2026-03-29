from fastapi import APIRouter, HTTPException
from models import PaymentData
from database import db_create_payment, db_get_payments_by_renting

router = APIRouter()

@router.post("")
def process_payment(data: PaymentData):
    payment = db_create_payment(data.model_dump())
    if not payment:
        raise HTTPException(status_code=404, detail="Renting not found")
    return payment


@router.get("/renting/{renting_id}")
def get_renting_payments(renting_id: str):
    return db_get_payments_by_renting(renting_id)
