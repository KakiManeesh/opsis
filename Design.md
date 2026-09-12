# Opsis — Complete Visual Design Brief
## Design Philosophy
Opsis is not a photo filter app for casual users. It is a **technical image processing pipeline builder** — a creative tool for developers, researchers, and technical designers who think in code. The interface must feel like a **professional instrument**: precise, calm, and fully in the user's control. Every visual decision should communicate technical competence, not consumer decoration.

The guiding emotional quality is **quiet authority**. The app should feel like sitting down at a well-designed workbench: everything is where you expect it, nothing competes for attention, and the material you are working on (the image) dominates the space.
## Mood &
The right reference points are not generic SaaS dashboards. They are:

- **DaVinci Resolve** — dark, dense, professional, image-first
- **Blender** — technical precision, dark graphite, layered panels
- **Darkroom** (macOS) — dark, minimal, image-centric, restrained controls
- **Sublime Text / VS Code** — dark code editor surfaces, strong typography, functional hierarchy
- **Figma** — dark workspace, left panel + canvas + right panel, calm density

The wrong reference points are:
- Any consumer photo app with heavy gradient overlays
- Dashboard templates with colorful stat cards
- SaaS landing pages with "3 features in a row" layouts
- Anything with purple-blue gradient blobs
## Core Visual Principles
1. **Dark, not black.** The background must be a deep graphite, not pure black. Pure black feels cheap and dead on modern screens. Layered graphite surfaces create depth without decoration.

2. **Image is king.** The image canvas must occupy the visual and spatial center of the interface. Controls are secondary; they exist to serve the image, not to dominate the screen.

3. **One accent, used sparingly.** A single muted technical accent color should appear only for active states, selected items, and primary actions. Everything else is neutral.

4. **Typography is the hierarchy.** With a restrained palette, type weight, size, and color must carry the full information architecture. No decorative icons as substitutes for hierarchy.

5. **Surfaces create depth, not shadows.** Use subtle surface color shifts to indicate elevation. Avoid heavy drop shadows on dark backgrounds — they disappear.

6. **Density is intentional.** The left panel is dense (many controls). The canvas is sparse (just the image). The right panel is medium (focused parameters). This density variation creates rhythm.
## Color System
### Surfaces
| Token | Value | Role |
|-------|-------|------|
| `--bg-base` | `#0f1113` | Deepest background, behind everything |
| `--bg-workspace` | `#141619` | Main workspace area behind the canvas |
| `--bg-panel` | `#1a1d21` | Panel backgrounds (left sidebar, right inspector) |
| `--bg-panel-elevated` | `#1e2227` | Elevated panels, cards, dropdowns |
| `--bg-panel-active` | `#23282e` | Active/selected panel sections |
| `--bg-input` | `#161a1e` | Input fields, textareas |
| `--bg-input-hover` | `#1a1e22` | Input hover state |
| `--bg-input-active` | `#1e2228` | Input focus state |
| `--bg-canvas` | `#0a0c0e` | Image canvas background (even deeper than base) |
| `--bg-canvas-overlay` | `rgba(10, 12, 14, 0.85)` | Canvas overlay for panels that float above |
### Borders
| Token | Value | Role |
|-------|-------|------|
| `--border-subtle` | `rgba(255, 255, 255, 0.06)` | Default panel borders |
| `--border-medium` | `rgba(255, 255, 255, 0.1)` | Divider lines, section separators |
| `--border-strong` | `rgba(255, 255, 255, 0.15)` | Active element borders, focused inputs |
| `--border-accent` | `var(--accent-primary)` | Selected pipeline step border |
### Text
| Token | Value | Role |
|-------|-------|------|
| `--text-primary` | `#e8e9ea` | Primary text, headings, labels |
| `--text-secondary` | `#9ca3af` | Secondary text, descriptions, inactive labels |
| `--text-tertiary` | `#6b7280` | Tertiary text, metadata, hints |
| `--text-disabled` | `#4b5563` | Disabled text, inactive controls |
| `--text-accent` | `var(--accent-primary)` | Accent text, links, active states |
| `--text-inverse` | `#0f1113` | Text on accent-colored buttons |
| `--text-code` | `#e2e4e8` | Python code display |
| `--text-code-keyword` | `#7dd3fc` | Python keywords (def, import, etc.) |
| `--text-code-string` | `#86efac` | Python strings |
| `--text-code-number` | `#fca5a5` | Python numbers |
| `--text-code-function` | `#c4b5fd` | Python function names |
| `--text-code-comment` | `#6b7280` | Python comments |
### Accent
| Token | Value | Role |
|-------|-------|------|
| `--accent-primary` | `#0ea5e9` | Sky blue — primary accent |
| `--accent-primary-hover` | `#0284c7` | Accent hover state |
| `--accent-primary-active` | `#0369a1` | Accent active/pressed state |
| `--accent-primary-muted` | `rgba(14, 165, 233, 0.15)` | Subtle accent tint for backgrounds |
| `--accent-secondary` | `#22d3ee` | Cyan — secondary accent for highlights |
| `--accent-warning` | `#f59e0b` | Amber — warning states |
| `--accent-error` | `#ef4444` | Red — error states |
| `--accent-success` | `#22c55e` | Green — success states |
### Status Colors
| Token | Value | Role |
|-------|-------|------|
| `--status-ready` | `#22c55e` | OpenCV ready indicator |
| `--status-loading` | `#f59e0b` | OpenCV loading indicator |
| `--status-error` | `#ef4444` | OpenCV error indicator |
## Typography
### Font Family
- **Primary UI font**: `Inter` or `Geist` — clean, technical, neutral. These are the modern standard for professional tools.
- **Code font**: `JetBrains Mono` or `Fira Code` — monospaced, clear distinction between similar characters (0/O, 1/l), syntax highlighting support.
- **Fallback stack**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
### Type Scale
| Token | Size | Weight | Line Height | Use Case |
|-------|------|--------|-------------|----------|
| `--text-2xs` | 10px | 500 | 1.2 | Tiny labels, status dots |
| `--text-xs` | 11px | 500 | 1.4 | Section labels, metadata, badges |
| `--text-sm` | 12px | 500 | 1.5 | Button text, tab labels, pipeline step names |
| `--text-base` | 13px | 400 | 1.5 | Body text, descriptions, control labels |
| `--text-md` | 14px | 500 | 1.5 | Panel headings, group titles |
| `--text-lg` | 16px | 600 | 1.3 | Section headings, dialog titles |
| `--text-xl` | 20px | 600 | 1.2 | App title, major section headers |
| `--text-code` | 12px | 400 | 1.6 | Python code (monospace) |
| `--text-code-sm` | 11px | 400 | 1.6 | Compact code blocks |
### Typography Rules
- **Tabular numbers** for all numeric displays (sliders, kernel sizes, coordinates) to prevent jitter during value changes.
- **Medium weight (500)** is the default for UI text. Regular (400) is for long descriptions. Semibold (600) is for headings only.
- **All caps with tracking** for tiny labels (e.g., "PIPELINE", "OPERATIONS", "PARAMETERS") to create visual hierarchy without size.
- **No text below 11px** for any readable content. 10px is only for status dots and single-letter indicators.
## Spacing System
### Base Unit
The base unit is **4px**. All spacing derives from this.

