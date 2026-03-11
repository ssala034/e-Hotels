from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import FRONTEND_URL, BACKEND_PORT
from routers import auth, search, bookings, rentings, payments, admin

app = FastAPI(title="e-Hotels API")

# Allow the Next.js frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router,     prefix="/api/auth",     tags=["Auth"])
app.include_router(search.router,   prefix="/api/search",   tags=["Search"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(rentings.router, prefix="/api/rentings", tags=["Rentings"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(admin.router,    prefix="/api",          tags=["Admin"])


@app.get("/")
def root():
    return {"message": "e-Hotels API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=BACKEND_PORT, reload=True)
