# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

钝学推免指南 (Literature Graduate Recommendation Dashboard) - A comprehensive platform for 985/211 universities' Chinese literature graduate admission-free (推免) information. Aggregates data from 62 top universities with tier-based classification and intelligent matching.

**Tech Stack**: React 19, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui, Wouter, Express

## Development Commands

### Essential Commands
```bash
# Install dependencies (must use pnpm)
pnpm install

# Development server (runs on port 3000)
pnpm dev

# Type checking
pnpm check

# Build production
pnpm build

# Preview production build
pnpm preview

# Start production server
pnpm start

# Format code with Prettier
pnpm format

# Data quality validation
pnpm check:data
```

### Data Quality Checks
```bash
# Run data quality validation (critical before commits)
node scripts/check-data-quality.cjs

# Grade link quality
node scripts/grade-link-quality.js

# Migrate data to v1.1 structure
node scripts/migrate-to-v1.1.js
```

## Architecture & Code Structure

### High-Level Architecture

The application uses a **client-server monorepo** with shared types:

- **client/**: React SPA with Vite
- **server/**: Express static server (minimal, mainly for production)
- **shared/**: Shared constants and types
- **scripts/**: Data quality validation and migration tools

### Data Flow Architecture

```
universities.json (Schema v1 or v1.1)
  ↓
dataLoader.ts (Schema detection & flattening)
  ↓
University[] (v1 compatible format)
  ↓
React Components
```

**Key Insight**: The app supports two schema versions (v1 flat, v1.1 nested), but `dataLoader.ts` automatically flattens v1.1 to v1-compatible format for backward compatibility.

### Directory Structure

```
client/src/
  ├── components/     # UI components
  │   ├── ui/        # shadcn/ui components (Radix UI wrappers)
  │   ├── Map.tsx    # University location map
  │   └── ...
  ├── contexts/      # React Context providers
  │   └── ThemeContext.tsx
  ├── data/          # Static data files
  │   └── universities.json  # Main data source
  ├── hooks/         # Custom React hooks
  │   ├── useComposition.ts  # Composition API pattern
  │   ├── useMobile.tsx      # Mobile detection
  │   └── usePersistFn.ts    # Persistent function reference
  ├── lib/           # Core utilities
  │   ├── dataLoader.ts      # Schema-aware data loading
  │   ├── matchingAlgorithm.ts  # University matching logic
  │   ├── storage.ts         # LocalStorage wrapper
  │   └── utils.ts
  ├── pages/         # Route pages
  │   ├── Home.tsx           # Main university list
  │   ├── Matcher.tsx        # Matching questionnaire
  │   ├── MatchResult.tsx    # Matching results
  │   └── NotFound.tsx
  ├── types/         # TypeScript type definitions
  │   ├── university.ts      # University data types
  │   └── userProfile.ts     # User profile types
  ├── App.tsx        # Root component with routing
  └── main.tsx       # Entry point
```

### Schema & Data Structure

**Current Schema**: v1 (with v1.1 support in progress)

**v1 Structure** (Flat):
```typescript
{
  schemaVersion: "v1",
  lastUpdated: "2026-01-16",
  universities: University[]  // Flat array
}
```

**v1.1 Structure** (Nested - School/Program/Notice):
```typescript
{
  schemaVersion: "v1.1",
  lastUpdated: "2026-01-16",
  universities: School[]  // Nested: School → Program[] → Notice[]
}
```

**Critical Fields** (v1):
- `id`, `name`, `tier` - Basic identification
- `specialty`, `degreeType` - Academic info
- `url` - Official notice link (most critical for quality)
- `applicationPeriod`, `deadline` - Timeline
- `examForm`, `englishRequirement` - Requirements
- `linkGrade` - Link quality (A/B/C/D)

### Tier Classification System

Five-tier system based on 教育部第四轮学科评估:

1. **第一梯队** (6 schools) - A+ universities (Peking, Tsinghua, etc.)
2. **第二梯队** (8 schools) - A/A- strong research universities
3. **第三梯队** (11 schools) - B+ solid academic universities
4. **第四梯队** (18 schools) - School-advantage type
5. **第五梯队** (19 schools) - Prestige-focused (理工科985)

### Link Quality Grading

**Four-tier system** (A/B/C/D):
- **A级**: Official notice page with 推免 keywords
- **B级**: Graduate school notice list page
- **C级**: School/department homepage
- **D级**: Third-party or invalid links

**Quality Targets**:
- Overall health: ≥ 90%
- D-grade links: 0
- Tier 1 A-grade ratio: 100%

### Path Aliases

Configured in `vite.config.ts`:
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

### Build Information

The build process injects commit hash and build time:
- `__BUILD_COMMIT__` - Git commit SHA (short)
- `__BUILD_TIME__` - Build timestamp (ISO 8601)

Available via `vite.config.ts` build info system.

## Key Technical Decisions

Reference: `docs/02_DECISIONS.md` for full decision log.

### D-001: Three-Layer Nested Structure (v1.1)
School → Program → Notice hierarchy supports multiple programs per school and historical notices. **Backward compatible** via `dataLoader.ts` flattening.

### D-002: A/B/C/D Link Quality Classification
Transparent quality metrics guide data maintenance priorities. A-grade required for top-tier schools.

### D-003: Year Protection Mechanism
`yearStatus` field prevents outdated notices from being graded A. Unverified years cannot receive A-grade.

### D-004: Stop-Loss Principle (达标即停)
Clear quality targets prevent perfectionism. Focus on core value (top-tier school quality).

### D-005: No Auto-Crawling (v1.1 Phase)
Manual data maintenance until schema stabilizes. Prevents rapid propagation of unstable structures.

### D-007: Project Goal - "Long-term Trusted, Low Maintenance"
Prioritize reliability and sustainability over feature completeness.

### D-008: Plan-First Workflow
Changes >3 files or >300 lines require written plan → review → execution.

## Data Maintenance

### Adding/Updating Universities

1. **Edit data file**: `client/src/data/universities.json`
2. **Follow schema**: Use v1 or v1.1 structure (see `docs/data/SCHEMA.md`)
3. **Critical**: Ensure `url` points to specific notice page, not homepage
4. **Run validation**: `pnpm check:data`
5. **Fix issues** until all checks pass
6. **Test locally**: `pnpm dev`
7. **Commit changes**

### Data Quality Standards

- **Required fields**: All fields marked ✅ in `docs/data/SCHEMA.md`
- **URL format**: Must be `https://` official notice pages
- **Date format**: `YYYY年MM月DD日` or `MM月DD日`
- **Tier values**: Must be one of 第一梯队 through 第五梯队
- **Link grade**: A/B/C/D based on URL quality

See `docs/data/NOTICE_GRADE_RULES.md` for detailed link grading rules.

## Development Workflow

### Before Committing

1. Run type check: `pnpm check`
2. Run data validation: `pnpm check:data`
3. Format code: `pnpm format`
4. Test locally: `pnpm dev`

### Code Style

- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks only
- **Formatting**: Prettier (auto-format on save recommended)
- **Naming**: camelCase for variables/functions, PascalCase for components

### Commit Conventions

Follow conventional commits:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation updates
- `style`: Code formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Build/tooling

## Important Implementation Notes

### Schema Compatibility Layer

`client/src/lib/dataLoader.ts` provides automatic schema detection and conversion:
- Detects v1 vs v1.1 via `schemaVersion` field
- Flattens v1.1 (School/Program/Notice) → v1 (University[]) automatically
- Use `universities` export for v1-compatible data
- Use `getSchools()` for v1.1-native structure access

### Matching Algorithm

Located in `client/src/lib/matchingAlgorithm.ts`. Uses multi-factor scoring:
- GPA/Ranking compatibility
- English requirement matching
- Tier-based recommendation
- Academic background alignment

### State Management

- **No Redux/MobX**: Uses React Context + hooks pattern
- **Theme**: `ThemeContext.tsx` for dark/light mode
- **Persistence**: `storage.ts` wrapper for localStorage

### Routing

Uses **Wouter** (lightweight React Router alternative):
- Configured in `App.tsx`
- Routes: `/` (Home), `/matcher` (Matcher), `/result` (Results), `*` (404)

## Common Tasks

### Adding a New UI Component

1. Use shadcn/ui CLI if it's a common pattern:
   ```bash
   npx shadcn-ui@latest add [component-name]
   ```
2. Or create in `client/src/components/`
3. Import from `@/components/...`

### Modifying the Matching Algorithm

Edit `client/src/lib/matchingAlgorithm.ts`. Key functions:
- `calculateMatch()` - Main scoring logic
- Consider tier weights, requirement thresholds

### Adding a New Page

1. Create `client/src/pages/NewPage.tsx`
2. Add route in `client/src/App.tsx`
3. Update navigation if needed

## Testing & Deployment

### Local Testing

```bash
pnpm dev  # Visit http://localhost:3000
```

### Production Build

```bash
pnpm build  # Outputs to dist/
pnpm preview  # Preview production build
```

### Vercel Deployment

- Auto-deploys from main branch
- Build command: `pnpm build`
- Output directory: `dist/public`
- See `docs/03-Plans/VERCEL_DEPLOYMENT_GUIDE.md` for details

## Documentation References

**Start Here**: `docs/00-INDEX.md` - Complete documentation navigation

**Essential Documentation** (always load these):
- `docs/01-Project/PROJECT_STATUS.md` - Project status and progress
- `docs/01-Project/DECISIONS.md` - Critical architectural decisions
- `docs/03-Plans/TODO.md` - Current TODO list

**Data Documentation** (load when working with data):
- `docs/02-Data/SCHEMA.md` - Data schema specifications (v1 and v1.1)
- `docs/02-Data/NOTICE_GRADE_RULES.md` - Link quality grading rules

**Archive** (do NOT auto-load, only when explicitly needed):
- `docs/99-Archive/` - Historical documents, implementation plans, reports

## Critical Constraints

1. **Always use pnpm** - Project uses pnpm-specific features (patches, overrides)
2. **Run data checks before commit** - Invalid data will break production
3. **Respect tier classification** - Based on official 学科评估, don't modify arbitrarily
4. **Link quality matters** - Top-tier schools must have A-grade links
5. **Schema version awareness** - Always check `schemaVersion` when editing data
