# 23 — Error Handling

## Principle
Errors are part of the product. A farmer who sees a confusing error message loses trust and may abandon the app. Every error state must:
1. Be written in plain language (never raw HTTP codes or stack traces).
2. Tell the farmer what happened and what to do next.
3. Never silently fail or show a blank screen.
4. Distinguish between "something is wrong with the app" and "something is wrong with the centre today."

---

## Error Classification

| Class | Cause | User sees | Action |
|---|---|---|---|
| **Network** | No internet / timeout | "Internet connection lost. Please check your connection." | Auto-retry with backoff; show last cached data |
| **Stale Data** | Centre status > 30 min old | "Data may be outdated (last updated X min ago)." | Show stale indicator; allow manual refresh |
| **Auth** | JWT expired / invalid | "Session expired. Please log in again." | Redirect to login |
| **Not Found** | Queue entry/centre deleted | "This record no longer exists." | Redirect to home |
| **Conflict** | Duplicate join, centre paused | Specific, actionable message (see below) | In-screen message |
| **Server** | Unhandled 500 | "Something went wrong on our end. Please try again shortly." | Show retry button; log error |
| **Government Data Unavailable** | Adapter returns null | Specific "not yet available" message (see below) | In-screen message |
| **WebSocket Lost** | WS connection dropped | "Live updates paused. Showing last known status." | Auto-reconnect; fallback polling |

---

## Farmer-Facing Error Messages (by scenario)

### Network Failure

**EN**: "Internet connection lost. Your queue position is still saved. Try again when connected."
**HI**: "इंटरनेट कनेक्शन टूट गया। आपकी कतार की स्थिति सुरक्षित है। कनेक्ट होने पर दोबारा कोशिश करें।"

- Show the last known queue position and ETA with a "(Last known)" label.
- Show a retry button.
- Do not show a blank screen.

---

### Stale Centre Status (> 30 min)

**EN**: "⚠️ Status last updated 47 minutes ago. May not reflect current conditions."
**HI**: "⚠️ स्थिति 47 मिनट पहले अपडेट की गई थी। वर्तमान स्थिति भिन्न हो सकती है।"

- Yellow warning banner above the status card.
- Status is still shown — do not hide it.
- Show a manual refresh button.

---

### Session Expired

**EN**: "Your session has expired. Please log in again."
**HI**: "आपका सत्र समाप्त हो गया। कृपया दोबारा लॉगिन करें।"

- Redirect to login screen automatically after 3 seconds.
- Do not lose the farmer's intended destination — redirect back post-login.

---

### Invalid OTP

**EN**: "Incorrect code. Please try again. (2 attempts remaining)"
**HI**: "गलत कोड। कृपया दोबारा कोशिश करें। (2 प्रयास बचे हैं)"

- Show attempt count as it decreases.
- After 3 failed attempts: "Too many attempts. Please request a new code."

---

### OTP Expired

**EN**: "Code expired. Request a new one."
**HI**: "कोड की समय-सीमा समाप्त हो गई। नया कोड मंगाएं।"

---

### Already in Queue (Duplicate Join)

**EN**: "You already have an active queue entry at this centre. Token #47."
**HI**: "आप पहले से इस केंद्र पर कतार में हैं। टोकन #47।"

- Show a link to "View my token."

---

### Centre Paused

**EN**: "This centre has paused operations and is not accepting new entries right now. Please check back later."
**HI**: "यह केंद्र अभी बंद है और नई प्रविष्टियाँ स्वीकार नहीं कर रहा। कृपया बाद में जांचें।"

- Show the last known reason if available (e.g., "FCI truck delayed").
- Do not show the "Join Queue" button at all when status is PAUSED.

---

### Queue at Daily Capacity

**EN**: "This centre has reached its capacity for today. You can try another centre or come back tomorrow."
**HI**: "यह केंद्र आज की क्षमता पर पहुंच गया है। कोई अन्य केंद्र आज़माएं या कल आएं।"

---

### Invalid QR Token (Officer Side)

**EN**: "Invalid token. The QR code could not be verified. Please ask the farmer to show their token number and verify manually."
**HI**: "अमान्य टोकन। QR कोड सत्यापित नहीं हुआ। किसान से टोकन नंबर पूछें और मैन्युअल जांचें।"

