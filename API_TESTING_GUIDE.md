# AI Accounts Review - API Testing Guide

This guide provides detailed instructions for testing each API endpoint with example payloads.

---

## 1. POST /api/review - Process Files and Generate Review

**Purpose:** Upload accounting files (PDF/Excel) and generate a comprehensive review with findings.

**Method:** POST  
**Content-Type:** multipart/form-data  

### Request Parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountsFile` | File | Yes | PDF or Excel file containing accounts/financial statements |
| `trialBalanceFile` | File | Yes | Excel file containing trial balance data |
| `partnerId` | string | Yes | Partner ID (1-7) to apply specific ruleset |
| `scope` | string | No | Review scope: "full", "tax", "commercial" (default: "full") |

### Example cURL Test:

```bash
curl -X POST http://localhost:3000/api/review \
  -F "accountsFile=@/path/to/accounts.pdf" \
  -F "trialBalanceFile=@/path/to/trial_balance.xlsx" \
  -F "partnerId=1" \
  -F "scope=full"
```

### Example Response (200 OK):

```json
{
  "partnerId": "1",
  "scope": "full",
  "errors": [
    {
      "id": "E1",
      "issue": "Accounts not marked DRAFT",
      "location": "Document header",
      "action": "Mark accounts as DRAFT before partner review",
      "severity": "error"
    }
  ],
  "queries": [
    {
      "id": "Q1",
      "query": "Company name not found in accounts",
      "location": "Header section",
      "evidence": "Expected company identification missing",
      "severity": "warning"
    }
  ],
  "presentation": [
    {
      "id": "P1",
      "item": "Section formatting inconsistency",
      "location": "P&L Statement",
      "suggestion": "Ensure consistent heading styles throughout"
    }
  ],
  "parsed": {
    "documents": [
      {
        "name": "accounts",
        "text": "...",
        "extracted": {
          "company": "ABC Limited",
          "year": "2024",
          "status": "DRAFT"
        }
      },
      {
        "name": "trialBalance",
        "text": "...",
        "extracted": {
          "total": "1,234,567.89"
        }
      }
    ]
  },
  "message": "Files received, parsed, and rules applied successfully."
}
```

### Error Response (400 Bad Request):

```json
{
  "error": "No files provided"
}
```

---

## 2. POST /api/save-review - Save Review to Database

**Purpose:** Save completed review results to MongoDB database for record-keeping.

**Method:** POST  
**Content-Type:** application/json  

### Request Body:

```json
{
  "reviewId": "AJREV210226082651",
  "partnerId": "1",
  "partnerName": "Partner 1",
  "timestamp": "2024-02-25T08:26:51Z",
  "scope": "full",
  "status": "ready",
  "errorCount": 1,
  "warningCount": 1,
  "queryCount": 0,
  "presentationCount": 1,
  "files": {
    "trialBalance": "trial-balance.xlsx",
    "currentYearAccounts": "accounts-2024.pdf"
  },
  "summary": {
    "totalFindings": 3,
    "isReadyForPartner": true,
    "criticalIssues": 1
  },
  "errors": [
    {
      "id": "E1",
      "issue": "Accounts not marked DRAFT",
      "location": "Document header",
      "action": "Mark accounts as DRAFT"
    }
  ],
  "queries": [
    {
      "id": "Q1",
      "query": "Company name verification",
      "location": "Header section",
      "evidence": "Missing company details"
    }
  ]
}
```

### Example cURL Test:

```bash
curl -X POST http://localhost:3000/api/save-review \
  -H "Content-Type: application/json" \
  -d '{
    "reviewId": "AJREV210226082651",
    "partnerId": "1",
    "partnerName": "Partner 1",
    "timestamp": "2024-02-25T08:26:51Z",
    "scope": "full",
    "status": "ready",
    "errorCount": 1,
    "warningCount": 1
  }'
```

### Success Response (200 OK):

```json
{
  "success": true,
  "reviewId": "AJREV210226082651",
  "mongoId": "65c8d3e5f1234567890abcd"
}
```

### Error Response (400 Bad Request):

```json
{
  "error": "Missing required fields: reviewId, partnerId"
}
```

### Error Response (500 Internal Server Error):

```json
{
  "success": false,
  "error": "Database connection failed",
  "warning": "Review was not saved to database, but review was completed successfully."
}
```

---

## 3. POST /api/export/pdf - Generate PDF HTML (Legacy)

**Purpose:** Generate HTML content for PDF export (older endpoint, use with caution).

**Method:** POST  
**Content-Type:** application/json  

### Request Body:

