---
name: network-jobs
description: Find jobs where you're already connected. Search openings at companies where you have potential intros through your personal network - skip the cold apply. Use when searching for jobs, checking company connections, or exploring career opportunities.
license: MIT
allowed-tools: Bash(curl:*) Bash(jq:*)
metadata:
  version: "2.0.4"
---

# Network Jobs

Search job openings at companies where you have connections through your personal network.

## Configuration

- **BASE_URL**: `https://jobs.hirefrank.com`
- **ADVISOR_SLUG**: `hirefrank` (default, use a different slug only if explicitly mentioned)

## Fetching Data

Data is hosted at jobs.hirefrank.com. Fetch files directly:

```bash
# Fetch any file
curl -s "https://jobs.hirefrank.com/{ADVISOR_SLUG}/{file}.json"

# Examples
curl -s "https://jobs.hirefrank.com/hirefrank/advisor.json"
curl -s "https://jobs.hirefrank.com/hirefrank/manifest.json"
curl -s "https://jobs.hirefrank.com/hirefrank/engineering.json"
curl -s "https://jobs.hirefrank.com/hirefrank/product-nyc-senior.json"
```

## Data Schema

### advisor.json
```json
{
  "name": "Frank Miller",
  "slug": "hirefrank",
  "email": "frank@example.com",
  "title": "VP Engineering",
  "company": "Acme Corp",
  "url": "https://linkedin.com/in/frankmiller"
}
```

### manifest.json
```json
{
  "advisorSlug": "hirefrank",
  "lastUpdated": "2026-01-09T22:30:00Z",
  "totalJobs": 430,
  "categories": {
    "product": {
      "count": 679,
      "file": "product.json",
      "byLocation": {
        "nyc": { "senior": { "count": 71, "file": "product-nyc-senior.json" }, "mid": { "count": 59, "file": "product-nyc-mid.json" } },
        "sf": { "senior": { "count": 66, "file": "product-sf-senior.json" }, "mid": { "count": 79, "file": "product-sf-mid.json" } },
        "remote": { "senior": { "count": 82, "file": "product-remote-senior.json" }, "mid": { "count": 53, "file": "product-remote-mid.json" } },
        "other": { "senior": { "count": 97, "file": "product-other-senior.json" }, "mid": { "count": 172, "file": "product-other-mid.json" } }
      }
    }
  }
}
```

**Location buckets:** `nyc` (New York), `sf` (San Francisco/Bay Area), `remote`, `other`
**Seniority buckets:** `senior` (Senior, Staff, Principal, Lead, Director, VP), `mid` (everything else)

### Category Files (e.g., engineering.json)
```json
[
  {
    "id": 123,
    "title": "Senior Backend Engineer",
    "company": "Stripe",
    "companyDomain": "stripe.com",
    "department": "Developer Infrastructure",
    "category": "engineering",
    "location": "San Francisco, CA",
    "url": "https://stripe.com/jobs/123",
    "salary": { "min": 180000, "max": 250000 },
    "postedAt": "2025-12-15T00:00:00Z",
    "firstSeen": "2026-01-01",
    "lastSeen": "2026-01-09"
  }
]
```

**Date fields:**
- `postedAt`: When the job was originally posted (from ATS). Use this for freshness display.
- `firstSeen`: When we first discovered the job (fallback if `postedAt` is missing)
- `lastSeen`: Last time the job was confirmed still open

## Categories

`engineering` | `product` | `design` | `data` | `ai-ml` | `sales` | `marketing` | `customer-success` | `operations` | `finance` | `people` | `legal` | `it-security` | `retail` | `other`

For detailed category mapping (which user queries map to which category), see [reference.md](reference.md).

## Procedures

**First step for all patterns:** Fetch advisor info:
```bash
curl -s "https://jobs.hirefrank.com/hirefrank/advisor.json"
```

### Pattern A: "Do I have connections at [Company]?"
1. **Fetch Manifest**:
   ```bash
   curl -s "https://jobs.hirefrank.com/hirefrank/manifest.json"
   ```
2. **Fetch Categories**: Download relevant category files (or all if unsure)
3. **Search**: Filter where `company` matches (case-insensitive)
4. **Report**:
   - Found: "Yes! [X] open roles at [Company]."
   - Not found: "No current openings at [Company] in your network."

