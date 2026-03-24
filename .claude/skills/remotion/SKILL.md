---
name: remotion
description: Create product videos, animations, and multimedia content using Remotion (React-based video framework). Use when building demo videos, product walkthroughs, animated explainers, or promotional clips.
allowed-tools: Bash(npm *), Bash(npx *), Write, Read, Edit, Glob, Grep
argument-hint: [video-description]
---

# Remotion Product Video Creator

Create high-quality animated product videos using Remotion, a programmatic video framework built on React.

## Setup

If Remotion is not yet installed in the project, set it up:

```bash
npm install remotion @remotion/cli @remotion/bundler
```

Create the video source directory at `src/remotion/` with this structure:

```
src/remotion/
├── compositions/     # Video compositions (each is a React component)
├── components/       # Reusable animated elements (text, transitions, etc.)
├── assets/           # Static images, audio, fonts
├── Root.tsx          # Root component registering all compositions
└── index.ts          # Entry point
```

## Creating a Composition

Each video is a React component registered as a Remotion `<Composition>`:

1. Create a new component in `src/remotion/compositions/`
2. Use `useCurrentFrame()` to drive animations frame-by-frame
3. Use `useVideoConfig()` to access fps, width, height, durationInFrames
4. Use `interpolate()` for smooth value transitions between keyframes
5. Use `spring()` for natural physics-based animations
6. Use `<Sequence>` to arrange clips on a timeline
7. Use `<AbsoluteFill>` for full-frame layered layouts

## Common Video Types

### Product Demo
- Screen recordings overlaid with animated callouts
- Highlight features with zoom effects and pointer animations
- Add text overlays explaining each feature

### Animated Explainer
- Step-by-step animated sequences
- Use `<Sequence>` for scene transitions
- Combine text, icons, and motion graphics

### Promotional Clip
- Bold typography with kinetic text animations
- Brand colors and logo animations
- Call-to-action end screens

## Rendering

Preview in the browser:
```bash
npx remotion studio src/remotion/index.ts
```

Render to MP4:
```bash
npx remotion render src/remotion/index.ts <CompositionId> out/video.mp4
```

Render a still frame:
```bash
npx remotion still src/remotion/index.ts <CompositionId> out/thumbnail.png --frame=0
```

## Best Practices

- Use 1920x1080 resolution at 30fps for standard product videos
- Keep videos under 60 seconds for social media
- Use `spring()` for UI element animations (feels natural)
- Use `interpolate()` for precise control over timing
- Organize reusable motion patterns in `src/remotion/components/`
- Export props schemas with `zod` for dynamic video generation
- Use `<Audio>` and `<Video>` components for media embedding

## Key Remotion APIs

| API | Purpose |
|-----|---------|
| `useCurrentFrame()` | Get current frame number |
| `useVideoConfig()` | Get fps, width, height, duration |
| `interpolate(frame, inputRange, outputRange)` | Map frame to animated values |
| `spring({ frame, fps, config })` | Physics-based easing |
| `<Sequence from={frame} durationInFrames={n}>` | Timeline clip |
| `<AbsoluteFill>` | Full-frame container |
| `<Img>`, `<Audio>`, `<Video>` | Media components |
| `<Series>` | Sequential clip arrangement |

## Arguments

If invoked with arguments, treat `$ARGUMENTS` as the video description and create a complete composition matching that description.
