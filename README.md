# Al-Jazari Virtual Museum

A walk-through 3D / VR museum of the machines of Badīʿ al-Zamān al-Jazarī (1136–1206), the engineer
often called the "father of robotics". It runs in the browser, needs no install and no build step,
and works on desktop, phone and VR headsets (Meta Quest, Pico, Vision Pro, and others with WebXR).

## Exhibits

| # | Machine | What you can do |
|---|---------|-----------------|
| 1 | Elephant Clock | Release a ball: falcon → serpent → vase, the mahout strikes, the phoenix turns |
| 2 | Musical Boat | **Program the peg drum**: click any peg to change the rhythm and melody |
| 3 | Peacock Hand-Washing Basin | Tail fans, water pours, doors open, servants bring soap and towel |
| 4 | Drink-Serving Automaton | The servant steps out, pours and offers a cup |
| 5 | Double-Acting Piston Pump | Water wheel → gears → crank → slot-rod → two pistons (glass cylinders) |
| 6 | Saqiya | A model horse rides the sweep while gears drive a chain of pots that lift water from the well |
| 7 | Castle Clock | Doors open hourly, falcons drop balls, musicians play, lamps light, zodiac turns |

All sound is synthesized live in the browser (drums, flute in maqam Hijaz, bells, trumpets, water).

## Run it

```bash
cd al-jazr
python3 tools/fetch_assets.py   # once: downloads the CC0 textures/models (~48 MB) into assets/
python3 -m http.server 8000
```
Open http://localhost:8000.

**Desktop:** W A S D to walk · mouse to look · Shift to hurry · click a brass button or a drum peg · Esc releases the mouse.
**Phone:** drag on the left side to walk, on the right side to look, and tap buttons or pegs.

Jump straight to a spot: `http://localhost:8000/?cam=x,z,yawDeg,pitchDeg`, for example `?cam=0,-37,0,6` faces the Castle Clock.

## In a VR headset (Meta Quest)

WebXR only works on **https** or **localhost**, so a plain `http://192.168.x.x:8000` will not show "Enter VR".
Pick one of these:

1. **Host it (easiest).** Drag the whole folder, including `assets/`, onto https://app.netlify.com/drop.
   Open the https link in the Quest Browser and press **Enter VR**.
2. **USB cable (adb).** Enable developer mode on the Quest, plug it in, and run
   `adb reverse tcp:8000 tcp:8000`. Then open `http://localhost:8000` in the Quest Browser.

**VR controls:** point and pull the trigger to teleport, or to press buttons and pegs · left stick walks · right stick snap-turns.

## Files

```
index.html          page, intro screen, import map (three.js r160 from unpkg)
style.css
js/main.js          renderer, loading, loop, HUD, VR switching
js/assets.js        loads the photo textures, 3D models and HDRI from assets/
js/post.js          desktop post-processing: ambient occlusion, bloom, AgX tone map, film grade
js/hall.js          architecture: walls with window openings, carved lattice screens, arcades,
                    gilded frieze, timber ceiling, lanterns, benches, sunlight
js/exhibits.js      the seven machines and their animations
js/info.js          plaque texts
js/plaques.js       lectern plaques with brass activation buttons
js/parts.js         PBR materials, figure builder, geometry baking (one draw call per material)
js/textures.js      procedural patterns (tiles, calligraphy, zodiac, feathers…) + normal-map generation
js/controls.js      desktop / touch / WebXR controls
js/audio.js         synthesized spatial audio
tools/fetch_assets.py  downloads the CC0 assets into assets/ (about 48 MB)
```

## Realism: what's real and what's built

- **Photographed materials.** Marble, sandstone, wood, fabric and metal are scanned PBR texture sets.
- **Real props.** The carved wooden elephant, the marble horse, brass vases, lanterns and benches are
  scanned or hand-modeled assets.
- **Light.** Low sun shines through carved lattice windows and casts patterned light. Warm museum
  spotlights cast real shadows. An HDRI captured in a real museum provides bounce light and reflections.
  On desktop, ambient occlusion, bloom and filmic AgX tone mapping are added (`?fx=0` turns them off for slow GPUs).
- **Built in code.** The machines' mechanisms, the architecture and the automaton figures are procedural.
  The figures are deliberately styled as lathe-turned, painted-wood replicas, as a real museum would show them.

The machines are interpretive reconstructions after al-Jazari's 1206 drawings, not measured replicas.

## Credits

Textures, models and the HDRI are from [Poly Haven](https://polyhaven.com) (CC0): marble_01,
large_sandstone_blocks, dark_wood, medieval_wood, fine_grained_wood, quatrefoil_jacquard_fabric,
metal_plate, plastered_wall_04, carved_wooden_elephant, horse_statue_01, brass_vase_01/03,
brass_diya_lantern, painted_wooden_bench, museum_of_ethnography (HDRI). Water normals from three.js examples.
