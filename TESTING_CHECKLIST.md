# API Testing Checklist

## Prerequisites
- [ ] Development server running (`npm run dev`)
- [ ] MongoDB connection configured (if testing database save)
- [ ] Sample test files prepared
- [ ] Postman or cURL installed
- [ ] API_TESTING_GUIDE.md reviewed

---

## Test Scenario 1: Process Files Without Database Save

### Setup
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Prepare test files (optional - use any PDF/XLSX files)
# Make sure you have:
# - accounts.pdf or accounts.xlsx
# - trial_balance.xlsx
```

### Test Steps
- [ ] **Test 1.1: Upload with Partner ID 1**
  ```bash
  curl -X POST http://localhost:3000/api/review \
    -F "accountsFile=@accounts.pdf" \
    -F "trialBalanceFile=@trial_balance.xlsx" \
    -F "partnerId=1" \
    -F "scope=full"
  ```
  - Expected: Returns errors, queries, presentation findings
  - Check: Response contains `errors`, `queries`, `presentation` arrays

- [ ] **Test 1.2: Upload with Different Partner ID (2-7)**
  ```bash
  curl -X POST http://localhost:3000/api/review \
    -F "accountsFile=@accounts.pdf" \
    -F "trialBalanceFile=@trial_balance.xlsx" \
    -F "partnerId=3" \
    -F "scope=full"
  ```
  - Expected: Different findings based on partner ruleset
  - Check: Findings differ from Partner 1 results

- [ ] **Test 1.3: Upload with Different Scope**
  ```bash
  curl -X POST http://localhost:3000/api/review \
    -F "accountsFile=@accounts.pdf" \
    -F "trialBalanceFile=@trial_balance.xlsx" \
    -F "partnerId=1" \
    -F "scope=tax"
  ```
  - Expected: Tax-focused findings
  - Check: Scope parameter affects findings

- [ ] **Test 1.4: Missing Required File**
  ```bash
  curl -X POST http://localhost:3000/api/review \
    -F "accountsFile=@accounts.pdf" \
    -F "partnerId=1"
  ```
  - Expected: Error response
  - Check: Returns appropriate error message

---

## Test Scenario 2: Save Review to Database

### Setup
- [ ] MongoDB Atlas or local MongoDB running
- [ ] Connection string configured in `.env.local`
- [ ] Database accessible

### Test Steps
- [ ] **Test 2.1: Save Valid Review**
  ```bash
  curl -X POST http://localhost:3000/api/save-review \
    -H "Content-Type: application/json" \
    -d '{
      "reviewId": "TEST-001",
      "partnerId": "1",
      "partnerName": "Partner 1",
      "timestamp": "2024-02-25T10:00:00Z",
      "scope": "full",
      "status": "ready",
      "errorCount": 1,
      "warningCount": 1
    }'
  ```
  - Expected: Success response with mongoId
  - Check: Response includes `success: true`

- [ ] **Test 2.2: Missing Required Fields**
  ```bash
  curl -X POST http://localhost:3000/api/save-review \
    -H "Content-Type: application/json" \
    -d '{"reviewId": "TEST-002"}'
  ```
  - Expected: 400 Bad Request error
  - Check: Error message mentions missing partnerId

- [ ] **Test 2.3: Database Connection Failure (Graceful)**
  - Stop MongoDB or disconnect network
  - Run save request
  - Expected: 500 error but with `warning` message
  - Check: Review still completes successfully

---

## Test Scenario 3: PDF Export Endpoints

### Setup
- [ ] Use response data from Test 1.1

### Test Steps
- [ ] **Test 3.1: Export to PDF HTML (Legacy)**
  ```bash
  curl -X POST http://localhost:3000/api/export/pdf \
    -H "Content-Type: application/json" \
    -d '{
      "results": {
        "partner": {"id": "1", "name": "Partner 1", "title": "Maximum"},
        "errors": [],
        "queries": [],
        "presentation": [],
        "parsed": {"documents": []}
      }
    }'
  ```
  - Expected: 200 OK with HTML content
  - Check: Response includes `success: true` and HTML

- [ ] **Test 3.2: Export Report (Legacy)**
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
    }' \
    -H "Accept: text/html"
  ```
  - Expected: 200 OK with HTML content-type
  - Check: Content-Type header is text/html

---

## Test Scenario 4: End-to-End Workflow

### Complete Flow Test
- [ ] **Step 1:** Upload files (`/api/review`)
  - Save the response JSON, especially `reviewId`
  