---

### QR Already Used (Officer Side)

**EN**: "This QR code has already been used for check-in. Farmer: Ramesh Kumar, Token 47."
**HI**: "यह QR कोड पहले ही चेक-इन के लिए उपयोग किया जा चुका है। किसान: रमेश कुमार, टोकन 47।"

---

### QR Expired

**EN**: "This QR code has expired (valid until end of day). Please ask the farmer to regenerate."
**HI**: "यह QR कोड समाप्त हो गया है। किसान से पुनः जनरेट करने के लिए कहें।"

---

### Centre Mismatch on QR Scan

**EN**: "This QR code belongs to a different centre. Please verify the farmer is at the correct location."
**HI**: "यह QR कोड किसी अन्य केंद्र का है। कृपया सत्यापित करें कि किसान सही केंद्र पर है।"

---

### Procurement Status Not Yet Available

**EN**: "Your procurement record is not yet available. This usually appears within 30 minutes of processing completion."
**HI**: "आपका खरीद रिकॉर्ड अभी उपलब्ध नहीं है। प्रक्रिया पूरी होने के 30 मिनट के भीतर आमतौर पर दिखता है।"

---

### Payment Status Not Yet Available

**EN**: "Payment is being processed by the government system. Expected within 3–7 working days. Check here for updates."
**HI**: "भुगतान सरकारी प्रणाली द्वारा प्रक्रिया में है। 3–7 कार्य दिवसों में अपेक्षित। अपडेट के लिए यहाँ जांचें।"

---

### Government Integration Unavailable (Adapter Error)

**EN**: "Live government data is temporarily unavailable. Showing estimated data. Check with your centre officer for confirmation."
**HI**: "सरकारी डेटा अभी उपलब्ध नहीं है। अनुमानित डेटा दिखाया जा रहा है। पुष्टि के लिए केंद्र के अधिकारी से मिलें।"

---

### Officer Has Not Updated Status (Stale for > 60 min)

**EN**: "The centre officer hasn't sent an update in over an hour. Status may not be current. Please call the centre to confirm before traveling."
**HI**: "केंद्र अधिकारी ने 1 घंटे से अधिक समय से अपडेट नहीं किया। यात्रा करने से पहले केंद्र से संपर्क करें।"

---

### WebSocket Disconnected

**EN** (subtle, non-alarming): "Live updates paused. Last updated 3 min ago. Refreshing every 15s."
**HI**: "लाइव अपडेट रुका। आखिरी अपडेट: 3 मिनट पहले। हर 15 सेकंड में ताज़ा होगा।"

---

### Generic Server Error

**EN**: "Something went wrong. Please try again in a moment."
**HI**: "कुछ गलत हो गया। एक क्षण बाद फिर कोशिश करें।"

- Show a retry button.
- Log the error (with `request_id`) so it can be debugged.
- Never expose stack traces, SQL errors, or internal IDs to the UI.

---

## Frontend Error Handling Pattern

```typescript
// components/AsyncBoundary.tsx
// Wraps every feature screen; catches React Query errors + network errors

<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorState
          message={getFarmerFacingMessage(error)}
          onRetry={resetErrorBoundary}
        />
      )}
      onReset={reset}
    >
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

```typescript
// lib/errorMessages.ts
function getFarmerFacingMessage(error: ApiError): string {
  const messages: Record<string, string> = {
    QUEUE_ALREADY_ACTIVE: t("errors.already_in_queue"),
    CENTRE_PAUSED: t("errors.centre_paused"),
    INVALID_QR_TOKEN: t("errors.invalid_qr"),
    // ...
    INTERNAL_ERROR: t("errors.generic"),
  };
  return messages[error.error_code] ?? messages.INTERNAL_ERROR;
}
```

---

## Backend Error Response Standard

All errors return:
```json
{
  "error_code": "SNAKE_CASE_CONSTANT",
  "message": "Human-readable developer message",
  "detail": null,
  "request_id": "uuid"
}
```
- `message` is for developer logs, not farmer display (client maps `error_code` to i18n string).
- `request_id` is logged server-side for tracing.
- No stack traces in `detail` in production (`DEBUG=false`).
