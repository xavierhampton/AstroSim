# AstroSim: Layered Earth Destruction and N-Body Simulation

AstroSim is an interactive 3D space simulation that visualizes asteroid collisions, orbital motion, and large-scale gravitational interactions in real time. Built with **Three.js** and **Cannon-ES**, it combines physics simulation with procedural deformation and post-processing effects to create a dynamic planetary environment.



<img src="https://github.com/xavierhampton/AstroSim/blob/main/public/resources/planets.png">

---

## Overview

AstroSim allows users to spawn asteroids, simulate realistic orbital paths, and observe physical interactions such as impacts and debris formation. The simulation integrates:
- **N-Body gravity** for dynamic asteroid movement  
- **Procedural Earth deformation** for crater formation  
- **Camera and bloom effects** for visual impact and immersion  

---

## N-Body Gravity

The simulation applies Newtonian gravity between all valid bodies. Each body exerts a force proportional to its mass and inversely proportional to the square of the distance between them:

\[
F = G \frac{m_1 m_2}{r^2}
\]

This system enables orbital motion without external physics engines beyond Cannon-ES constraints.

---

## Layered Earth Deformation System

The Earth is composed of **five concentric layers**, each representing a physical zone with unique toughness:

1. **Cloud Layer** – atmospheric shell; highly deformable and visual only  
2. **Crust** – primary surface; most responsive to impacts  
3. **Mantle (Stone Layer)** – denser structure; moderate deformation  
4. **Core Shell** – rigid; limited deformation  
5. **Inner Core** – static; structural anchor

When an asteroid collides with the Earth, deformation is applied per-vertex in the affected region. Vertices within the impact radius are displaced **inward along their normal vectors**, simulating crater formation.

Each deformation magnitude is influenced by:
- **Distance falloff** – closer vertices deform more  
- **Material hardness** – deeper layers resist compression  
- **Procedural noise** – uses *Simplex noise* to create jagged, non-uniform crater edges  
- **Cumulative limits** – prevents vertices from collapsing past a safe minimum radius  

By pushing vertices inward rather than breaking geometry apart, the deformation is both **visually convincing and computationally efficient**, requiring only buffer updates and normal recomputation.

---

## Efficiency and Design

- **No remeshing or reconstruction:** operates directly on existing vertex buffers  
- **Local updates only:** modifies vertices near the collision point  
- **Physics decoupled from rendering:** deformation runs on the render mesh while physics runs on simplified Cannon bodies  
- **Layer differentiation:** visual and physical effects determined by layer index  

This structure allows for multiple impacts, maintaining performance even at high asteroid counts.

---


| Category | Tools |
|-----------|-------|
| 3D Rendering | [Three.js](https://threejs.org/) |
| Physics Simulation | [Cannon-ES](https://github.com/pmndrs/cannon-es) |
| Procedural Noise | [Simplex-Noise](https://www.npmjs.com/package/simplex-noise) |
| Post-Processing | [UnrealBloomPass](https://threejs.org/docs/#examples/en/postprocessing/UnrealBloomPass) |
| Build & Bundling | [Vite](https://vitejs.dev/) |

---

## Acknowledgements
- **Earth & Cloud Texture:** [Solar System Scope](https://www.solarsystemscope.com/textures/)  
- **Asteroid Texture:** [Freepik](https://www.freepik.com/free-photo/photo-stone-texture-pattern_226230331.htm)
- **Threejs Boilerplate** [Sean-Bradley’s Three.js Boilerplate](https://github.com/Sean-Bradley/Threejs-Boilerplate)


