# SportShare Design System Documentation

This document outlines the comprehensive design system used in the SportShare platform, with a focus on the dark mode design. This system can be replicated across other platforms to maintain consistent branding and user experience.

## 🎨 Color Palette

### Base Colors (Dark Mode)

| Variable | HSL Value | Hex Equivalent | Usage |
|----------|-----------|----------------|-------|
| Background | 0 0% 9% | #171717 | Main background color |
| Foreground | 210 40% 98% | #F5FAFF | Primary text color |
| Card | 0 0% 13% | #212121 | Card and container backgrounds |
| Card Foreground | 210 40% 98% | #F5FAFF | Text on cards |
| Muted | 0 0% 15% | #262626 | Less prominent backgrounds |
| Muted Foreground | 0 0% 63% | #A1A1A1 | Secondary text color |
| Border | 0 0% 20% | #333333 | Border elements |

### Brand Colors

| Variable | HSL Value | Hex Equivalent | Description |
|----------|-----------|----------------|-------------|
| Primary | 92 98% 41% | #58CC02 | Vibrant green, primary brand color |
| Primary Foreground | 0 0% 0% | #000000 | Text on primary backgrounds |
| Secondary | 202 94% 48% | #1CB0F6 | Bright blue, complementary action color |
| Secondary Foreground | 0 0% 0% | #000000 | Text on secondary backgrounds |
| Accent | 35 100% 50% | #FF9600 | Orange accent for highlights and attention |
| Accent Foreground | 0 0% 0% | #000000 | Text on accent backgrounds |
| Destructive | 0 62.8% 30.6% | #7D1A1A | Error and warning states |
| Destructive Foreground | 210 40% 98% | #F5FAFF | Text on destructive backgrounds |

### Color Application Guidelines

1. **Primary (Green)**: Use for primary actions, main CTAs, and brand identifiers
2. **Secondary (Blue)**: Use for secondary actions, illustrations, progress indicators
3. **Accent (Orange)**: Use sparingly for highlights, badges, and special features
4. **Dark backgrounds** with light text for improved readability in dark mode
5. **Color opacity variations**: 
   - Strong UI elements: 100%
   - Medium emphasis: 70-80% 
   - Subtle backgrounds: 5-20%

## 🔠 Typography

The design system uses a clean, modern sans-serif font stack.

### Font Stack
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Text Sizes

| Size | Value | Usage |
|------|-------|-------|
| xs | 0.75rem (12px) | Very small text, labels |
| sm | 0.875rem (14px) | Small text, secondary information |
| base | 1rem (16px) | Body text, default size |
| lg | 1.125rem (18px) | Slightly emphasized text |
| xl | 1.25rem (20px) | Subheadings |
| 2xl | 1.5rem (24px) | Minor headings |
| 3xl | 1.875rem (30px) | Section headings |
| 4xl | 2.25rem (36px) | Major headings |
| 5xl | 3rem (48px) | Hero headings |
| 6xl | 3.75rem (60px) | Display headings |

### Text Styles

- **Gradient Text**: Used for special headings and important content
- **Animated Gradient Text**: Used for hero sections and primary calls-to-action
- **Font Weights**: Bold (700) for headings, Medium (500) for subheadings, Regular (400) for body text

## 📐 Spacing & Layout

### Border Radius

| Variable | Value | Usage |
|----------|-------|-------|
| radius-sm | 0.5rem (8px) | Small elements like buttons |
| radius-md | 1rem (16px) | Medium elements like input fields |
| radius-lg | 1.5rem (24px) | Large elements like cards |
| radius-xl | 2rem (32px) | Extra large elements like modals |

### Section Spacing

- **Container**: Centered content with responsive padding
- **Vertical spacing**: 
  - Small sections: 2rem (32px)
  - Medium sections: 4rem (64px)
  - Large sections: 6rem (96px)
- **Component spacing**: 
  - Tight: 0.5rem (8px)
  - Default: 1rem (16px)
  - Loose: 1.5rem (24px)

### Layout Patterns

- **Overlapping sections**: Using negative margins to create depth
- **Card grid systems**: Using responsive grid layouts
- **Layered sections**: Z-index management for depth perception

## 📦 Elevation System

### Shadow Levels

| Level | Value | Usage |
|-------|-------|-------|
| Subtle | 0px 2px 4px rgba(0, 0, 0, 0.2) | Slight elevation, buttons, cards at rest |
| Medium | 0px 4px 8px rgba(0, 0, 0, 0.25) | Medium elevation, hovering elements, active cards |
| Prominent | 0px 8px 16px rgba(0, 0, 0, 0.3) | Highest elevation, modals, popovers, focus states |

### Special Elevation Effects

- **Primary Elevation**: `0 4px 14px rgba(88, 204, 2, 0.25)` - Green glow for primary elements
- **Secondary Elevation**: `0 4px 14px rgba(28, 176, 246, 0.25)` - Blue glow for secondary elements
- **Accent Elevation**: `0 4px 14px rgba(255, 150, 0, 0.25)` - Orange glow for accent elements

## 🎬 Animations & Transitions

### Timing Variables

| Variable | Value | Usage |
|----------|-------|-------|
| Duration Fast | 0.3s | Quick transitions, button states |
| Duration Medium | 0.6s | Standard transitions, card hovers |
| Duration Slow | 1s | Elaborate animations, page transitions |

### Animation Patterns

- **Float**: Gentle up and down movement for highlighting elements
- **Pulse**: Opacity changes for drawing attention
- **Spin**: Rotation for loading indicators and icons
- **Scale**: Size changes for hover effects

