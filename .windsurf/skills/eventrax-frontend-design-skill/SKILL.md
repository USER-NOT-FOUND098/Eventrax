---
name: eventrax-frontend-design
description: Create distinctive, production-grade frontend interfaces for EVENTRAX. Focuses on "Honeypot" Student UI with high-end interactivity using React, Shadcn, GSAP, Three.js, Remotion, and advanced Framer Motion gestures.
license: Private/Internal Use
---

This skill governs the visual and interactive layer of EVENTRAX. It demands the creation of distinctive, production-grade interfaces that avoid generic "AI slop" aesthetics.

The goal: **The Student UI must be a "Honeypot"**—so visually engaging and fluid that users *want* to stay.

## 1. The Technology Arsenal (Mandatory)
You must leverage these specific libraries to achieve the "Honeypot" effect. Do not use generic CSS when these tools can provide superior polish.

-   **Shadcn UI**: The structural backbone. Use it for accessible, clean base components (Cards, Inputs, Dialogs). *Never* leave them default—style them to match the active theme.
-   **GSAP (GreenSock)**: The engine for complex choreography. Use for scroll-triggered timelines, staggered reveals, and hero section animations.
-   **Three.js (@react-three/fiber)**: Use sparingly but effectively for 3D buttons, interactive background blobs, or hero elements that react to mouse movement.
-   **Lenis Scroll**: Implement globally for smooth, momentum-based scrolling that makes the entire app feel like a luxury product.
-   **Remotion**: Use for programmatic video backgrounds and dynamic event trailers (see "Hero Engine" below).

### ⚡ Framer Motion (The Interaction Engine)
**Usage:** This is your primary tool for making the website feel "sexy" and tactile.
-   **Custom Cursors**: Implement a global custom cursor that tracks the mouse. It should be reactive—scaling up, changing color, or "magnetizing" to buttons when hovering over interactive elements.
-   **Advanced Gestures**: Don't just click. Implement **Drag-to-Dismiss** for modals, **Pan-to-Reveal** for sidebars, and **Long-Press** actions for context menus.
-   **Shared Layouts**: Use `<motion.div layoutId="...">` for seamless morphing transitions between the Event Card (list view) and the Event Detail page.
-   **Physics**: Use spring animations (not linear ease) for all interactions. The UI should feel like it has weight and momentum.

### 🎥 Remotion (The Hero Engine)
**Usage:** Use strictly for **High-Impact Hero Sections** and **Dynamic Video Generation**.
-   **Hero Backgrounds**: Instead of static images or heavy MP4s, build **programmatic, code-driven video backgrounds** using `<Player />`.
-   **Animated Components**: Replicate the "Remotion Demo" aesthetic—bouncing 3D emojis, kinetic typography that syncs with music/scroll, and burst animations.
-   **Technique**: Use `interpolate()`, `spring()`, and `useCurrentFrame()` to create fluid, physics-based motion that feels alive.

## 2. Design Thinking Protocol
Before coding, commit to a BOLD aesthetic direction:

-   **Purpose**: This is for Students (Gen Z). It needs to feel fast, reactive, and modern.
-   **Tone**: Pick an extreme. For EVENTRAX, aim for **"Cyber-Refined"**: Dark, glossy surfaces with neon accents (Dark Mode) vs. **"Swiss-Clean"**: High contrast, crisp typography, generous whitespace (Light Mode).
-   **Differentiation**: What makes this UNFORGETTABLE?
    -   *Generic:* A standard mouse pointer.
    -   *Distinctive:* A glowing custom cursor that blends (difference mode) with the text beneath it, and snaps magnetically to the "Register" button.

## 3. Frontend Aesthetics Guidelines

### Typography & Layout
-   **Fonts**: Avoid Inter/Arial. Use variable fonts with character (e.g., *Clash Display* for headers, *Satoshi* for body).
-   **Composition**: Break the grid. Use asymmetry. Overlap Shadcn cards with Three.js floating elements.
-   **Negative Space**: Use generous padding to create a "luxury" feel, or controlled density for "dashboard" efficiency.

### Color & Theme
-   **Variables**: Strict usage of CSS variables (`--background`, `--foreground`) for seamless Dark/Light mode switching.
-   **Palette**: Dominant dark tones with sharp, electric accents (Cyan, Neon Purple) outperform timid pastels.

### Motion & Interaction (The "Honeypot" Factor)
-   **Micro-interactions**: Every button click must have a feedback animation (Framer Motion scale tap).
-   **Page Loads**: No sudden jumps. Use GSAP staggers to orchestrate the entry of elements.
-   **Scroll**: Elements should fade, scale, or parallax as they enter the viewport.

## 4. Implementation Rules
1.  **Production-Grade**: Code must be efficient. Lazy load Three.js canvases. Debounce GSAP scroll listeners.
2.  **No "Cookie Cutter"**: Do not simply dump standard Shadcn components. Wrap them. Animate them. Texture them.
3.  **Context-Aware**:
    -   *Dashboard*: High efficiency, clean data viz.
    -   *Event Page*: Maximalist, immersive, high-emotion.

**IMPORTANT**: Match implementation complexity to the vision. Maximalist designs need elaborate GSAP/Remotion timelines. Minimalist designs need perfect typography and Lenis scrolling smoothness.

Remember: You are capable of extraordinary creative work. Don't hold back. Make EVENTRAX visually stunning.