- [ ] **Step 2:** Save review to database (`/api/save-review`)
  - Use findings from Step 1
  - Verify successful database save
  
- [ ] **Step 3:** Generate PDF export (client-side)
  - Verify PDF downloads without errors
  - Check PDF contains all findings

- [ ] **Step 4:** Verify in browser UI**
  - Open localhost:3000
  - Upload same files through UI
  - Verify findings match API response
  - Click "Export PDF" button
  - Verify PDF downloads

---

## Validation Tests

### Error Handling
- [ ] Missing files → 400 Bad Request
- [ ] Invalid file format → Appropriate error message
- [ ] Missing partnerId → Error or default to 1
- [ ] Database down → Graceful failure with warning
- [ ] Invalid JSON → 400 Bad Request

### Data Integrity
- [ ] Findings contain all required fields (id, issue/query/item, location, action/evidence/suggestion)
- [ ] Partner rulesets apply correctly (Partner 1 vs Partner 2, etc.)
- [ ] Scope parameter affects findings (full vs tax vs commercial)
- [ ] Parsed data extracts correctly from files

### Performance
- [ ] File upload < 30 seconds for 10MB file
- [ ] Review processing < 15 seconds
- [ ] Database save < 5 seconds
- [ ] PDF generation < 10 seconds

---

## Browser UI Tests

### File Upload
- [ ] Upload PDF accounts file
- [ ] Upload Excel trial balance file
- [ ] Select partner from dropdown
- [ ] Select review scope

### Results Display
- [ ] Errors display with ID, issue, location, action
- [ ] Queries display with ID, query, location, evidence
- [ ] Presentation items display with ID, item, location, suggestion
- [ ] Summary shows correct counts
- [ ] Status badge shows correct status (Ready/Review Required)

### PDF Export
- [ ] Click "Export PDF" button
- [ ] PDF downloads successfully
- [ ] PDF opens in viewer
- [ ] PDF contains all findings
- [ ] Formatting is correct

---

## Partner-Specific Tests

### Partner 1 (Maximum Strictness)
- [ ] Should flag missing DRAFT status as Error
- [ ] Should require company details
- [ ] Should check all sections

### Partner 2 (Commercial Focus)
- [ ] Should relax formatting checks
- [ ] Should focus on commercial relevance
- [ ] Should have different error threshold

### Partner 3 (Tax Focus)
- [ ] Should check tax computations
- [ ] Should verify reconciliations
- [ ] Should flag tax-related issues

### Partners 4-7
- [ ] Run same review with each partner
- [ ] Verify unique rulesets apply
- [ ] Check different findings for same files

---

## Logging & Debugging

### Enable Debug Output
```bash
# Check server logs for [v0] debug messages
# Look for:
# - File parsing logs
# - Review engine processing
# - Database operations
# - Error stack traces
```

### Browser DevTools
- [ ] Open DevTools (F12)
- [ ] Go to Network tab
- [ ] Reload page
- [ ] Click "Upload Files"
- [ ] Monitor requests and responses
- [ ] Check response data structure

### Database Verification (MongoDB)
```bash
# Check if review was saved
mongo --eval "db.getCollection('reviews').find({})" ai_report_review
```

---

## Sign-Off Checklist

When all tests pass:
- [ ] All 4 API endpoints working correctly
- [ ] Error handling working as expected
- [ ] Database save working (if configured)
- [ ] UI displays findings correctly
- [ ] PDF export functional
- [ ] All partner rulesets working
- [ ] Performance acceptable
- [ ] No console errors or warnings

**Status:** ☐ Ready for Production

---

## Common Issues & Solutions

### Issue: Files not uploading
- **Solution:** Check file size, format, and MIME types

### Issue: Partner not found error
- **Solution:** Verify partnerId is 1-7

### Issue: MongoDB connection error
- **Solution:** Check MONGODB_URI env variable

### Issue: Findings empty
- **Solution:** Check review engine logs, verify file content matches patterns

### Issue: PDF not generating
- **Solution:** Check browser console for errors, verify PDFGenerator installed

### Issue: Different results on retry
- **Solution:** Expected - review engine may produce slightly different findings on retry

---

## Notes

- Test files can be any valid PDF or Excel
- Partner rulesets defined in `/lib/rules/partner-*.ts`
- Review engine in `/lib/engine/review-engine.ts`
- API routes in `/app/api/*/route.ts`
