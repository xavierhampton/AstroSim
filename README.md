# AstroSim

## Inspiration
With the theme of space, we wanted to push our boundaries and create a compelling physics simulation. We envisioned a system where a planet could be deformed and destroyed in real-time, and asteroids became the natural choice to achieve this. The goal was to explore both 3D rendering and physics in a visually engaging way, while tackling real challenges in simulation design.

## What it does
AstroSim allows users to interact with a 3D Earth and strategically place asteroids around it. Key features include:

- **Holographic asteroid placement:** Position asteroids near or around the planet in 3D space before launching them.  
- **Earth deformation and destruction:** Realistic crater generation using physics-based calculations.  
- **Independent cloud movement:** Clouds move separately from the Earth mesh, maintaining realism even after deformation.  
- **Interactive GUI controls:** Adjust camera and simulation parameters dynamically.  

## How we built it
We used a modern JavaScript stack including **Vite**, **Three.js**, and **Node.js**. The project relied heavily on vector math for hologram placement, physics calculations for crater generation, and texture mapping techniques for independent cloud movement. Tools like **Claude** and **ChatGPT** assisted in generating portions of the code and solving implementation challenges.

## Challenges we ran into
Some of the major challenges included:

1. **Asteroid placement system:**  
   - Original click-based placement often caused asteroids to spawn inside the Earth.  
   - Launch-from-camera approach was visually unappealing and still risked spawning inside Earth when the camera was close.  
   - The final solution uses a **holographic asteroid at the mouse cursor**, constrained to a plane normal to the Earth and camera, with a radius limit to prevent intersection.

2. **Texture mapping for clouds:**  
   - Initial textures had obvious poles, causing visual artifacts.  
   - Rotating the cloud mesh after Earth deformation caused misalignment.  
   - Solved by rotating the **texture itself**, rather than the mesh, keeping cloud movement consistent.

3. **N-Body physics calculations:**  
   - Implementing realistic asteroid collisions and cratering required careful vector math and optimization.  

## Accomplishments that we're proud of
- Smooth holographic asteroid placement in 3D space.  
- Realistic Earth deformation with accurate crater formation.  
- Clean and functional GUI for camera and simulation control.  
- Overcoming complex technical challenges in both physics and rendering.  

## What we learned
- First exposure to **Three.js** and advanced JavaScript concepts.  
- Physics simulation techniques including N-Body dynamics and collision response.  
- Vector math for mapping 3D cursor positions to holographic objects.  
- Texture mapping techniques for dynamic meshes.  

## What's next for AstroSim
- Implementing **orbits**, enabling objects to revolve around planets.  
- Expanding to a full **solar system destruction simulator**.  
- Improving visual fidelity and interactivity based on user feedback.  