| Token | Value | Use Case |
|-------|-------|----------|
| `--space-1` | 4px | Icon gaps, tight internal spacing |
| `--space-2` | 8px | Small gaps, inline padding |
| `--space-3` | 12px | Button padding, list item gaps |
| `--space-4` | 16px | Card padding, panel internal spacing |
| `--space-5` | 20px | Section gaps |
| `--space-6` | 24px | Panel padding, major group separation |
| `--space-8` | 32px | Section margins, large gaps |
| `--space-10` | 40px | Layout padding |
| `--space-12` | 48px | Major section padding |
### Layout Spacing
- **Panel gutters**: 0px between panels (panels touch with a single border)
- **Panel internal padding**: 16px (`--space-4`) on all sides
- **Section separation within panels**: 24px (`--space-6`) between major sections
- **Group separation**: 16px (`--space-4`) between related control groups
- **Control spacing**: 12px (`--space-3`) between individual controls in a group
- **Canvas padding**: 24px (`--space-6`) around the image within the canvas area
## Border Radius
| Token | Value | Use Case |
|-------|-------|----------|
| `--radius-none` | 0px | Canvas, panels, structural elements |
| `--radius-sm` | 4px | Small buttons, badges, inputs |
| `--radius-md` | 6px | Standard buttons, cards, dropdowns |
| `--radius-lg` | 8px | Modal dialogs, large cards |
| `--radius-full` | 9999px | Pill buttons, status indicators |
### Radius Rules
- **Panels and main layout**: 0px radius. The app is a tool, not a mobile app. Sharp corners feel more professional and precise.
- **Buttons and inputs**: 4-6px radius. Small enough to feel technical, large enough to feel clickable.
- **Pipeline step cards**: 6px radius. Slightly larger to differentiate them as interactive objects.
- **No floating rounded cards** on the main workspace. Everything is anchored to the grid.
## Shadows
On dark backgrounds, shadows are subtle and warm-tinted:

| Token | Value | Use Case |
|-------|-------|----------|
| `--shadow-none` | none | Default state |
| `--shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.3)` | Subtle elevation |
| `--shadow-md` | `0 4px 8px rgba(0, 0, 0, 0.4)` | Dropdowns, popovers |
| `--shadow-lg` | `0 8px 16px rgba(0, 0, 0, 0.5)` | Modals, floating panels |
| `--shadow-xl` | `0 16px 32px rgba(0, 0, 0, 0.6)` | Full-screen overlays |
### Shadow Rules
- **Shadows are for elevation only, not decoration.** A panel with a shadow is floating above the workspace. A panel without a shadow is docked to the edge.
- **Dark mode shadows are less visible** — use higher opacity and larger spread.
- **No colored shadows** (no blue-tinted or purple-tinted glows).
## Transitions
| Token | Value | Use Case |
|-------|-------|----------|
| `--transition-fast` | `150ms ease-out` | Hover states, color changes |
| `--transition-medium` | `250ms ease-out` | Panel transitions, expand/collapse |
| `--transition-slow` | `350ms ease-out` | Major layout changes, modal open |
| `--transition-spring` | `300ms cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful interactions (e.g., step reorder) |
### Transition Rules
- **Only animate properties that don't cause layout thrashing**: opacity, transform, color, border-color, background-color.
- **Never animate width, height, top, left, margin, or padding.** Use transform instead.
- **Pipeline step reordering**: Use transform translate for drag, not position changes.

***
# Layout Architecture
## The Three-Zone Workspace
The interface is organized into three distinct zones that map to the user's mental model:

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (slim, 44px)                                        │
├──────────┬──────────────────────────┬─────────────────────┤
│          │                          │                     │
│  LEFT    │        CENTER            │      RIGHT          │
│  PANEL   │        CANVAS            │      INSPECTOR      │
│  (280px) │        (flexible)        │      (320px)        │
│          │                          │                     │
│  Build   │        View              │      Edit           │
│  pipeline│        image             │      selected step  │
│          │                          │                     │
├──────────┴──────────────────────────┴─────────────────────┤
│  FOOTER (optional, 32px) — Python code toggle            │
└─────────────────────────────────────────────────────────────┘
```
### Zone 1: Left Panel — "Build"
**Width**: 280px fixed, full height minus header.
**Purpose**: Building the pipeline, adding operations, managing the pipeline stack.
**Content**:
- Image upload (compact, at top)
- Operation selector (dropdown + parameter preview)
- "Add to Pipeline" button
- Pipeline stack (reorderable cards)
- JSON export/import (small, bottom)

