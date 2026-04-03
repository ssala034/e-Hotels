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
3. Open `.env` and fill in your local PostgreSQL credentials:
```text
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_pgadmin_password
DB_SCHEMA=HotelProject
```
---
## 🐘 4. Start PostgreSQL (Before Running the Backend)

The backend cannot connect to the database unless PostgreSQL is running on your machine first.

### A. Check if PostgreSQL is already running
```bash
pg_isready -h localhost -p 5432
```

- If you see `accepting connections` → PostgreSQL is running, skip to step 5.
- If you see `no response` or `refusing connection` → start it using the steps below.

### B. Start PostgreSQL

**Windows** (run PowerShell as Administrator):
```bash
net start postgresql-x64-18
```
> ⚠️ The service name may differ slightly depending on your version. To find the exact name, open **Task Manager → Services** and search for `postgresql`.

**Mac:**
```bash
brew services start postgresql
```

**Linux:**
```bash
sudo systemctl start postgresql
```

### C. Alternatively — just open pgAdmin

Opening pgAdmin and clicking on your server in the left panel will start PostgreSQL automatically. This is the easiest option on Windows.

---

## 🚀 5. Running the Backend

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

## 🌐 6. Running the Frontend

In a **separate terminal**, navigate to the frontend folder and start the Next.js dev server:

```bash
cd e-hotels-frontend
npm install        # only needed the first time or after package.json changes
npm run dev
```

The frontend will be available at: `http://localhost:3000`

---

## 🔗 7. Verifying Connections

### A. Verify the backend is connected to the database

Visit `http://localhost:8000/health` in your browser — you should see:
```json
{"status": "Connected to PostgreSQL successfully"}
```

### B. Verify the backend is connected to the frontend

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
- Both terminals are open at the same time
