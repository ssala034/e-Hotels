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

## 🚀 4. Running the App

With the `venv` active and `.env` configured, start the FastAPI server:

```bash
uvicorn main:app --reload

```

The API will be available at: `http://127.0.0.1:8000`
Documentation (Swagger UI) is at: `http://127.0.0.1:8000/docs`

---

## 🤝 Team Workflow Summary

1. **Pull** the latest code.
2. **Activate** your `venv`.
3. **Run** `pip install -r requirements.txt` if someone added new tools.
4. **Code** your feature.
5. **Freeze** if you added a new library (`pip freeze > requirements.txt`).
6. **Push** your changes.

```



### One last tip for you:
Since you mentioned they could "just use global dependencies"—**try to discourage that!** If a teammate uses global dependencies, they might accidentally forget to add a package to the `requirements.txt`. Then, when you pull their code, your app will crash because you're missing a library they had "globally" on their laptop. Stick to the `venv` rule; it saves a lot of headaches!

```