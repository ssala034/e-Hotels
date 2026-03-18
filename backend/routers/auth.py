from fastapi import APIRouter, HTTPException
from models import RegisterData, LoginRequest
import logging
from database import db_create_customer_account, db_get_user_by_credentials

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/register")
def register(data: RegisterData):
    logger.info("POST /api/auth/register hit")
    try:
        new_customer = db_create_customer_account(data.model_dump())
        logger.info("POST /api/auth/register success email=%s person_id=%s", data.email, new_customer["personId"])
        return new_customer
    except Exception as exc:
        logger.exception("POST /api/auth/register failed email=%s", data.email)
        raise HTTPException(status_code=400, detail=f"Could not create customer account: {exc}")


@router.post("/login")
def login(data: LoginRequest):
    logger.info("POST /api/auth/login hit email=%s", data.email)
    user = db_get_user_by_credentials(data.email, data.password)
    if not user:
        logger.warning("POST /api/auth/login failed email=%s", data.email)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    logger.info("POST /api/auth/login success email=%s role=%s", data.email, user["role"])
    return {
        "user": user,
        "token": f"mock-jwt-token-{user['id']}",
    }


@router.post("/logout")
def logout():
    return {"message": "Logged out"}
