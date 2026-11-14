# ECHO / TERRA-X — AnalogWindow Planetary Studio

> **Objective-first planetary analog discovery, seasonal analog windowing, 2.5D rover traverse lab, and 3D CAD hardware degradation simulator grounded in NASA LRO, MGS/Odyssey, Earthdata, and ESA Copernicus datasets.**

---

## Architecture Overview

ECHO is a full-stack platform consisting of:
- **Frontend**: React 19, TypeScript, Three.js / React Three Fiber, Vite, and Tailwind CSS.
- **Backend**: Django REST Framework API with Scikit-Learn ML models for material degradation simulation and planetary-terrestrial analog matching.

---

## Prerequisites

Before starting, ensure you have the following installed:
- **Python**: 3.10+ (tested on Python 3.13)
- **Node.js** (v18+) OR **Bun** (recommended for faster package installation)

---

## How to Run the Project

To run ECHO fully, you need **both** the backend and frontend running concurrently in separate terminal windows.

---

### Step 1: Run the Backend (Django REST API)

The backend provides the API for analog matching (`/api/find-analog/`) and ML corrosion degradation simulation (`/api/simulate-wear/`).

1. **Open a terminal** and navigate to the project root directory:
   ```powershell
   cd "d:\Marshal\Education\Projects\NASA_Synthetic Aperture Radar (SAR)\ECHO"
   ```

2. **Install Python dependencies**:
   ```powershell
   python -m pip install -r backend/requirements.txt
   ```
   *(Core requirements: `django`, `djangorestframework`, `django-cors-headers`, `scikit-learn`, `pandas`, `numpy`)*

3. **Apply database migrations**:
   ```powershell
   python backend/manage.py migrate
   ```

4. **Start the Django development server**:
   ```powershell
   python backend/manage.py runserver 127.0.0.1:8000
   ```
   *(Tip: On Windows, you can pass `--noreload` for optimal stability: `python backend/manage.py runserver 127.0.0.1:8000 --noreload`)*

   The backend will be live at: **`http://127.0.0.1:8000/`**

---

### Step 2: Run the Frontend (React + Vite)

In a **second terminal window**, start the frontend using either **Bun** or **npm**:

#### Option A: Using Bun (Recommended / Fastest)
```powershell
# 1. Install dependencies
bun install

# 2. Start the Vite development server
bun run dev
```

#### Option B: Using npm
```powershell
# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev
```

The frontend will start and will be accessible at:
👉 **`http://localhost:3000/`** (or `http://localhost:5173/` depending on your local port)

---

## API Endpoints Reference

The frontend automatically communicates with the Django backend at `http://127.0.0.1:8000`:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/find-analog/` | `GET` | Finds Earth analog locations closest to the Artemis IV lunar target vector (`[-203.0°C, 14.8° slope]`) using vector cosine matching. |
| `/api/simulate-wear/` | `POST` | Predicts sulfur-corrosion material degradation (`mg/cm²`) via Random Forest regression given `sulfur_ppm` and `exposure_days`. |

---

## Environment Variables (Optional)

You can customize environment variables by creating a `.env` or `.env.local` file:

- `GEMINI_API_KEY`: *(Optional)* Gemini AI API key for AI Studio integrations.
- `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: *(Optional)* Remote Supabase credentials. If not provided, the backend automatically falls back to the built-in local dataset (`backend/earth_analogs.csv`) with zero configuration required.