### Pattern B: "Find me [Role] jobs in [Location]" (PREFERRED - use granular files)
1. **Fetch Manifest**: Get category list with `byLocation` sub-files
2. **Map Category**: "PM/product" -> `product`, "engineering/dev" -> `engineering`, etc.
3. **Map Location**: "NYC/New York" -> `nyc`, "SF/Bay Area" -> `sf`, "remote" -> `remote`
4. **Fetch Granular File**: Use `{category}-{location}-{seniority}.json` for fastest results
   - Example: "Senior PM jobs in NYC" -> fetch `product-nyc-senior.json` (26KB instead of 242KB)
   - If no seniority specified, fetch both senior and mid files for that location
5. **Report**: Results sorted by `lastSeen` (freshest first)

### Pattern B2: Broad queries - ASK FOR CLARIFICATION
If user query is too broad (e.g., "find me jobs", "what's available?"), ask:
- "What type of role? (engineering, product, sales, etc.)"
- "Any location preference? (NYC, SF, remote, anywhere)"
- "Seniority level? (senior/staff or mid-level)"

This avoids fetching 200KB+ of data unnecessarily.

### Pattern C: "What's new?" / "Recent opportunities"
1. **Fetch Manifest**: Check `lastUpdated` timestamp
2. **Strategy**: Fetch user's preferred category granular file, or ask for preference
3. **Sort**: By `firstSeen` descending to show newest additions
4. **Report**: Latest 10 jobs added to the network

### Pattern D: "Remote [Role] jobs" or "[Location] jobs"
1. **Map Location** to bucket: nyc, sf, remote, other
2. **Fetch Granular Files**: `{category}-{location}-senior.json` and `{category}-{location}-mid.json`
3. Report matches (no client-side filtering needed!)

### Pattern E: "Jobs paying over $X"
1. Fetch appropriate category
2. Filter where `salary.min >= X` or `salary.max >= X`
3. Report matches with salary ranges

## Output Format

**STRICT FORMAT REQUIRED** - Do NOT summarize or paraphrase. Do NOT write prose/narrative. Output MUST follow this exact structure:

**Structure:**
1. Header: "Searching via [Name] ([Title])..." or "Searching via [Name] ([Title] @ [Company])..." if company is set
2. Data freshness: "Data as of [Mon D], [H:MM AM/PM] ([relative] ago)" - from `manifest.lastUpdated`
   - Calculate relative time: use "Xh ago" for <24h, "Xd ago" for ≥24h
3. Summary line: "X [role] roles in [location]:" (simple count)
4. Group results by company (COMPANY NAME in caps, then "- N roles")
5. Each job on its own line with bullet `• `, title, salary (if available), days since posted
6. **CRITICAL**: End each job line with a clickable markdown link: `[↗](job_url)` - do NOT show full URLs
7. Calculate days from `postedAt` (or `firstSeen` as fallback). Display as `3d`, `14d`, `120d`
8. Footer: "Want help drafting an intro email to [Name] ([email])?" - MUST include advisor email

**Job line format:**
```
• [Title] – [Salary if available], [N]d [↗](url)
```

**Example format:**
```
Searching via Frank Harris (Executive Coach)...
Data as of Jan 9, 10:30 PM (2h ago)

8 PM roles in NYC:

JUSTWORKS - 5 roles
• Group PM, Growth – 26d [↗](https://example.com/job/1)
• Senior PM, Foundations – $150-180k, 39d [↗](https://example.com/job/2)
• Senior PM, Payroll & Tax – 28d [↗](https://example.com/job/3)
• Product Manager, Core Services – 19d [↗](https://example.com/job/4)
• Group PM, Internal Tools – 18d [↗](https://example.com/job/5)

FIGMA - 2 roles
• Product Manager, CMS – 67d [↗](https://example.com/job/6)
• Product Manager, Growth – 66d [↗](https://example.com/job/7)

BETTERMENT - 1 role
• Sr. PM, Employer Recordkeeping – 65d [↗](https://example.com/job/8)

Want help drafting an intro email to Frank (frank@example.com)?
```

**DO NOT:**
- Write narrative summaries like "I found 93 roles including..."
- Group jobs by description instead of listing each one
- Omit the clickable `[↗](url)` links
- Skip the advisor email in the footer
- Add commentary between job listings

## Important Notes

- Fetch data directly from `https://jobs.hirefrank.com/{advisor}/{file}.json`
- Every job in this database is at a company where the advisor has a connection
- The `department` field is the company's internal team name (useful for specificity)
- `category` is the normalized job function
- Jobs are refreshed every 6 hours; check `lastUpdated` in manifest

## Related Skills

**intro-email-generator** - Once you find a job you like, use this skill to craft a compelling, forwardable introduction email. Pass the advisor info (name, email) and job details. The email is addressed to the advisor so they can forward it directly to someone at the company.
