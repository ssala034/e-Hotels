# How to Start Backend

## 🛠️ 1. Environment Setup

We use a **Virtual Environment (venv)** to keep our project dependencies isolated. **Do not install packages globally.**

### A. Create the Virtual Environment
Navigate to the `backend` folder and run:
```bash
cd backend
python -m venv venv

```

### B. Activate the venv

You must do this **every time** you open a new terminal to work on the project.

* **Windows:**
```bash
.\venv\Scripts\activate

```

* **Mac/Linux:**
```bash
source venv/bin/activate

```

*(You will know it's working if you see `(venv)` appearing next to your command prompt.)*

---

## 📦 2. Install Dependencies

Once your `venv` is active, install the required libraries from our "recipe" file:

```bash
pip install -r requirements.txt

```

### ⚠️ Important: Adding New Packages

If you install a new package (e.g., `pip install requests`), you **MUST** update the requirements file before you commit your code so the rest of the team gets it too:

```bash
pip freeze > requirements.txt

```

---

## 🔑 3. Configure Secrets (.env)

The `.env` file contains sensitive info like database passwords. It is **ignored by Git**, so you must create your own local copy.

1. Find the file `backend/.env.example`.
2. Duplicate it and rename the copy to `.env`.
3. Open `.env` and update the `DATABASE_URL` with your local PostgreSQL credentials:
```text
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/HotelProject

```
---

## 🚀 4. Running the Backend

With the `venv` active and `.env` configured, start the FastAPI server from the `backend` folder:

```bash
cd backend
python main.py
```

Or equivalently:

```bash
uvicorn main:app --reload
```

The API will be available at: `http://localhost:8000`
Documentation (Swagger UI) is at: `http://localhost:8000/docs`

You can verify the backend is running by visiting `http://localhost:8000/` in your browser — you should see:

```json
{"message": "e-Hotels API is running"}
```

---

## 🌐 5. Running the Frontend

In a **separate terminal**, navigate to the frontend folder and start the Next.js dev server:

```bash
cd e-hotels-frontend
npm install        # only needed the first time or after package.json changes
npm run dev
```

The frontend will be available at: `http://localhost:3000`

---

## 🔗 6. Verifying the Frontend-Backend Connection

The frontend connects to the backend at `http://localhost:8000` by default (configured via `NEXT_PUBLIC_API_URL`).

To confirm everything is connected:

1. **Start the backend** first (`python main.py` from the `backend` folder).
2. **Start the frontend** (`npm run dev` from the `e-hotels-frontend` folder).
3. Open `http://localhost:3000` in your browser.
4. Navigate to the **Search** page — you should see the hotel chains load (Marriott, Hilton, etc.).
5. Check the **backend terminal** — you should see log lines like:
   ```
   INFO:     127.0.0.1:XXXXX - "GET /api/chains HTTP/1.1" 200 OK
   INFO:     127.0.0.1:XXXXX - "GET /api/hotels HTTP/1.1" 200 OK
   INFO:     127.0.0.1:XXXXX - "GET /api/search/rooms HTTP/1.1" 200 OK
   ```

If the frontend cannot reach the backend, you'll see errors in the browser console. Make sure:
- The backend is running on port **8000**
- No firewall is blocking `localhost:8000`
- Both terminals are open at the same time

---

## 🤝 Team Workflow Summary

1. **Pull** the latest code.
2. **Activate** your `venv` (in the `backend` folder).
3. **Run** `pip install -r requirements.txt` if someone added new tools.
4. **Start the backend**: `python main.py`
5. **Start the frontend** (separate terminal): `cd e-hotels-frontend && npm run dev`
6. **Code** your feature.
7. **Freeze** if you added a new library (`pip freeze > requirements.txt`).
8. **Push** your changes.

> **Tip:** Always keep both the backend and frontend running while developing. The frontend makes real API calls to the backend — it won't work without it.