### Predefined Animations

```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes scale {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

## 🧩 Component Styles

### Buttons

```css
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
}

.app-button:hover {
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.25);
  transform: translateY(-2px);
}

.app-button:active {
  transform: translateY(0);
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
}

.app-button-primary {
  background-color: hsl(92, 98%, 41%);
  color: black;
}

.app-button-secondary {
  background-color: hsl(202, 94%, 48%);
  color: black;
}

.app-button-accent {
  background-color: hsl(35, 100%, 50%);
  color: black;
}
```

### Cards

```css
.app-card {
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: hsl(0, 0%, 13%);
  padding: 1.5rem;
  transition: all 0.6s;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
}

.app-card:hover {
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.25);
  transform: translateY(-2px);
}

.app-card-primary {
  border-color: hsla(92, 98%, 41%, 0.2);
  background-color: hsla(92, 98%, 41%, 0.05);
}

.app-card-secondary {
  border-color: hsla(202, 94%, 48%, 0.2);
  background-color: hsla(202, 94%, 48%, 0.05);
}

.app-card-accent {
  border-color: hsla(35, 100%, 50%, 0.2);
  background-color: hsla(35, 100%, 50%, 0.05);
}
```

## 🎭 Special Effects

### Glass Effect

```css
.glass-effect {
  background-color: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### 3D Effects

```css
.effect-3d {
  perspective: 1000px;
  transform-style: preserve-3d;
}

.effect-3d-child {
  transition: transform 0.6s;
}

.effect-3d:hover .effect-3d-child {
  transform: translateZ(20px);
}
```

### Depth Effects

```css
.depth-effect-wrapper {
  position: relative;
  perspective: 1000px;
}

.depth-effect-image {
  position: relative;
  z-index: 2;
  transition: transform 0.6s;
}

.depth-effect-shadow {
  position: absolute;
  top: 10%;
  left: 10%;
  width: 80%;
  height: 80%;
  border-radius: inherit;
  background: black;
  opacity: 0.2;
  filter: blur(15px);
  z-index: 1;
  transform: translateZ(-30px);
  transition: all 0.6s;
}
```

### Gradient Text Effects

```css
.gradient-text {
  background: linear-gradient(90deg, #58cc02 0%, #76d639 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gradient-text-blue {
  background: linear-gradient(90deg, #1cb0f6 0%, #64c9fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gradient-text-orange {
  background: linear-gradient(90deg, #ff9600 0%, #ffae33 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gradient-text-animated {
  background: linear-gradient(90deg, #58cc02, #1cb0f6, #ff9600, #58cc02);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 8s ease infinite;
}
```

### Background Patterns

```css
.sports-pattern {
  background-color: #171717;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2358CC02' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.sports-pattern-enhanced {
  background-color: #171717;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2358CC02' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"),
    radial-gradient(circle at 25% 25%, rgba(28, 176, 246, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(255, 150, 0, 0.05) 0%, transparent 50%);
}
```

### Blob Effects

```css
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.5;
  animation: blob-pulse 8s ease-in-out infinite;
  z-index: 0;
  pointer-events: none;
}

@keyframes blob-pulse {
  0%, 100% {
    transform: scale(1) translate(0, 0);
    opacity: 0.5;
  }
  33% {
    transform: scale(1.1) translate(10px, -10px);
    opacity: 0.6;
  }
  66% {
    transform: scale(0.9) translate(-10px, 10px);
    opacity: 0.4;
  }
}
```

## 📱 Responsive Design

### Breakpoints

| Breakpoint | Value | Description |
|------------|-------|-------------|
| xs | < 640px | Mobile phones |
| sm | ≥ 640px | Large phones, small tablets |
| md | ≥ 768px | Tablets, small laptops |
| lg | ≥ 1024px | Laptops, desktops |
| xl | ≥ 1280px | Large desktops |
| 2xl | ≥ 1536px | Extra large screens |

### Responsive Patterns

1. **Mobile First**: Design for mobile, then enhance for larger screens
2. **Fluid Typography**: Text scales smoothly across viewports
3. **Flexible Layouts**: Grid and Flexbox for responsive layouts
4. **Appropriate Touch Targets**: Minimum 44px × 44px for interactive elements on mobile
5. **Conditional UI**: Show/hide elements based on screen size

## 🌓 Dark Mode Best Practices

1. **Reduce Brightness**: Dark backgrounds with less luminance (HSL values with low lightness)
2. **Lower Contrast for Large Text**: 50-70% opacity for large blocks of text
3. **Increase Vibrancy**: Slightly more saturated accent colors to pop against dark backgrounds
4. **Reduce White Space**: Use more subtle dividers and borders
5. **Use Shadows Carefully**: Subtle shadows work better in dark mode
6. **Emissive Colors**: Make interactive elements appear to emit light
7. **Depth with Layers**: Use subtle background color differences to indicate layers

## 🔍 Accessibility Guidelines

1. **Color Contrast**: Maintain WCAG 2.1 AA standard (4.5:1 for normal text)
2. **Focus States**: Clearly visible focus indicators for keyboard navigation
3. **Text Scaling**: UI works when text is scaled up to 200%
4. **Alternative Text**: For all images and icons
5. **Semantic HTML**: Use appropriate HTML elements
6. **Keyboard Navigation**: All interactive elements accessible via keyboard
7. **Touch Target Size**: Minimum 44px × 44px for interactive elements on mobile

---

*This design system documentation is based on the SportShare platform. Implementing these guidelines will help maintain a consistent look and feel across different platforms and applications.* 