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
| 6 | Saqiya | An ox drives the gears, and a chain of pots lifts water from the well |
| 7 | Castle Clock | Doors open hourly, falcons drop balls, musicians play, lamps light, zodiac turns |

All sound is synthesized live in the browser (drums, flute in maqam Hijaz, bells, trumpets, water).

## Run it

```bash
cd al-jazr
python3 -m http.server 8000
```
Open http://localhost:8000.

**Desktop:** W A S D to walk · mouse to look · Shift to hurry · click a glowing gem or a peg · Esc releases the mouse.
**Phone:** drag on the left side to walk, on the right side to look, and tap gems or pegs.

Jump straight to a spot: `http://localhost:8000/?cam=x,z,yawDeg,pitchDeg`, for example `?cam=0,-37,0,6` faces the Castle Clock.

## In a VR headset (Meta Quest)

WebXR only works on **https** or **localhost**, so a plain `http://192.168.x.x:8000` will not show "Enter VR".
Pick one of these:

1. **Host it (easiest).** Drag the folder onto https://app.netlify.com/drop, or push it to GitHub Pages.
   Open the https link in the Quest Browser and press **Enter VR**.
2. **USB cable (adb).** Enable developer mode on the Quest, plug it in, and run
   `adb reverse tcp:8000 tcp:8000`. Then open `http://localhost:8000` in the Quest Browser.

**VR controls:** point and pull the trigger to teleport, or to press gems and pegs · left stick walks · right stick snap-turns.

## Files

```
index.html        page, intro screen, import map (three.js r160 from unpkg)
style.css
js/main.js        renderer, loop, HUD, VR button
js/hall.js        architecture: arcades, frieze, ceiling, windows, light shafts, lanterns
js/exhibits.js    the seven machines and their animations
js/info.js        plaque texts
js/plaques.js     lectern plaques with activation gems
js/parts.js       materials, figure builder, geometry baking (one draw call per material)
js/textures.js    procedural textures (marble, tiles, calligraphy, feathers, zodiac…)
js/controls.js    desktop / touch / WebXR controls
js/audio.js       synthesized spatial audio
```

## Making it even more realistic

Everything is built from code (no downloaded models or images), so it loads instantly but is
stylised rather than photoreal. The upgrade path is:

- Model hero pieces (the elephant, figures, ox) in Blender and export them as `.glb`. Load them
  with `GLTFLoader` in place of the procedural meshes, keeping the same animation hooks.
- Use real PBR texture sets (for example from Poly Haven) for marble, wood and brass.
- Bake lighting in Blender for soft global illumination.

The machines are interpretive reconstructions after al-Jazari's 1206 drawings, not measured replicas.