**Visual treatment**:
- Background: `--bg-panel`
- Right border: `--border-medium`
- Dense controls, compact spacing
- Each section separated by a subtle divider line
### Zone 2: Center Canvas — "View"
**Width**: Flexible, fills remaining space.
**Purpose**: Displaying the image, comparing before/after.
**Content**:
- Image canvas (dominant)
- Before/after toggle or split view
- Zoom controls (small overlay)
- Image info (dimensions, format — small overlay)
- Empty state when no image

**Visual treatment**:
- Background: `--bg-canvas` (darker than workspace)
- Image centered with padding
- No internal borders around the image
- Subtle checkerboard pattern for transparent areas (optional)
- Before/after controls as a small floating bar above the image
### Zone 3: Right Inspector — "Edit"
**Width**: 320px fixed, full height minus header.
**Purpose**: Editing parameters of the selected pipeline step.
**Content**:
- Selected step name and icon
- Parameter controls (sliders, inputs, toggles)
- Real-time preview of changes
- Generated Python code for this step (collapsible)

**Visual treatment**:
- Background: `--bg-panel`
- Left border: `--border-medium`
- More spacious than left panel (controls need breathing room)
- Parameters grouped with clear labels
### Zone 4: Header — "Navigate"
**Height**: 44px, full width.
**Purpose**: App identity, global status, primary actions.
**Content**:
- App name + small icon (left)
- OpenCV status indicator (center-left)
- Image info (center, only when image loaded)
- Global actions: reset, export, settings (right)

**Visual treatment**:
- Background: `--bg-base` (slightly darker than panels)
- Bottom border: `--border-medium`
- Compact, minimal text
### Zone 5: Footer — "Code" (Optional)
**Height**: 32px, full width, collapsible.
**Purpose**: Quick access to full generated Python code.
**Content**:
- Toggle button: "Show Python Code"
- When expanded: full-height panel below canvas with syntax-highlighted code

**Visual treatment**:
- Background: `--bg-base`
- Top border: `--border-medium`
- Collapsible, off by default

***
# Component Breakdown
## 1. Header
### Structure
```
┌─────────────────────────────────────────────────────────────┐
│ [●] OPSIS          ● Ready    1920×1080  JPEG    [⚙] [⬇] │
│        App name      Status    Image info        Actions    │
└─────────────────────────────────────────────────────────────┘
```
### Elements
#### App Name
- **Text**: "OPSIS" (all caps, tracking 0.1em, `--text-sm`, weight 600)
- **Icon**: Small geometric icon (20×20px) before the name — a simplified camera aperture or lens shape, monochrome, using `--text-primary` color
- **Position**: Left aligned, 16px from left edge

#### Status Indicator
- **Dot**: 8px circle, `--status-ready` (green), `--status-loading` (amber), or `--status-error` (red)
- **Text**: "Ready", "Loading...", "Error" — `--text-xs`, `--text-secondary`
- **Position**: 16px right of app name
- **Transition**: Dot pulses slowly when loading (opacity 0.5 to 1.0, 1.5s ease-in-out infinite)

#### Image Info
- **Text**: "1920×1080  JPEG" or similar — `--text-xs`, `--text-tertiary`
- **Position**: Center of header, only visible when image is loaded
- **Transition**: Fades in/out with `--transition-fast`

#### Global Actions
- **Buttons**: Small icon-only buttons (32×32px)
  - Reset pipeline (circular arrow icon)
  - Export image (download icon)
  - Settings (gear icon)
- **Style**: `--text-secondary` default, `--text-primary` on hover, `--bg-panel-hover` background on hover
- **Position**: Right aligned, 16px from right edge
## 2. Left Panel — Build
### Section A: Image Upload
#### Compact Upload Area
- **Height**: ~80px when no image, collapses to 40px when image loaded
- **Style**: 
  - Dashed border: `--border-medium` with `--border-strong` on hover
  - Background: `--bg-panel` (no distinct background — it blends into the panel)
  - Border radius: `--radius-md`
  - Padding: `--space-4`
- **Content when empty**:
  - Upload icon (20px, `--text-tertiary`)
  - Text: "Drop image here or click to browse" — `--text-sm`, `--text-secondary`
  - Supported formats hint: "JPG, PNG, WebP" — `--text-xs`, `--text-tertiary`
- **Content when image loaded**:
  - Thumbnail (32×32px, rounded)
  - Filename (truncated, `--text-sm`, `--text-primary`)
  - File size (`--text-xs`, `--text-tertiary`)
  - Remove button (X icon, 16px, `--text-tertiary`, hover `--accent-error`)
