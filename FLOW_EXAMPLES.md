# AI Report Review - Flow Examples

## Complete User Journey

### User Scenario: Accountant Reviews Client Accounts for Partner 4

---

## Step 1: Upload Files

**User Action**: Selects files in `file-upload-gate.tsx`
```
Trial Balance: "BBK Partnership Ltd - TB 2024.xlsx"
Accounts: "BBK Partnership - Accounts 2024.pdf"
Prior Year: (optional)
```

**State in ReviewFlow**:
```javascript
uploadedFiles = {
  trialBalance: File,
  currentYearAccounts: File,
  priorYearAccounts: null
}
```

---

## Step 2: Select Partner & Scope

**User Action**: Selects Partner in `partner-selection.tsx`
```
Partner: "Partner 4 - Client-Friendly"
Strictness: Medium (🤝)
Rule Count: 3
Downgrade Errors: Yes
```

**User Action**: Configures Review in `review-configuration.tsx`
```
Scope: "full" (all categories)
Options: "tax" or "presentation" also available
```

---

## Step 3: Review Flow Starts

**Component State Update**:
```javascript
step = "config" → shows ReviewConfiguration
↓ User clicks "Run Review"
step = "results" → shows ReviewResults
```

**Loading Screen Shows**:
```
Running AI Review

📄 1. Extracting Documents
   AI is parsing your PDF/Excel files...        ⟳

✓ 2. Validating Against Rules  
   Applying partner-specific rules...            ⟳

📊 3. Generating Summary
   Creating AI executive summary...              ⟳
```

---

## Step 4: API Processing

### 4a. File Extraction (Backend)

**Route**: `POST /api/review`

**Code Flow**:
```javascript
// 1. Convert files to buffers
const accountsBuffer = await fileToBuffer(accountsFile);
const trialBuffer = await fileToBuffer(trialBalanceFile);

// 2. Extract text
const accountsText = await extractTextFromBuffer(
  accountsBuffer,
  "accounts.pdf"
);
const trialText = await extractTextFromBuffer(
  trialBuffer,
  "trial-balance.xlsx"
);

// 3. Parse with AI (document-parser.ts)
const parsed = await parseDocumentsWithAI([
  { name: "accounts", text: accountsText },
  { name: "trialBalance", text: trialText }
]);

console.log("[v0] Extracted text lengths:", {
  accounts: accountsText.length,  // e.g., 45000 chars
  trial: trialText.length         // e.g., 12000 chars
});
```

### 4b. Rules Validation (Backend)

**Code Flow**:
```javascript
// 1. Create ReviewEngine for Partner 4
const partnerId = 4;
const reviewEngine = new ReviewEngine(partnerId);

// 2. Load PARTNER_4_RULESET
// Contains:
// - formatting rules
// - policies rules (material changes only)
// - tbReconciliation: [TB1 - balance sheet balance]
// - taxation: [TAX1 - tax reconciles]
// - etc.

// 3. Run review with scope
const reviewResults = await reviewEngine.runReview(
  parsed.documents[0],      // accounts data
  parsed.documents[1],      // trial balance data
  "full"                    // scope
);

// 4. ReviewResults structure
const reviewResults = {
  partner: {
    id: 4,
    name: "Partner 4",
    title: "Client-Friendly"
  },
  config: { scope: "full" },
  errors: [
    {
      id: "TB1",
      title: "Balance Sheet Balance Required",
      category: "error",
      message: "Trial balance assets (£245,000) don't match liabilities+equity (£243,500)"
    }
  ],
  queries: [
    {
      id: "P1",
      title: "Material Policy Change",
      category: "query", 
      message: "Depreciation method changed from straight-line to reducing balance"
    }
  ],
  presentation: [],
  totalFindings: 2
}

console.log("[v0] Review engine completed:", {
  errors: 1,
  queries: 1,
  presentation: 0
});
```

### 4c. AI Summarization (Backend)

**Code Flow**:
```javascript
// 1. Call AI summarizer (ai-summarizer.ts)
const summary = await generateExecutiveSummary(
  reviewResults,
  parsed
);

console.log("[v0] Generating AI executive summary...");

// 2. AI Prompt (internal)
`You are a professional accountant. Based on the following review findings 
for a Client-Friendly Partner review, generate a brief executive summary.

Partner Profile: Partner 4
Strictness Level: Full Review
Total Errors: 1
Total Queries: 1
Presentation Items: 0

Errors Found:
- Trial Balance Must Balance

Queries/Recommendations:
- Policy Change Detected: Depreciation method differs from prior year

