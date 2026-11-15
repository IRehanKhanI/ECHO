# Prompt 17

## User Input
```text
as u can see the image the some things are repeated on the left side fix it and on the right earth when i rotate it too much this points are coming fix it
```
*(User attached screenshot `uploaded_media_1794768911563.jpg` showing: (1) Duplicate "Mount Fleming Sandstone Nunatak" cards on the left candidate list, and (2) Swarm of green circular dots on the 3D Earth Globe with stray points projecting into space when rotated).*

---

## Architectural Root Causes & Solutions

1. **Left-Side Duplicate Cards**:
   - *Root Cause:* In `DiscoveryView.tsx`, `findCandidate()` previously used a loose coordinate distance check (`dLat < 0.6 && dLon < 0.6` ≈ 66 km). In Antarctica, neighboring candidate sites (Mount Fleming, University Valley, Victoria Valley) are close enough that multiple matches mapped to the same frontend candidate. Because the merger loop did not enforce uniqueness before pushing to `mergedList`, Mount Fleming was added multiple times.
   - *Fix:*
     - Added an exact alias lookup map (`candidateAliasMap`) linking backend IDs/names directly to frontend site IDs.
     - Replaced loose coordinate check with strict tolerance (`< 0.05°` ≈ 5 km).
     - Added strict set-based deduplication (`matchedCandidateIds.has(existing.site.id)` check) to prevent any duplicate insertion.
     - Added an ultimate deduplication pass on `mergedList` and `filteredCandidates` by `site.id`.

2. **Right-Side 3D Earth Globe Points Glitch & Occlusion Failure**:
   - *Root Cause:*
     - In `PlanetaryGlobe3D.tsx`, `projectPins()` used `dot > 0.08` for visibility, which allowed points on the back side of the Earth (where the true geometric horizon is `cos(θ) ≈ 0.42` for camera distance ~2.4) to remain visible.
     - `_v1.project(camera)` was projecting points behind the camera plane (`z > 1.0`) or behind the horizon, flinging 2D coordinates into space outside the globe.
     - Additionally, for every non-active candidate pin, `PlanetaryGlobe3D` was rendering a 2D HTML `<button>` green dot on top of the canvas, which duplicated the 3D Three.js pins and lacked depth testing.
   - *Fix:*
     - Implemented true geometric horizon occlusion: `const horizonCutoff = Math.max(0.18, (1.0 / camDist) + 0.04)`. Any point with `dot <= horizonCutoff` is completely discarded.
     - Added NDC depth bounds checking: points with `z < -1.0 || z > 1.0` or coordinates outside the viewport bounds are discarded.
     - Removed redundant 2D HTML green dots for non-active pins (`if (!isExpanded) return null;`). The Three.js 3D meshes on the globe surface already render all candidate pins with true 3D depth and rotation.
     - Updated Three.js 3D pin group visibility in the render loop with `isFront = dot > horizonCutoff` so 3D pins naturally hide when rotated behind the Earth.

3. **Verification**:
   - `npm run lint && npm run build`: 0 TypeScript errors, 2056 modules transformed, built in 1.53s.
   - `python backend/manage.py test api`: 30/30 tests passed in 0.072s.