- **Hover**: Border transitions to `--border-strong`, background to `--bg-panel-elevated`
- **Drag-over**: Border becomes `--accent-primary`, dashed border becomes solid, background `--accent-primary-muted`
### Section B: Add Operation
#### Operation Selector

**Dropdown**:
- **Style**: 
  - Full width of panel
  - Height: 36px
  - Background: `--bg-input`
  - Border: `--border-subtle`
  - Border radius: `--radius-md`
  - Padding: `--space-3` horizontal
  - Text: `--text-sm`, `--text-primary`
  - Icon: Chevron down (16px, `--text-tertiary`)
- **Hover**: Border `--border-medium`, background `--bg-input-hover`
- **Focus**: Border `--border-strong`, ring 2px `--accent-primary-muted`
- **Dropdown menu**:
  - Background: `--bg-panel-elevated`
  - Border: `--border-medium`
  - Shadow: `--shadow-md`
  - Border radius: `--radius-md`
  - Max height: 400px, scrollable
  - Items: 36px height, padding `--space-3`
  - Hover: background `--bg-panel-active`
  - Selected: background `--accent-primary-muted`, text `--accent-primary`
  - Group headers: "BASIC", "MORPHOLOGY", "EDGE", "COLOR" — `--text-xs`, `--text-tertiary`, all caps, padding `--space-3` top

**Operation Preview**:
- Below dropdown, when operation is selected
- Small preview of what this operation does (2-3 words)
- e.g., "Gaussian blur with adjustable kernel" — `--text-xs`, `--text-tertiary`

#### Parameter Preview
- When an operation is selected, show a **read-only preview** of its default parameters
- e.g., "Kernel: 5" — `--text-xs`, `--text-tertiary`
- This is not editable here — editing happens after adding to the pipeline

#### "Add Step" Button
- **Style**:
  - Full width
  - Height: 36px
  - Background: `--accent-primary`
  - Text: "Add Step" — `--text-sm`, `--text-inverse`, weight 600
  - Border radius: `--radius-md`
  - Icon: Plus (16px) left of text
- **Hover**: Background `--accent-primary-hover`
- **Active**: Background `--accent-primary-active`, transform scale(0.98)
- **Disabled**: Background `--bg-panel-active`, text `--text-disabled`, no hover
- **Transition**: `--transition-fast` for all states
### Section C: Pipeline Stack
#### Section Header
- **Text**: "PIPELINE" — `--text-xs`, `--text-tertiary`, all caps, letter-spacing 0.08em
- **Count badge**: Number of steps in a small pill — `--text-2xs`, `--text-inverse`, background `--bg-panel-active`, padding 2px 6px, border-radius `--radius-full`
- **Position**: Left aligned, 16px padding

#### Empty State
- **Text**: "No operations yet" — `--text-sm`, `--text-tertiary`, centered
- **Secondary text**: "Add an operation to begin" — `--text-xs`, `--text-tertiary`
- **Style**: Padding `--space-8` vertical, subtle top border `--border-subtle`

#### Pipeline Step Cards

**Card Structure**:
```
┌─────────────────────────────────────────┐
│ [●] 1. Gaussian Blur          [≡] [✕] │
│     Kernel: 5                           │
├─────────────────────────────────────────┤
│ [●] 2. Threshold              [≡] [✕] │
│     Value: 127, Max: 255    [ACTIVE]    │
│     ─────────────────────────────────   │
│     (Selected — right panel shows       │
│      parameters for this step)          │
├─────────────────────────────────────────┤
│ [●] 3. Canny Edge Detection   [≡] [✕] │
│     Low: 100, High: 200                 │
└─────────────────────────────────────────┘
```

**Card Style**:
- Background: `--bg-panel-elevated`
- Border: `--border-subtle`
- Border radius: `--radius-md`
- Padding: `--space-3`
- Margin bottom: `--space-2`
- Full width within panel padding

**Card Content**:
- **Step number**: Circle with number (20px, `--text-2xs`, `--text-tertiary`, border 1px `--border-medium`) or small dot for compact view
- **Operation name**: `--text-sm`, `--text-primary`, weight 500
- **Parameter summary**: `--text-xs`, `--text-tertiary` — e.g., "Kernel: 5"
- **Drag handle**: Hamburger icon (≡), 16px, `--text-tertiary`, cursor grab. On hover: `--text-primary`
- **Delete button**: X icon, 16px, `--text-tertiary`, hover `--accent-error`. Appears on hover or always visible on touch devices.
- **Duplicate button**: Duplicate icon, 16px, `--text-tertiary`, hover `--text-primary`. Appears on hover.

**Card States**:
- **Default**: As above
- **Hover**: Border `--border-medium`, background `--bg-panel-active`
- **Selected**: Border 2px `--accent-primary`, background `--accent-primary-muted`, left border accent bar (3px solid `--accent-primary`)
- **Dragging**: Shadow `--shadow-lg`, opacity 0.9, scale 1.02, z-index 100
- **Drop target**: Border `--accent-primary`, background `--accent-primary-muted` (for the slot where card will be dropped)

**Card Actions**:
- **Click**: Selects the step, opens it in the right inspector
- **Drag**: Reorders step in the pipeline
- **Delete**: Removes step, shifts subsequent step numbers
- **Duplicate**: Creates a copy immediately after the original

