# PDF Export Testing Guide

## Quick Test (2 minutes)

### Step 1: Start the application
```bash
npm run dev
# or
yarn dev
```

### Step 2: Upload test documents
1. Navigate to the file upload page
2. Upload any trial balance and accounts files
3. Select **Partner 1** (Strict Benchmark)
4. Choose **"full"** scope

### Step 3: Run review
1. Click "Start Review" button
2. Wait for AI processing to complete (~30-60 seconds)
3. Review results appear

### Step 4: Test PDF export
1. Click **"Export PDF"** button
2. Observe: Button should show "Exporting..." state
3. Wait: 5-10 seconds for processing
4. Success: PDF downloads automatically

### Step 5: Verify PDF
1. Open downloaded PDF file
2. Check that colors render correctly (blues, reds, greens visible)
3. Verify text is readable
4. Confirm all content is included

✅ **Test Passed** - If PDF downloads successfully without color errors

---

## Detailed Test Scenarios

### Scenario 1: Basic Export (Single Page)
- **Setup**: Small accounts file
- **Expected**: PDF exports in 5-10 seconds
- **Verification**: PDF opens and displays correctly

### Scenario 2: Large Export (Multi-Page)
- **Setup**: Large accounts file with many entries
- **Expected**: PDF exports in 10-15 seconds
- **Verification**: Multiple pages created, all visible

### Scenario 3: Dark Mode Export
- **Setup**: Toggle dark mode in browser
- **Expected**: PDF still exports successfully
- **Verification**: Colors adjusted for dark mode, still readable

### Scenario 4: Multiple Partners
- **Partner 1**: Strict Benchmark - Test with maximum findings
- **Partner 4**: Client-Friendly - Test with minimal findings
- **Expected**: Export works regardless of findings count
- **Verification**: Each partner's results export correctly

### Scenario 5: Error Cases
- Click Export without content loaded
- **Expected**: Error message appears
- Click Export with invalid data
- **Expected**: Graceful error handling

---

## Validation Checklist

### CSS Color Validation
- [ ] No console errors about "lab", "oklch", or "lch"
- [ ] All colors render in HTML
- [ ] Dark mode colors are distinct from light mode

### PDF Generation
- [ ] PDF file is created
- [ ] File size is reasonable (< 5MB)
- [ ] PDF opens in reader application
- [ ] No "corrupted file" messages

### Visual Quality
- [ ] Text is sharp and readable
- [ ] Colors are vibrant (not faded)
- [ ] Layout matches screen version
- [ ] All sections are visible
- [ ] Page breaks are appropriate

### Functionality
- [ ] Download button works
- [ ] Filename includes partner name and date
- [ ] Multiple exports work (no accumulation)
- [ ] Export doesn't break subsequent reviews

---

## Console Output Check

When export is working correctly, you should see in DevTools Console:

```
[v0] Starting PDF export process...
[v0] Rendering HTML to canvas with html2canvas...
[v0] Canvas rendered successfully, converting to image...
[v0] Creating PDF document...
[v0] Saving PDF with filename: ai-review-Partner-1-2026-02-17.pdf
[v0] PDF export completed successfully
```

### ❌ If You See These Errors (Before Fix)
```
Attempting to parse an unsupported color function "lab"
Attempting to parse an unsupported color function "oklch"
```

### ✅ If Fix is Applied
These error messages should NOT appear. If they do, the CSS changes weren't applied correctly.

---

## Troubleshooting

### Issue: "PDF content not found"
- **Cause**: Element with id="pdf-content" missing
- **Fix**: Check review-results.tsx has the content wrapper
- **Solution**: Reload page and try again

### Issue: "Export fails silently"
- **Check**: Browser console for errors
- **Common cause**: Large content size
- **Solution**: Try with smaller document first

### Issue: "Colors don't render in PDF"
- **Check**: globals.css was updated with hex colors
- **Verify**: No oklch() colors in CSS
- **Solution**: Clear browser cache and reload

### Issue: "PDF is blank"
- **Cause**: Canvas rendering failed
- **Check**: html2canvas library loaded
- **Solution**: Check network tab for failed imports

---

## Performance Expectations

| Scenario | Time | Status |
|----------|------|--------|
| Small file | 5-10 sec | Normal |
| Medium file | 10-15 sec | Normal |
| Large file | 15-20 sec | Normal |
| Very large file | 20-30 sec | May take time |

If export takes > 30 seconds, the file may be too large.

---

## Browser DevTools Tips

### Enable Logging
1. Open DevTools (F12)
2. Go to Console tab
3. You'll see `[v0]` prefixed messages showing progress

### Check Network
1. Open DevTools Network tab
2. Try export
3. Should see jsPDF and html2canvas loaded successfully

### Inspect Elements
1. Open Elements tab
2. Find `<div id="pdf-content">`
3. Verify it contains all review data
4. Check computed styles (should show hex colors, not oklch)

---

## Success Indicators

✅ **PDF Export Working** when:
1. No color parsing errors in console
2. PDF file downloads in 5-30 seconds
3. PDF opens without corruption
4. All text and colors are visible
5. Layout matches screen display
6. Dark mode works correctly

---

## Rollback Instructions

If you need to revert the changes:

1. **Revert CSS changes**
   - Restore original oklch() colors in globals.css
   - OR use: `git checkout app/globals.css`

2. **Revert PDF function**
   - Restore original handleExportPDF
   - OR use: `git checkout components/review/review-results.tsx`

However, this will break PDF export again - the oklch fix is required.

---

## Additional Notes

- The color fix is permanent - PDF export requires hex colors
- These changes don't affect any other functionality
- All other app features work identically
- Safe to deploy to production