Generate a professional, concise executive summary...`

// 3. AI Response Example
summary = `
This accounts review for Partner 4 (Client-Friendly) identified 1 critical 
error that must be resolved before partner review. The trial balance does 
not balance—current assets total £245,000 while liabilities and equity 
total £243,500, representing a £1,500 discrepancy that requires 
investigation and correction.

Additionally, a material change in accounting policy has been noted: the 
depreciation method has changed from straight-line to reducing balance. 
This change requires explanation and must be documented in the accounts 
notes.

Once the trial balance discrepancy is resolved and the policy change is 
documented, these accounts will be ready for Partner 4 review.
`;

console.log("[v0] Summary generated, length:", summary.length);  // e.g., 487 chars
```

### 4d. Build Response

**Code Flow**:
```javascript
// 1. Get partner profile
const partnerProfile = getPartnerProfile(4);
// {
//   id: 4,
//   name: "Partner 4",
//   profileType: "Client-Friendly",
//   strictness: "Medium",
//   ruleCount: 3,
//   ...
// }

// 2. Build response
const response = {
  partnerId: 4,
  scope: "full",
  parsed: { /* extracted data */ },
  errors: [{ /* TB1 error */ }],
  queries: [{ /* P1 query */ }],
  presentation: [],
  summary: {
    executiveSummary: summary,
    partnerName: "Partner 4",
    profileType: "Client-Friendly",
    strictness: "Medium"
  },
  message: "Files extracted, validated with AI, and reviewed successfully.",
  totalFindings: 2
};

// 3. Return as JSON
return NextResponse.json(response, { status: 200 });
```

---

## Step 5: Display Results

**Component**: `ReviewResults`

### 5a. Render AI Executive Summary

```jsx
{results?.summary?.executiveSummary && (
  <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
    <h2 className="text-xl font-bold mb-3">AI Executive Summary</h2>
    <p className="text-neutral-700 whitespace-pre-wrap">
      {results.summary.executiveSummary}
      {/* Displays the AI-generated summary from above */}
    </p>
  </div>
)}
```

**Rendered Output**:
```
┌─────────────────────────────────────────────────────┐
│ 🤖 AI Executive Summary                             │
│                                                     │
│ This accounts review for Partner 4 (Client-        │
│ Friendly) identified 1 critical error that must    │
│ be resolved before partner review. The trial       │
│ balance does not balance—current assets total      │
│ £245,000 while liabilities and equity total        │
│ £243,500, representing a £1,500 discrepancy...     │
│                                                     │
│ Additionally, a material change in accounting      │
│ policy has been noted: the depreciation method     │
│ has changed from straight-line to reducing         │
│ balance. This change requires explanation...       │
│                                                     │
│ Once the trial balance discrepancy is resolved     │
│ and the policy change is documented, these         │
│ accounts will be ready for Partner 4 review.       │
└─────────────────────────────────────────────────────┘
```

### 5b. Render Findings

```
Errors (1)
├─ Trial Balance Must Balance
│  Issue: TB assets £245,000 ≠ Liabilities+Equity £243,500
│  Status: CRITICAL - Must fix

Queries (1)  
├─ Material Policy Change
│  Issue: Depreciation method changed
│  Status: NEEDS EXPLANATION
```

### 5c. Partner Profile Info

```
Partner Profile
├─ Name: Client-Friendly
├─ Strictness: Medium
├─ Rules Applied: 3
└─ Scope: Full Review
```

---

## Step 6: Export PDF

**User Action**: Clicks "Export PDF" button

**Code Flow**:
```javascript
const handleExportPDF = async () => {
  setIsExporting(true);

  try {
    // 1. Import libraries
    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas")).default;

    // 2. Get DOM element
    const element = document.getElementById("pdf-content");

    // 3. Convert to canvas
    console.log("[v0] Starting PDF generation...");
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      allowTaint: true,
      useCORS: true
    });

    // 4. Create PDF
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // 5. Add pages
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 10, 0, imgWidth, imgHeight);

    // 6. Save
    const filename = `ai-review-Client-Friendly-${Date.now()}.pdf`;
    pdf.save(filename);  // Downloads: ai-review-Client-Friendly-1707840000000.pdf

    console.log("[v0] PDF export completed successfully");
    setExportSuccess(true);
  } catch (err) {
    console.error("[v0] Export error:", err);
    alert(`Failed to export PDF: ${err.message}`);
  } finally {
    setIsExporting(false);
  }
}
```

**Result**: User's browser downloads file
```
ai-review-Client-Friendly-1707840000000.pdf
```