**Reorder Behavior**:
- Drag handle initiates drag
- Visual feedback: card lifts slightly, shadow appears
- Other cards make space by shifting down/up
- Drop snaps into place with spring transition `--transition-spring`
- Numbers update immediately after drop
### Section D: Pipeline Actions
**Undo / Reset Buttons**:
- **Undo**: "Undo Last Step" — `--text-xs`, `--text-secondary`, icon: undo arrow
- **Reset**: "Reset Pipeline" — `--text-xs`, `--text-secondary`, icon: trash
- **Style**: Ghost buttons, no background. Hover: `--text-primary`, background `--bg-panel-active`
- **Disabled**: `--text-disabled`, no hover
- **Position**: Below pipeline stack, `--space-4` padding
### Section E: JSON Workflow
**Export / Import Buttons**:
- **Export**: "Export JSON" — small secondary button
- **Import**: "Import JSON" — small secondary button
- **Style**: 
  - Height: 28px
  - Background: `--bg-panel-active`
  - Border: `--border-subtle`
  - Text: `--text-xs`, `--text-secondary`
  - Border radius: `--radius-sm`
  - Padding: `--space-2` horizontal
- **Hover**: Border `--border-medium`, text `--text-primary`
- **Position**: Bottom of left panel, small separator above

**Import Drop Zone**:
- When dragging a JSON file over the app, show a full-screen overlay:
  - Background: `rgba(15, 17, 19, 0.8)`
  - Border: 2px dashed `--accent-primary`
  - Text: "Drop JSON to import pipeline" — `--text-xl`, `--accent-primary`
  - Icon: Upload icon (48px)
