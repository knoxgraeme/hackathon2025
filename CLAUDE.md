# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.4.1 application using the App Router architecture with TypeScript and Tailwind CSS v4.

## Essential Commands

```bash
# Development
npm run dev       # Start development server on http://localhost:3000

# Building
npm run build     # Create production build
npm run start     # Start production server

# Code Quality
npm run lint      # Run ESLint
```

## Architecture & Structure

### App Router Structure
- `/app` - Next.js App Router directory (not `/src/app`)
  - `layout.tsx` - Root layout with HTML structure and font configuration
  - `page.tsx` - Page components
  - `globals.css` - Global styles with Tailwind imports

### Key Technologies
- **Next.js 15.4.1** with App Router
- **React 19.1.0**
- **TypeScript 5** with strict mode
- **Tailwind CSS v4** (new architecture with PostCSS)
- **ESLint 9** with Next.js config

### Important Configuration
- TypeScript path alias: `@/*` maps to `./src/*`
- Fonts: Geist Sans and Geist Mono via next/font
- CSS: Tailwind v4 with CSS variables for theming

## Development Guidelines

When creating new components or pages:
1. Place pages in `/app` directory following Next.js App Router conventions
2. Use TypeScript for all new files
3. Follow existing Tailwind CSS patterns (utility classes, CSS variables for theming)
4. Maintain the existing font configuration using next/font

When running commands:
- Always run `npm run lint` after making changes to ensure code quality
- Use `npm run build` to verify production builds before committing major changes