**PDF Contents**:
```
AI Accounts Review Report
=========================

Partner: Partner 4 - Client-Friendly
Generated: 17/02/2026, 12:37:17
Report ID: RPT-00000001

[Errors: 1] [Queries: 1] [Status: Review Required]

AI Executive Summary
--------------------
[Full summary text here...]

Findings
--------
1. Trial Balance Must Balance [ERROR]
   Trial balance assets don't match liabilities

2. Material Policy Change [QUERY]
   Depreciation method differs from prior year

[Partner profile info, metadata, etc.]
```

---

## Different Partner Behaviors

### Compare Partner 1 vs Partner 4

#### Partner 1 (Strict Benchmark)
```javascript
partnerId = 1
ruleset = PARTNER_1_RULESET
strictness = "Maximum"
ruleCount = 20+
downgradeErrors = false

// Same documents result in:
errors = [
  { id: "F1", title: "DRAFT watermark missing" },
  { id: "F2", title: "Directors Responsibilities Statement present" },
  { id: "F3", title: "BBK Partnership Limited details missing" },
  { id: "P1", title: "Policy change (not allowed)" },
  { id: "TB1", title: "Trial balance balance" },
  { id: "TAX1", title: "Tax reconciliation" }
  // ... 14+ more errors
]
totalFindings = 20+
status = "REVIEW REQUIRED - MAJOR ISSUES"
```

#### Partner 4 (Client-Friendly)
```javascript
partnerId = 4
ruleset = PARTNER_4_RULESET
strictness = "Medium"
ruleCount = 3
downgradeErrors = true

// Same documents result in:
errors = [
  { id: "TB1", title: "Trial balance balance" }
]
queries = [
  { id: "P1", title: "Material policy change" }
]
totalFindings = 2
status = "REVIEW REQUIRED - 1 ERROR"
```

---

## Console Debug Output

**As user watches loading screen, backend logs**:
```
[v0] Processing files...
[v0] Extracted text lengths: { accounts: 45000, trial: 12000 }
[v0] Running review engine for partner: 4
[v0] Generating AI executive summary...
[v0] Summary generated, length: 487
[v0] Review API complete
```

**On results page**:
```
[v0] PDF generation starting...
[v0] Canvas converted to image data
[v0] Saving PDF with filename: ai-review-Client-Friendly-1707840000000.pdf
[v0] PDF export completed successfully
```

---

## Error Scenarios

### Scenario 1: Missing Trial Balance File

**User Flow**:
```
Upload → Partner 4 → Run Review
↓
API Error: 400
{
  "error": "Missing files: accountsFile and trialBalanceFile are required.",
  "errors": []
}
↓
Component shows error message
"Trial balance and accounts files must be provided"
↓
User must upload files and retry
```

### Scenario 2: PDF Export Fails

**User Flow**:
```
See Results → Click "Export PDF"
↓
Component: isExporting = true, button shows "Exporting..."
↓
html2canvas fails (e.g., canvas too large)
↓
Error: "Export error: canvas size exceeds maximum"
↓
Alert: "Failed to export PDF: canvas size exceeds maximum"
↓
isExporting = false, button returns to normal
↓
User can retry or try again
```

### Scenario 3: AI Summarization Fails

**User Flow**:
```
API Processing → Generate Summary
↓
generateExecutiveSummary() fails
↓
Fallback summary used:
"This accounts review identified 1 error and 1 query. 
1 critical error(s) must be addressed before partner review. 
Additionally, 1 query/recommendation(s) have been flagged. 
Please review the detailed findings section."
↓
Results still display with fallback
↓
User continues with manual review
```

---

## Data Persistence

### Save to Database

**After successful export**:
```javascript
const reviewData = {
  reviewId: "RPT-00000001",
  partnerId: 4,
  partnerName: "Partner 4 - Client-Friendly",
  profileType: "Client-Friendly",
  scope: "full",
  status: "needs-review",
  errorCount: 1,
  warningCount: 1,
  errors: [/* ... */],
  warnings: [/* ... */],
  uploadedFileNames: {
    trialBalance: "BBK Partnership Ltd - TB 2024.xlsx",
    currentYearAccounts: "BBK Partnership - Accounts 2024.pdf"
  },
  timestamp: "2026-02-17T12:37:17.000Z"
};

// POST /api/save-review
// Stores in MongoDB for history
```

---

## Summary

The complete flow ensures:
- ✅ AI extracts document data accurately
- ✅ Partner-specific rules apply correctly
- ✅ AI generates professional summaries
- ✅ Results display clearly with findings
- ✅ PDF export captures everything
- ✅ Review history is saved

All with proper error handling and fallbacks throughout.