```json
{
  "results": {
    "partner": {
      "id": "1",
      "name": "Partner 1",
      "title": "Maximum"
    },
    "errors": [
      {
        "id": "E1",
        "issue": "Accounts not marked DRAFT",
        "location": "Document header",
        "action": "Mark as DRAFT"
      }
    ],
    "queries": [
      {
        "id": "Q1",
        "query": "Company name verification",
        "location": "Header",
        "evidence": "Missing details"
      }
    ],
    "presentation": [
      {
        "id": "P1",
        "item": "Formatting",
        "location": "P&L",
        "suggestion": "Improve consistency"
      }
    ],
    "parsed": {
      "documents": []
    }
  }
}
```

### Example cURL Test:

```bash
curl -X POST http://localhost:3000/api/export/pdf \
  -H "Content-Type: application/json" \
  -d '{
    "results": {
      "partner": {"id": "1", "name": "Partner 1", "title": "Maximum"},
      "errors": [],
      "queries": [],
      "presentation": []
    }
  }'
```

### Success Response (200 OK):

```json
{
  "success": true,
  "html": "<html>...</html>"
}
```

### Error Response (400 Bad Request):

```json
{
  "error": "Missing results"
}
```

---

## 4. POST /api/export-review-pdf - Generate HTML Report (Legacy)

**Purpose:** Generate browser-printable HTML report for PDF export.

**Method:** POST  
**Content-Type:** application/json  

### Request Body:

```json
{
  "results": {
    "partnerId": "1",
    "errors": [
      {
        "message": "Accounts not marked DRAFT"
      }
    ],
    "warnings": [
      {
        "message": "Company name not found in accounts"
      }
    ],
    "queries": [],
    "presentation": []
  }
}
```

### Example cURL Test:

```bash
curl -X POST http://localhost:3000/api/export-review-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "results": {
      "partnerId": "1",
      "errors": [],
      "warnings": [],
      "queries": []
    }
  }'
```

### Success Response (200 OK):

Returns HTML content with status code 200 and Content-Type: text/html

```html
<html>
  <head>...</head>
  <body>
    <!-- Full report HTML -->
  </body>
</html>
```

### Error Response (400 Bad Request):

```json
{
  "error": "No results provided"
}
```

---

## Testing Workflow

### Step 1: Upload Files and Generate Review
```bash
# Use /api/review to process files
curl -X POST http://localhost:3000/api/review \
  -F "accountsFile=@accounts.pdf" \
  -F "trialBalanceFile=@trial_balance.xlsx" \
  -F "partnerId=1" \
  -F "scope=full"
```

### Step 2: Save Review to Database
```bash
# Take the response from Step 1 and use /api/save-review
# Extract review ID and findings, then save
```

### Step 3: Generate PDF Export (Client-side)
```bash
# Use the PDFGenerator class in the React component
# This happens automatically when user clicks "Export PDF" button
```

---

## Sample Test Data Files

### Trial Balance Excel Format:
```
| Account Name      | Debit    | Credit   |
|-------------------|----------|----------|
| Cash              | 10000    |          |
| Accounts Payable  |          | 5000     |
| Trial Balance     | 15000    | 15000    |
```

### Accounts PDF Content:
```
COMPANY ACCOUNTS - 2024 (DRAFT)

Company Name: ABC Limited
Year Ended: 31 December 2024
Prepared by: XYZ Accountants

BALANCE SHEET
Total Assets: 1,234,567.89

PROFIT & LOSS STATEMENT
Revenue: 500,000
Expenses: 300,000
Net Profit: 200,000
```

---

## Important Notes

1. **Partner IDs**: Use values 1-7 to trigger different rulesets
2. **File Formats**: 
   - Accounts: PDF, XLSX, or TXT
   - Trial Balance: XLSX (Excel spreadsheet)
3. **Error Handling**: All endpoints return appropriate HTTP status codes
4. **Async Processing**: `/api/review` is async and may take 5-10 seconds for large files
5. **Database Optional**: `/api/save-review` will gracefully fail if MongoDB is down

---

## Using Postman for Testing

1. **Create a new POST request**
2. **Set URL:** `http://localhost:3000/api/review`
3. **Go to Body tab**
4. **Select form-data**
5. **Add fields:**
   - `accountsFile` (File type) → select accounts.pdf
   - `trialBalanceFile` (File type) → select trial_balance.xlsx
   - `partnerId` (Text type) → "1"
   - `scope` (Text type) → "full"
6. **Click Send**

---

## Using Thunder Client (VS Code Extension)

Similar steps as Postman - use the GUI to build multipart form requests easily.

---

## Debugging Tips

- Check browser Network tab in DevTools for actual request/response
- Enable server logging: `console.log("[v0] ...")` statements
- Verify file MIME types are correct
- Ensure files are readable and not corrupted
- Check MongoDB connection if save-review fails
