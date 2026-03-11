from fastapi import APIRouter, HTTPException
from datetime import datetime
from models import PaymentData
import mock_data

router = APIRouter()


def _find(lst, id_val):
    return next((x for x in lst if x["id"] == id_val), None)


@router.post("")
def process_payment(data: PaymentData):
    renting = _find(mock_data.rentings, data.rentingId)
    if not renting:
        raise HTTPException(status_code=404, detail="Renting not found")

    new_payment = {
        "id": f"pay-{len(mock_data.payments) + 100}",
        "rentingId": data.rentingId,
        "amount": data.amount,
        "paymentMethod": data.paymentMethod,
        "paymentDate": datetime.utcnow().isoformat() + "Z",
        "employeeId": data.employeeId,
        "notes": data.notes,
    }
    mock_data.payments.append(new_payment)
    renting["amountPaid"] += data.amount

    if renting["amountPaid"] >= renting["totalAmount"]:
        renting["status"] = "Completed"

    return new_payment


@router.get("/renting/{renting_id}")
def get_renting_payments(renting_id: str):
    results = [p for p in mock_data.payments if p["rentingId"] == renting_id]
    enriched = []
    for p in results:
        emp = _find(mock_data.employees, p["employeeId"])
        enriched.append({**p, "employee": emp} if emp else p)
    return sorted(enriched, key=lambda p: p["paymentDate"], reverse=True)