## 3. Center Canvas — View
### Canvas Area
**Container**:
- Background: `--bg-canvas` (pure black-ish, #0a0c0e)
- Full remaining width and height
- No internal padding (image has its own padding)
- Centered content
### Empty State
**Content**:
- Large icon (48px, `--text-tertiary`): Image placeholder or upload icon
- Text: "Upload an image to start" — `--text-md`, `--text-tertiary`
- Secondary text: "JPG, PNG, WebP up to 10MB" — `--text-sm`, `--text-tertiary`
- Button: "Choose Image" — primary button style

**Style**:
- Centered vertically and horizontally
- Subtle background: checkerboard pattern (very faint, 2px squares, `--bg-base` and `--bg-canvas` alternating)
### Image Display
**Image Container**:
- Image centered with `--space-6` padding around it
- Max size: 100% of container minus padding
- Object-fit: contain (preserve aspect ratio)
- Background behind image: checkerboard for transparent areas (optional)

**Image Info Overlay** (bottom-left of image):
- Small floating badge
- Background: `--bg-canvas-overlay`
- Border radius: `--radius-sm`
- Padding: `--space-2` `--space-3`
- Text: "1920×1080" — `--text-xs`, `--text-secondary`
- Transition: fades in on image load, `--transition-fast`
### Before/After Controls
**Floating Bar** (above image, centered):
- Background: `--bg-canvas-overlay`
- Border radius: `--radius-md`
- Padding: `--space-2` `--space-3`
- Border: `--border-subtle`
- Shadow: `--shadow-sm`

**Controls**:
- **Toggle buttons**:
  - "Original" — `--text-xs`, `--text-secondary`
  - "Final" — `--text-xs`, `--text-secondary`
  - "Split" — `--text-xs`, `--text-secondary`
- **Active state**: Background `--bg-panel-active`, text `--text-primary`, border `--border-medium`
- **Inactive state**: Transparent background, text `--text-tertiary`
- **Split view**: Vertical slider dividing original (left) and final (right), draggable divider

**Keyboard Shortcuts** (optional, shown as small hint):
- "Tab" — `--text-2xs`, `--text-tertiary`
### Zoom Controls
**Floating Controls** (bottom-right of image):
- Background: `--bg-canvas-overlay`
- Border radius: `--radius-md`
- Padding: `--space-2`
- Buttons: Zoom in (+), Zoom out (-), Fit to screen (⌘), 100% (1:1)
- Icon buttons: 28×28px, `--text-secondary`, hover `--text-primary`
- Current zoom level: `--text-xs`, `--text-secondary`, between buttons
### Processing Indicator
**When processing**:
- Small overlay on image center
- Background: `--bg-canvas-overlay`
- Border radius: `--radius-lg`
- Padding: `--space-4`
- Spinner: Small rotating circle (16px, `--accent-primary`)
- Text: "Processing..." — `--text-sm`, `--text-secondary`
- Transition: fades in `--transition-fast`, stays for processing duration
## 4. Right Inspector — Edit
### Section Header
**Selected Step Info**:
- **Icon**: Operation-specific icon (20px, `--accent-primary`)
- **Name**: e.g., "Gaussian Blur" — `--text-md`, `--text-primary`, weight 600
- **Number**: "Step 2 of 5" — `--text-xs`, `--text-tertiary`
- **Separator**: 1px line `--border-medium`
### Parameter Controls
Each parameter is a self-contained control group:

#### Slider Control
```
Kernel Size
├──────────────────────────────────────┤  5
0                                      31
```

**Structure**:
- **Label**: "Kernel Size" — `--text-sm`, `--text-primary`, weight 500
- **Value display**: Current value — `--text-sm`, `--text-secondary`, right-aligned
- **Slider track**:
  - Track: 4px height, `--bg-panel-active`, border-radius `--radius-full`
  - Fill: `--accent-primary` (left of thumb)
  - Thumb: 16px circle, `--bg-panel-elevated`, border 2px `--accent-primary`
  - Hover thumb: scale 1.2, shadow `--shadow-sm`
  - Active thumb: scale 1.1, background `--accent-primary`
- **Min/Max labels**: "0" / "31" — `--text-xs`, `--text-tertiary`

**Interaction**:
- Drag thumb: updates value in real-time, image preview updates in real-time
- Click track: jumps to that position
- Arrow keys: fine adjustment (±1)
- Shift + arrow keys: coarse adjustment (±5)

**Validation**:
- For odd kernels: auto-round to nearest odd
- Min/max clamping
- Visual feedback: value turns `--accent-warning` if out of valid range (shouldn't happen with clamping)

#### Number Input Control
```
Threshold Value
┌──────────────────────────────────────┐
│ 127                                  │
└──────────────────────────────────────┘
```

**Structure**:
- **Label**: "Threshold Value" — `--text-sm`, `--text-primary`, weight 500
- **Input**:
  - Height: 32px
  - Background: `--bg-input`
  - Border: `--border-subtle`
  - Border radius: `--radius-md`
  - Padding: `--space-3` horizontal
  - Text: `--text-sm`, `--text-primary`, tabular nums
  - Focus: border `--border-strong`, ring 2px `--accent-primary-muted`
- **Unit/Hint**: "0-255" — `--text-xs`, `--text-tertiary`, right of input

**Interaction**:
- Type value, press Enter or blur to apply
- Up/down arrow buttons (optional, small spinner buttons on right of input)
- Validation: clamp to range, show subtle red border if invalid

#### Dropdown Control
```
Threshold Type
┌──────────────────────────────────────┐
│ Binary                               │
└──────────────────────────────────────┘
```

**Structure**:
- Same as operation selector but smaller
- Height: 32px
- Options: e.g., "Binary", "Binary Inverse", "Trunc", "To Zero", "To Zero Inverse"

#### Toggle/Switch Control
```
Auto-convert to Grayscale
              ┌──────┐
              │  ●   │
              └──────┘
```

**Structure**:
- **Label**: Left-aligned
- **Switch**:
  - Width: 36px, height: 20px
  - Track: `--bg-panel-active`, border-radius `--radius-full`
  - Thumb: 16px circle, `--bg-panel-elevated`
  - Active track: `--accent-primary`
  - Active thumb: white
  - Transition: `--transition-fast` (thumb slides left/right)

#### Button Group Control
```
Morphology Type
[ Erosion ] [ Dilation ] [ Opening ] [ Closing ]
```

**Structure**:
- **Label**: "Morphology Type" — `--text-sm`, `--text-primary`, weight 500
- **Buttons**: Horizontal row of small buttons
  - Height: 28px
  - Background: `--bg-panel-active`
  - Border: `--border-subtle`
  - Text: `--text-xs`, `--text-secondary`
  - Active: background `--accent-primary-muted`, text `--accent-primary`, border `--accent-primary`
  - Hover: background `--bg-panel-elevated`, text `--text-primary`
  - Border radius: `--radius-sm` for first/last, 0 for middle (connected style)
### Parameter Groups
**Group Structure**:
- **Group label**: e.g., "BLUR SETTINGS" — `--text-xs`, `--text-tertiary`, all caps, letter-spacing 0.08em, padding `--space-4` top `--space-2` bottom
- **Separator**: 1px line `--border-subtle` below group label
- **Controls**: `--space-3` between each control

**Example Groups**:
- Blur: "Kernel Size"
- Threshold: "Threshold Value", "Max Value", "Type"
- Canny: "Low Threshold", "High Threshold"
- Morphology: "Type", "Kernel Size", "Iterations"
- Brightness/Contrast: "Contrast (Alpha)", "Brightness (Beta)"
- Sharpen: "Intensity"
### Generated Code Preview
**Collapsible Section**:
- **Header**: "Python Code" — `--text-xs`, `--text-tertiary`, all caps, with chevron icon (right when collapsed, down when expanded)
- **Click**: Expands/collapses
- **Transition**: `--transition-medium` for height

**Code Block**:
- Background: `--bg-base` (slightly darker than panel)
- Border: `--border-subtle`
- Border radius: `--radius-md`
- Padding: `--space-3`
- Font: `JetBrains Mono`, `--text-code-sm`
- Line height: 1.6
- Overflow: auto (horizontal scroll if needed)
- Syntax highlighting:
  - Keywords: `--text-code-keyword`
  - Strings: `--text-code-string`
  - Numbers: `--text-code-number`
  - Functions: `--text-code-function`
  - Comments: `--text-code-comment`
  - Default: `--text-code`

**Example Display**:
```python
# Step 2: Gaussian Blur
img = cv2.GaussianBlur(img, (5, 5), 0)
```

**Copy Button**:
- Small icon button (24px) top-right of code block
- Icon: Copy icon
- Style: `--text-tertiary`, hover `--text-primary`
- Click: Copies code to clipboard, brief "Copied!" tooltip
## 5. Footer — Python Code
### Collapsible Panel
**Toggle Button**:
- Text: "Python Code" with chevron
- Height: 32px
- Full width
- Background: `--bg-base`
- Border top: `--border-medium`
- Text: `--text-xs`, `--text-secondary`, all caps
- Icon: Code icon (16px) left of text

**Expanded Panel**:
- Height: 300px (or 50% of viewport)
- Background: `--bg-base`
- Border top: `--border-medium`
- Content: Full generated Python script

**Code Display**:
- Same syntax highlighting as inspector code block
- Line numbers: `--text-tertiary`, `--text-code-sm`, right-aligned in gutter
- Full script with imports, read, pipeline steps, save
- Copy button: "Copy Full Script" — primary button, bottom-right
## 6. Modals & Overlays
### Import JSON Modal
**Overlay**:
- Background: `rgba(0, 0, 0, 0.7)`
- Backdrop blur: 4px

**Modal**:
- Width: 480px
- Background: `--bg-panel`
- Border: `--border-medium`
- Border radius: `--radius-lg`
- Shadow: `--shadow-xl`
- Padding: `--space-6`

**Content**:
- Title: "Import Pipeline" — `--text-lg`, `--text-primary`
- Description: "Upload a JSON file to restore a pipeline." — `--text-sm`, `--text-secondary`
- Drop zone: Large dashed area, same style as image upload but bigger
- File info: Name, size, step count (after file selected)
- Validation: Error message if invalid JSON — `--text-sm`, `--accent-error`
- Buttons: "Cancel" (ghost), "Import" (primary)
### Export JSON Modal
**Structure**: Same as import

**Content**:
- Title: "Export Pipeline"
- Description: "Save your pipeline as a JSON file."
- Filename input: Default "opsis-pipeline.json"
- Preview: Step count, operations list
- Buttons: "Cancel" (ghost), "Download" (primary)
### Error Toast
**Structure**:
- Position: Bottom-center, 16px from bottom
- Background: `--bg-panel-elevated`
- Border left: 3px `--accent-error`
- Border radius: `--radius-md`
- Shadow: `--shadow-lg`
- Padding: `--space-3` `--space-4`
- Max width: 400px

**Content**:
- Icon: Error icon (16px, `--accent-error`)
- Message: `--text-sm`, `--text-primary`
- Detail: `--text-xs`, `--text-secondary`
- Close button: X icon, `--text-tertiary`
- Auto-dismiss: 5 seconds
- Animation: Slide up from bottom, `--transition-medium`

***
# Interaction Design
## Hover States
- **Buttons**: Background color shift, no scale or shadow (feels more precise)
- **Cards**: Border color shift, background color shift
- **Icons**: Color shift from `--text-tertiary` to `--text-primary`
- **Inputs**: Border color shift, subtle background shift
- **Links**: Color shift to `--accent-primary`, optional underline
- **Pipeline steps**: Border appears, action icons (delete, duplicate) appear or become more visible
## Focus States
- **Visible focus ring**: 2px solid `--accent-primary`, offset 2px
- **Keyboard navigation**: All interactive elements must have visible focus
- **Focus vs hover**: Different styles — focus is ring, hover is background
## Active/Pressed States
- **Buttons**: Scale 0.98, background darkens
- **Cards**: Slight scale 0.99, border darkens
- **Sliders**: Thumb color intensifies
- **Transition**: `--transition-fast` (150ms)
## Selection States
- **Pipeline step**: Left accent bar (3px), border `--accent-primary`, background `--accent-primary-muted`
- **Operation in dropdown**: Background `--accent-primary-muted`, text `--accent-primary`
- **Button in group**: Background `--accent-primary-muted`, text `--accent-primary`, border `--accent-primary`
## Drag & Drop
- **Drag start**: Card lifts (scale 1.02, shadow `--shadow-lg`, opacity 0.9)
- **Drag over valid target**: Target slot shows border `--accent-primary`, background `--accent-primary-muted`
- **Drop**: Card snaps into place with spring transition `--transition-spring`
- **Reorder**: Other cards shift smoothly (transform translateY, 250ms)
## Loading/Processing States
- **Image processing**: Small overlay with spinner and "Processing..." text
- **OpenCV loading**: Status dot pulses, text shows "Loading..."
- **Pipeline application**: Brief "Processing..." on canvas when params change
## Transitions & Animations
- **Panel open/close**: Height or width transition, `--transition-medium` (250ms)
- **Modal open**: Fade in backdrop, slide up modal, `--transition-medium`
- **Toast**: Slide up from bottom, `--transition-medium`
- **Step add/remove**: Height animation with opacity, `--transition-medium`
- **Step reorder**: Transform translateY, `--transition-spring` (300ms, bouncy)
- **Image load**: Fade in, `--transition-slow` (350ms)
- **Code expand**: Height transition, `--transition-medium`
- **Value change**: Number briefly flashes `--accent-primary` then fades back, `--transition-fast`
## Keyboard Shortcuts (Optional, for Power Users)
- **Tab**: Toggle before/after view
- **Delete / Backspace**: Remove selected pipeline step
- **Ctrl/Cmd + D**: Duplicate selected step
- **Ctrl/Cmd + Z**: Undo last action
- **Ctrl/Cmd + Shift + Z**: Redo
- **Ctrl/Cmd + E**: Export JSON
- **Ctrl/Cmd + I**: Import JSON
- **Arrow keys**: Adjust selected parameter (when slider focused)
- **Shift + Arrow**: Coarse parameter adjustment
## Responsive Behavior
### Desktop (1280px+)
- Full three-panel layout
- Left panel: 280px
- Right panel: 320px
- Canvas: Flexible
### Tablet (768px - 1279px)
- Left panel: 240px (narrower)
- Right panel: Collapsible, overlay on canvas when open
- Canvas: Larger
- Touch targets: minimum 44px
### Mobile (< 768px)
- Single panel view
- Bottom tab bar: "Pipeline", "Image", "Params"
- Pipeline as bottom sheet
- Image full-screen
- Params as bottom sheet when step selected
- Hide Python code by default

***
# Design System Summary
## Color Tokens
- 10 surface tokens (bg-base through bg-canvas-overlay)
- 4 border tokens (subtle through accent)
- 7 text tokens (primary through code-function)
- 9 accent tokens (primary through success)
- 3 status tokens (ready, loading, error)
## Typography Tokens
- 8 size tokens (2xs through xl)
- 2 font families (Inter/Geist + JetBrains Mono)
- 4 weight levels (400, 500, 600)
- Tabular numbers for all numeric displays
## Spacing Tokens
- 10 space tokens (1 through 12)
- 5 layout spacing rules (gutter, panel, section, group, control)
## Radius Tokens
- 5 radius tokens (none through full)
- Contextual rules (panels sharp, buttons rounded, cards medium)
## Shadow Tokens
- 5 shadow tokens (none through xl)
- Elevation-only usage
## Transition Tokens
- 4 transition tokens (fast through spring)
- Performance rules (only transform, opacity, color)

***
# Build Prompt
## Context
You are redesigning the UI for Opsis v0.5, an image processing pipeline builder. The core functionality is already working (pipeline operations, live preview, Python code generation, JSON import/export). Your task is to apply the visual design system and layout architecture described above.
## Files to Modify
- `src/App.jsx` — Main layout structure, header, three-zone workspace
- `src/App.css` or `src/index.css` — Global design system, CSS variables
- `src/components/ControlsPanel.jsx` — Left panel, pipeline stack, operation selector
- `src/components/CanvasPanel.jsx` — Center canvas, image display, before/after (new or modify existing)
- `src/components/InspectorPanel.jsx` — Right panel, parameter editing (new component)
- `src/components/CodePanel.jsx` — Python code display (modify or new)
- `src/components/PipelineStep.jsx` — Individual pipeline step card (new or modify)
- `src/components/Header.jsx` — App header (new component)
## Constraints
- **Do NOT modify** `src/processor.js` or `src/codegen.js` unless absolutely necessary for UI integration.
- **Do NOT change** any operation logic, parameter ranges, or OpenCV behavior.
- **Preserve all existing functionality** — pipeline operations, live preview, code generation, JSON import/export.
- **Keep operation IDs** exactly as they are in the current codebase.
- **Use CSS variables** for all colors, spacing, typography — do not hardcode values.
- **Fonts**: Use Inter (or Geist) from Google Fonts / Fontshare. Use JetBrains Mono from Google Fonts.
## Implementation Order
1. **Design System Setup**: Create CSS variables in `src/index.css` (or `App.css`). Include all tokens from the design system.
2. **Header**: Create `Header.jsx` with app name, status, image info, global actions.
3. **Layout Structure**: Restructure `App.jsx` into three-zone layout with left panel (280px), center canvas (flexible), right panel (320px). Use CSS Grid.
4. **Left Panel**: Redesign `ControlsPanel.jsx` with:
   - Compact upload area
   - Operation selector dropdown
   - Add Step button
   - Pipeline stack with reorderable cards
   - Undo/Reset
   - JSON export/import
5. **Center Canvas**: Create/modify `CanvasPanel.jsx` with:
   - Dark canvas background
   - Image display with padding
   - Empty state
   - Before/after toggle (buttons or split view)
   - Zoom controls (floating)
   - Processing indicator
6. **Right Inspector**: Create `InspectorPanel.jsx` with:
   - Selected step info
   - Parameter controls (sliders, inputs, dropdowns, toggles, button groups)
   - Generated Python code preview (collapsible)
   - Copy button
7. **Footer**: Add collapsible Python code panel at bottom.
8. **Pipeline Step Card**: Create `PipelineStep.jsx` with:
   - Number, name, parameter summary
   - Drag handle, delete, duplicate buttons
   - Hover, selected, dragging states
   - Reorder behavior (drag and drop or move up/down buttons)
9. **Modals**: Import/export modals, error toast.
10. **Polish**: Add transitions, hover states, focus states, loading states. Ensure keyboard navigation. Test at 1280px+.
## Visual Requirements
- Dark graphite surfaces, not pure black
- One accent color (sky blue `#0ea5e9`) used sparingly
- Clean typography hierarchy (Inter + JetBrains Mono)
- Image is the visual center
- Pipeline steps feel like blocks, not form fields
- No neon gradients, no glassmorphism, no colored side borders, no AI aesthetic clichés
- Surfaces create depth through color, not shadows
- Strong focus on functionality over decoration
## Testing Checklist
- [ ] Header shows app name, status, image info
- [ ] Left panel has upload, operation selector, add step, pipeline stack
- [ ] Pipeline steps are reorderable
- [ ] Pipeline steps show parameters
- [ ] Pipeline steps can be deleted and duplicated
- [ ] Clicking a step selects it and shows parameters in right panel
- [ ] Right panel shows parameter controls for selected step
- [ ] Parameter changes update live preview
- [ ] Parameter changes update generated Python code
- [ ] Center canvas shows image with dark background
- [ ] Before/after toggle works
- [ ] Empty state is clear when no image
- [ ] JSON export works
- [ ] JSON import works
- [ ] Python code panel is accessible
- [ ] All hover, focus, active states are visible
- [ ] No layout breaks at 1280px+
- [ ] No pure black (#000000) backgrounds
- [ ] One accent color only, used sparingly
- [ ] Typography is clean and readable
- [ ] Image is the dominant visual element
## Output
Dont return Entire file in the chat . Replace entire files. Do not output diffs.