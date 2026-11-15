# Prompt 13

## User Input
```text
fix the permit and acess page and change its layout make it look like previous layout and only show the permit things not the earth model
```

---

## Architectural Objectives
1. **Remove 3D Earth Globe Model Completely from Module 4**:
   - Strip out `PlanetaryGlobe3D`, WebGL 3D canvas, orbit controls, floating globe overlays, and floating Cesium-style HUDs.
   - The user requested: *"only show the permit things not the earth model"*.
2. **Restore and Refine the Previous Clean Layout in `AdminPermitsView.tsx`**:
   - Header with `Module 4 · Access & Permits` badge, site name, country flag, coordinates, and navigation controls.
   - 3 Streamlined Metric Cards: Statutory Readiness Badge (FEASIBLE / CONDITIONAL / RESTRICTED), Estimated Lead Time (~14 Weeks), and Governing Authority with official portal link.
   - US Statutory Compliance Card: China Wolf Amendment (P.L. 112-55 Sec. 539) with verified badge and legal explanation.
   - Verified Statutory Permits Checklist & Regulatory Authorities: Detailed list of required permits with authority, fees, lead times, and official links.
   - 6 Core Activity Permission Badges: Land Entry, Rover Driving, Drilling & Sampling, Drones & UAS, RF Spectrum, and Customs & Logistics.
   - AI Permit Preparation Assistant: Prefilled official filing draft with docket number, applicant, campaign dates, test articles, and 1-click copy to clipboard.
   - Clear Next Step CTA: Direct navigation to Module 5 (`Exposure Lab`).
3. **Verification**:
   - Run `npm run lint` and `npm run build` to confirm 0 TypeScript and build errors.


---

## Execution Deliverables & Layout Upgrades

### AdminPermitsView (`src/components/views/AdminPermitsView.tsx`)
1. **Completely Removed 3D Earth Globe (`PlanetaryGlobe3D`)**:
   - Stripped away WebGL sphere, raycasting coordinates click handlers, floating HUD overlay layers, and rotation controls.
   - Bundle size decreased by over **430 kB** (from 2,095 kB to 1,665 kB).
2. **Restored and Perfected Previous Card-Based Layout**:
   - **Top Header & Site Switcher**:
     - `Module 4 · Access & Permits` pill.
     - Interactive candidate site selector dropdown so users can switch between candidate sites and view their permits directly.
     - Title: `Site Access & Statutory Feasibility`.
     - Subtitle explaining statutory compliance and legal feasibility.
     - Navigation controls (`← Back to Site Dossier` and `Equipment Lab (Module 5) →`).
   - **3 Top Metric Cards**:
     - Statutory Readiness Badge (`FEASIBLE` / `CONDITIONAL` / `RESTRICTED`) with jurisdiction.
     - Estimated Lead Time (`~{admin.leadTimeWeeks} Weeks`) in `#A33E11` and recommended filing window.
     - Governing Authority (`{admin.authority}`) with direct external link to official regulatory portal.
   - **China Wolf Amendment Card (P.L. 112-55, Sec. 539)**:
     - Scale icon, verified/restricted status pill, and 2-sentence legal compliance note.
     - Indigenous consultation callout when applicable.
   - **Required Statutory Permits & Environmental Clearances Checklist**:
     - Dedicated cards for all items in `admin.permitsRequired` showing issuing authority, mandatory filing tag, and official agency portal link.
   - **6 Core Activity Permission Badges**:
     - Land Entry, Rover Driving, Drilling, Drones, RF Spectrum, and Customs.
   - **AI Permit Preparation Assistant & Monospace Prefilled Draft**:
     - Prefilled filing draft with official docket number, testbed parameters, requested scopes, and certification notice.
     - 1-click `Copy Draft Application` button with copied state feedback.
   - **Bottom Navigation CTA**:
     - Module 4 completion summary and `Proceed to Equipment Exposure Lab (Module 5) →` button.

---

## Verification
- `npm run lint` (`tsc --noEmit`): **0 errors**
- `npm run build` (`vite build`): **0 errors, built in 2.01s**
- `backend/venv/bin/python backend/manage.py test api`: **30/30 tests passed in 0.073s**
