# Research Assistant Development Guide

Principal-level guidelines for world-class research capabilities including advanced search strategies, source evaluation, information synthesis, and rigorous attribution practices.

---

## Overview

This guide applies to:

- Finding hard-to-locate information through advanced search techniques
- Evaluating source credibility and detecting bias
- Conducting research across academic, investigative, market, and technical domains
- Synthesizing disparate findings into coherent understanding
- Proper citation and attribution for research integrity
- OSINT (Open Source Intelligence) techniques
- Fact-checking and claim verification

### Key Principles

1. **Source Triangulation** - Never trust a single source; corroborate across at least 3 independent sources
2. **Primary Over Secondary** - Prefer original documents, data, and firsthand accounts over summaries
3. **Recency Matters** - Check publication dates; information decays and contexts change
4. **Follow the Money** - Understand who benefits from information being presented a certain way
5. **Epistemic Humility** - Distinguish what you know, what you believe, and what you're uncertain about
6. **Trail Documentation** - Always document your search path so findings can be verified

### Core Frameworks

| Framework | Purpose |
|-----------|---------|
| CRAAP Test | Evaluate Currency, Relevance, Authority, Accuracy, Purpose |
| Source Triangulation | Corroborate claims across multiple independent sources |
| OSINT Methodology | Systematic open source intelligence gathering |
| Argument Mapping | Visualize evidence supporting and contradicting claims |
| Confidence Calibration | Assign and communicate appropriate certainty levels |
| Citation Trail | Document research path for reproducibility |

---

## Search Mastery

### Advanced Search Operators

```text
# Essential Google Operators
"exact phrase"          Match exact words in order
site:domain.com         Search within specific domain
-term                   Exclude term from results
OR                      Either term matches
*                       Wildcard for unknown words
filetype:pdf            Specific file format
intitle:keyword         Term must be in page title
before:YYYY-MM-DD       Results before date
after:YYYY-MM-DD        Results after date

# Power Combinations
site:gov filetype:pdf "annual report" "climate change"
"machine learning" site:edu -site:wikipedia.org
"company name" (site:reuters.com OR site:bloomberg.com) after:2025-01-01
```

### Search Source Hierarchy

| Source Type | Examples | Best For |
|-------------|----------|----------|
| Academic Databases | Google Scholar, PubMed, JSTOR | Peer-reviewed research |
| Government Sources | SEC EDGAR, Data.gov, PACER | Official records, filings |
| Wire Services | Reuters, AP, AFP | Breaking news, primary reporting |
| Trade Publications | Industry-specific | Specialized knowledge |
| Corporate Filings | 10-K, investor relations | Company information |
| Archived Content | Wayback Machine | Removed or changed content |

### Query Iteration Strategy

```text
Iteration 1: [broad topic]
Iteration 2: [topic] + [specific aspect]
Iteration 3: "exact phrase" + [specific aspect]
Iteration 4: "exact phrase" site:authoritative-domain
Iteration 5: "exact phrase" filetype:pdf after:2024
```

---

## Source Evaluation

### Credibility Tiers

| Tier | Description | Examples |
|------|-------------|----------|
| 1 - Primary | Original documents, firsthand accounts | Contracts, court records, raw data |
| 2 - High Secondary | Peer-reviewed, established journalism | Academic papers, wire services |
| 3 - General Secondary | Quality media, industry publications | Major newspapers, trade press |
| 4 - User-Generated | Social, blogs, forums | Wikipedia, Reddit, blog posts |
| 5 - Unreliable | Anonymous, heavily biased, outdated | Content farms, advocacy sites |

### CRAAP Test Quick Reference

| Criterion | Key Questions |
|-----------|---------------|
| **Currency** | When published? When updated? |
| **Relevance** | Does it address your question directly? |
| **Authority** | Who created it? What credentials? Conflicts of interest? |
| **Accuracy** | Evidence-based? Verifiable? Citations? |
| **Purpose** | Inform, sell, persuade, or entertain? |

### Bias Detection Checklist

- [ ] Loaded or emotional language?
- [ ] Missing counterarguments?
- [ ] Sources from single perspective?
- [ ] Funding or sponsorship disclosed?
- [ ] Author has stake in outcome?
- [ ] Claims exceed the evidence?

---

## Research Methodologies

### Methodology Selection

| Research Type | Key Methods | Typical Sources |
|---------------|-------------|-----------------|
| Academic | Literature review, systematic review | Journals, preprints, conferences |
| Investigative | Document analysis, FOIA, interviews | Primary documents, records |
| Market | Industry analysis, expert networks | Reports, filings, experts |
| Technical | Documentation review, experimentation | Docs, code, specifications |
| Due Diligence | Background checks, verification | Public records, references |

### OSINT Techniques

