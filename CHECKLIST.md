# Randabones — Feature Checklist

Status of v0.1 (UI-first). Goal: look like Spine2D now, add functionality step by step.

Legend: [x] working · [~] partial · [ ] not working yet (the button/menu is visible and only shows a toast)

## Working
- [x] Dependency-free Node server (`npm start`, port 3000)
- [x] Viewport: zoom (wheel / buttons), pan (middle button, right-click, Pan tool), grid, axes
- [x] Display toggles: Bones / Grid / Axes
- [x] Tools: Select (V), Pan (H), Create Bone (B), Translate (T), Rotate (R)
- [x] Create bones by click-drag (parent = selected bone)
- [x] Bone hierarchy (local → world transforms), diamond-shaped bone display
- [x] Tree panel: select bones, nested hierarchy
- [x] Bone properties: name, position, rotation, scale X/Y, length, color
- [x] Delete a bone with its children (Del)
- [x] Save skeleton to JSON (File > Save JSON)
- [x] Menu bar with dropdowns, Setup / Animate mode switch
- [x] Resizable panels: drag the splitters (left, right, timeline, tree/properties); double-click a splitter to reset it
- [x] Layout profiles: save / load / delete named layouts (toolbar or Window menu), last layout auto-restored, Window > Reset layout (stored in browser localStorage)
- [x] Timeline: ruler, playhead, scrubbing, play/pause (Space), frame stepping, FPS, duration, zoom
- [~] Key: the Key button (K) adds a diamond on the timeline but does **not** store transform values yet

## Not working — Skeleton editing
- [ ] Scale (S) and Shear (D) tools in the viewport
- [ ] Shear X/Y properties (stored, no effect yet)
- [ ] Inherit rotation/scale options (stored, no effect on world transform yet)
- [ ] Bone scale affecting children (currently only the bone's own length)
- [ ] Transform modes (normal, no rotation, only translation, etc.)
- [ ] Undo / Redo
- [ ] Duplicate bone, re-parent (drag in tree), bone ordering
- [ ] Multi-select, box select
- [ ] Snapping, pose tools (reset pose, set setup pose)
- [ ] Open (load) JSON, import/export Spine formats (.json / .skel)

## Not working — Images, slots, meshes
- [ ] Import PNG images (Images panel), drag & drop
- [ ] Slots, draw order, region attachments
- [ ] Skins (multiple skins, per-skin attachments)
- [ ] Meshes: create, edit vertices, triangulation
- [ ] Weights (vertex-to-bone binding), auto-weights
- [ ] Texture packer / atlas
- [ ] Show/hide images and meshes

## Not working — Constraints
- [ ] IK constraint (1 and 2 bones, mix, bend direction)
- [ ] Transform constraint
- [ ] Path constraint
- [ ] Physics

## Not working — Animation
- [ ] Keys that store values (rotate, translate, scale, shear) per frame
- [ ] Pose interpolation between keys (linear, stepped, bezier)
- [ ] Rotate/Translate/Scale/Shear sub-rows showing their own keys
- [ ] Graph editor (bezier curves)
- [ ] Auto key, loop, onion skin
- [ ] New / duplicate / switch animations (Animations panel, dropdown)
- [ ] Slot keys (color, attachment), draw order keys, event keys, IK keys
- [ ] Select, move, copy/paste, delete keys in the dopesheet
- [ ] Events (Events panel)
- [ ] Animation preview in the viewport during playback

## Not working — Other
- [ ] Preferences, rebindable keyboard shortcuts, drag-to-dock / floating panels (panels are resizable but fixed in position), export/import layout profiles as files
- [ ] Project autosave (localStorage / server-side files)
- [ ] Game runtime players (export for Phaser/Pixi/Godot)
