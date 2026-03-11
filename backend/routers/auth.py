from fastapi import APIRouter, HTTPException
from models import RegisterData, LoginRequest
import mock_data

router = APIRouter()


@router.post("/register")
def register(data: RegisterData):
    # Check if email already exists
    if any(c["email"] == data.email for c in mock_data.customers):
        raise HTTPException(status_code=400, detail="Email already registered")

    new_customer = {
        "id": f"cust-{len(mock_data.customers) + 100}",
        "firstName": data.firstName,
        "lastName": data.lastName,
        "email": data.email,
        "phone": data.phone,
        "address": {
            "street": data.street,
            "city": data.city,
            "stateProvince": data.stateProvince,
            "zipCode": data.zipCode,
            "country": data.country,
        },
        "idType": data.idType,
        "idNumber": data.idNumber,
        "registrationDate": "2026-03-11",
    }
    mock_data.customers.append(new_customer)

    return {
        "id": new_customer["id"],
        "email": new_customer["email"],
        "role": "Customer",
        "firstName": new_customer["firstName"],
        "lastName": new_customer["lastName"],
        "customerId": new_customer["id"],
    }


@router.post("/login")
def login(data: LoginRequest):
    # Admin account
    if data.email == "admin@ehotels.com" and data.password == "admin123":
        return {
            "user": {
                "id": "admin-1",
                "email": "admin@ehotels.com",
                "role": "Admin",
                "firstName": "Admin",
                "lastName": "User",
            },
            "token": "mock-jwt-token-admin",
        }

    # Check employees
    employee = next((e for e in mock_data.employees if e["email"] == data.email), None)
    if employee:
        return {
            "user": {
                "id": employee["id"],
                "email": employee["email"],
                "role": "Employee",
                "firstName": employee["firstName"],
                "lastName": employee["lastName"],
                "employeeId": employee["id"],
            },
            "token": f"mock-jwt-token-{employee['id']}",
        }

    # Check customers
    customer = next((c for c in mock_data.customers if c["email"] == data.email), None)
    if customer:
        return {
            "user": {
                "id": customer["id"],
                "email": customer["email"],
                "role": "Customer",
                "firstName": customer["firstName"],
                "lastName": customer["lastName"],
                "customerId": customer["id"],
            },
            "token": f"mock-jwt-token-{customer['id']}",
        }

    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/logout")
def logout():
    return {"message": "Logged out"}