| Technique | Application |
|-----------|-------------|
| Social media analysis | Track individuals, organizations, events |
| Domain/IP research | Identify ownership (WHOIS, Shodan) |
| Image analysis | Verify photos (reverse image search) |
| Geolocation | Verify locations from images |
| Corporate records | Ownership, officers (OpenCorporates) |
| Archive research | Historical/deleted content (Wayback Machine) |

### Investigative Document Flow

```text
1. Identify what documents should exist
2. Determine who creates and holds them
3. Acquire via public records, FOIA, filings
4. Analyze for timeline, relationships, patterns
5. Fill gaps with interviews and additional requests
6. Verify and corroborate across sources
```

---

## Information Synthesis

### Synthesis Process

```text
1. Organize → Catalog sources, tag by topic and credibility
2. Pattern → Identify agreement, divergence, themes
3. Reconcile → Resolve or flag contradictions
4. Build → Construct evidence-based understanding
5. Validate → Seek disconfirming evidence
6. Communicate → Present with appropriate confidence
```

### Analysis Frameworks

**Argument Mapping:**
```text
Main Claim
├── Supporting Evidence 1
│   └── Sub-evidence
├── Supporting Evidence 2
├── Counter-evidence 1
│   └── Rebuttal
└── Counter-evidence 2 (unaddressed)
```

**Comparative Matrix:**
| Factor | Weight | Option A | Option B | Option C |
|--------|--------|----------|----------|----------|
| [Factor] | [1-5] | [Score] | [Score] | [Score] |

### Confidence Levels

| Level | Definition | Criteria |
|-------|------------|----------|
| High | Very likely true | 3+ independent quality sources agree |
| Medium | Probably true | 2+ sources agree, minor gaps |
| Low | Possibly true | Single source, conflicting evidence |
| Speculative | Unknown | No direct evidence, inference only |

---

## Citation and Attribution

### When to Cite

**Always cite:**
- Direct quotes
- Paraphrased ideas from specific sources
- Statistics and data
- Specific non-common-knowledge facts
- Others' images, charts, or frameworks

### Citation Elements

Minimum required:
- Author(s) or organization
- Title of work
- Publication date
- Access date (for web)
- URL or DOI

### Quick Formats

**Web Article:**
```
Author. "Title." Publication, Date. URL. Accessed Date.
```

**Academic Paper:**
```
Author. "Title." Journal Vol, no. Issue (Year): Pages. DOI.
```

**Government Report:**
```
Organization. "Title." Report Number, Date. URL.
```

---

## Research Output Template

```text
# Research Summary: [Topic]

## Key Findings
1. [Finding] (Confidence: High/Medium/Low)
2. [Finding] (Confidence: High/Medium/Low)
3. [Finding] (Confidence: High/Medium/Low)

## Evidence Summary
| Finding | Supporting Sources | Contradicting | Confidence |
|---------|-------------------|---------------|------------|
| | | | |

## Unresolved Questions
- [Question] - Why unresolved: [Reason]

## Limitations
- [Limitation]

## Recommendations
1. [Based on findings]
2. [Further research if needed]

## Sources
[Full citation list with credibility assessments]
```

---

## Common Pitfalls

### 1. Single-Source Reliance

Wrong: Accept first answer from one source.

Right: Corroborate across at least 3 independent sources before considering a claim verified.

### 2. Confirmation Bias

Wrong: Search only for evidence supporting your hypothesis.

Right: Actively seek disconfirming evidence. Assign red-team thinking to challenge conclusions.

### 3. Recency Bias

Wrong: Assume newer is always better.

Right: Historical sources contain primary evidence and foundational understanding that summaries miss.

### 4. Authority Fallacy

Wrong: Accept claims because source is prestigious.

Right: Verify specific claims regardless of source reputation. Even experts make errors.

### 5. Source Laundering

Wrong: Accept claim because multiple outlets report it.

Right: Trace to original source. Multiple outlets may all cite the same unverified original.

### 6. Overconfidence

Wrong: Present findings with more certainty than evidence supports.

Right: Explicitly state confidence levels and what could change your conclusion.

---

## Resources

- [Google Advanced Search](https://www.google.com/advanced_search)
- [Google Scholar](https://scholar.google.com/)
- [Wayback Machine](https://archive.org/web/)
- [PACER](https://pacer.uscourts.gov/) (Federal court records)
- [SEC EDGAR](https://www.sec.gov/edgar) (Corporate filings)
- [OpenCorporates](https://opencorporates.com/) (Company data)
- [Snopes](https://www.snopes.com/) / [PolitiFact](https://www.politifact.com/) (Fact-checking)
- [Media Bias/Fact Check](https://mediabiasfactcheck.com/) (Publication bias ratings)
- [Semantic Scholar](https://www.semanticscholar.org/) (AI-powered academic search)
- [OSINT Framework](https://osintframework.com/) (OSINT tools collection)
