# Information Architecture

Organizing, structuring, and labeling content so users can find what they need and understand where they are.

## Core Principle

**If users can't find it, it doesn't exist.** The best content in the world is worthless behind poor navigation, ambiguous labels, or buried hierarchies.

## Foundational Concepts (Rosenfeld & Morville)

Information architecture addresses four core systems:

```markdown
1. Organization Systems — How content is grouped and categorized
2. Labeling Systems — How content is named and described
3. Navigation Systems — How users move through content
4. Search Systems — How users query and filter content
```

## Mental Models (Indi Young)

Design information structures that match how users think, not how the organization is structured.

```markdown
Rule: Users don't care about your org chart.

Process:
1. Interview users about their tasks and thought processes
2. Map their mental model of the domain
3. Identify gaps between their model and your structure
4. Align your IA to their model, not the other way around

Example:
  Internal structure: Products → Enterprise → SMB → Consumer
  User mental model: "I need a tool that does X for a team of Y"
  → Organize by use case and team size, not by business segment
```

## Miller's Law

Users can hold approximately 4 items (revised from 7 +/- 2) in working memory at once.

```markdown
Application:
- Limit primary navigation to 4-7 items
- Chunk related content into meaningful groups
- Use progressive disclosure to manage complexity
- Avoid menus deeper than 3 levels
```

## Card Sorting

Discover how users naturally group and label content.

```markdown
Open Card Sort:
- Give users content cards with no predefined categories
- They create and name their own groups
- Use when building IA from scratch
- Minimum 15 participants for reliable patterns

Closed Card Sort:
- Provide predefined categories
- Users sort content into those categories
- Use to validate an existing IA structure
- Identify content that users can't confidently place

Hybrid Card Sort:
- Provide some categories, allow users to create new ones
- Best of both worlds for iterative refinement

Analysis:
- Look for agreement rates > 60% for confident groupings
- Items with low agreement need relabeling or restructuring
- Dendrogram analysis reveals natural clusters
```

## Tree Testing

Validate whether users can find items in a proposed hierarchy without visual design influence.

```markdown
Process:
1. Create a text-only tree of your proposed navigation
2. Give users tasks: "Where would you find X?"
3. Measure success rate, directness, and time to complete

Metrics:
- Task success rate > 80% = strong IA
- Directness score > 70% = clear paths (users didn't backtrack)
- First-click correctness > 60% = good top-level labeling

Rules:
- Test before visual design (eliminates bias from layout/color)
- 50+ participants for statistical reliability
- Test with realistic tasks, not "find the About page"
```

## Navigation Patterns

### Primary Navigation

```markdown
Types:
- Top bar: Best for 4-7 top-level items (web)
- Sidebar: Best for 8+ items or deep hierarchies (apps, dashboards)
- Bottom tab bar: Best for 3-5 core actions (mobile)
- Hamburger menu: Last resort — hides everything, reduces discoverability

Rules:
- Current location must always be visible
- Navigation labels should be nouns (what it is), not verbs (what you do)
- Icon + label > icon alone (icons are ambiguous without labels)
```

### Breadcrumbs

```markdown
Use when:
- Hierarchy is 3+ levels deep
- Users may land on deep pages from search
- Users need to understand their location in context

Don't use when:
- Navigation is flat (1-2 levels)
- Site is task-based rather than content-based
```

### Search

```markdown
Search is not a replacement for good navigation — it's a supplement.

Requirements:
- Autocomplete suggestions after 2+ characters
- Fuzzy matching for typos
- Recent searches for returning users
- Scoped search within current section
- Clear indication of result count and relevance
- Empty state with helpful suggestions
```

## Sitemaps and User Flows

### Sitemaps

```markdown
Purpose: Document the complete content structure
Format: Hierarchical tree diagram

Rules:
- Include every page/screen
- Label with user-facing names (not internal codenames)
- Mark authenticated vs. public areas
- Version and date every sitemap
- Update when IA changes
```

### User Flows

```markdown
Purpose: Document paths users take to complete tasks
Format: Flowchart with decision points

Rules:
- Start with the user's goal, not your homepage
- Include error paths and edge cases
- Mark decision points clearly
- Note where users enter from (deep links, search, referrals)
- Validate flows against analytics data
```

## Labeling

```markdown
Rules:
- Use the user's language, not internal jargon
- Be specific: "Order History" > "History"
- Be consistent: Don't call it "Settings" in one place and "Preferences" in another
- Test labels with tree testing or first-click testing
- Avoid clever or branded terms for navigation (users don't know your brand vocabulary)
```

## Anti-Patterns

```markdown
- Org-chart navigation: Structuring IA to match internal departments
- Jargon labels: Using internal terminology users don't recognize
- Deep nesting: Burying content 4+ levels deep
- Orphan pages: Content reachable only through search, not navigation
- Mega-menu overload: Dumping every link into a massive dropdown
- Mystery meat navigation: Icons without labels, hover-only reveals
```
