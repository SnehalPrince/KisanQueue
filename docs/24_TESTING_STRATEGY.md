# 24 — Testing Strategy & Quality Assurance

> **Referenced Agent Skills**: [`test-driven-development`](../.agents/skills/test-driven-development/SKILL.md), [`python-testing-patterns`](../.agents/skills/python-testing-patterns/SKILL.md), [`e2e-testing-patterns`](../.agents/skills/e2e-testing-patterns/SKILL.md), [`accessibility-compliance`](../.agents/skills/accessibility-compliance/SKILL.md), [`code-review-excellence`](../.agents/skills/code-review-excellence/SKILL.md).

---

## 1. Quality Engineering Principles (TDD Workflow)

KisanQueue follows a **Test-Driven Red-Green-Refactor loop** for all core algorithmic and state components:
1. **Red**: Write a failing test matching the exact scenario from `docs/16_ETA_ENGINE.md` or `docs/04_USER_FLOWS.md`.
2. **Green**: Implement the minimal, clean code in the service/engine to make the test pass.
3. **Refactor**: Optimize readability, typing, and resilience without breaking the test suite.

---

## 2. Test Coverage Matrix

| Test Domain | Target SUT | Framework | What is Asserted |
|---|---|---|---|
| **ETA Engine** | `modules/eta/engine.py` | Pytest | Deterministic formula outputs, $F$-clamping, confidence levels |
| **Progressive Pass Gen** | `modules/queue/service.py` | Pytest-Asyncio | Single-pass generation with persistent farmer profile |
| **QR Cryptography** | `modules/qr/service.py` | Pytest | HMAC-SHA256 signature validity, day-expiry, constant-time checks |
| **Realtime Sync** | `realtime/manager.py` | Pytest + WebSockets | Sub-2-second event fan-out on officer status changes |
| **Bilingual UI** | `features/assistant/` | Vitest + RTL | Zero English leaks in Hindi mode |
| **Accessibility** | Frontend Components | Playwright + Axe | WCAG 2.1 AA color contrast & keyboard navigation |

---

## 3. Backend Test Suite (Pytest)

### 1. ETA Formula & Edge Cases
```python
# tests/test_eta.py
import pytest
from modules.eta.engine import compute_eta_formula, Confidence

def test_eta_normal_day():
    result = compute_eta_formula(N=14, T_base=25, C=2, F=1.00, status="NORMAL")
    assert result.eta_minutes == 175  # ceil(14 * 25 / (2 * 1.00))
    assert result.confidence == Confidence.HIGH

def test_eta_lifting_delay():
    result = compute_eta_formula(N=14, T_base=25, C=1, F=0.60, status="LIFTING_DELAYED")
    assert result.eta_minutes == 584  # ceil(14 * 25 / (1 * 0.60))
    assert result.confidence == Confidence.LOW

def test_eta_paused_centre():
    result = compute_eta_formula(N=10, T_base=25, C=2, F=1.00, status="PAUSED")
    assert result.eta_minutes is None
    assert result.confidence == Confidence.NA
```

### 2. Conversational Pass Generation (Progressive Onboarding)
```python
# tests/test_pass_generation.py
import pytest

@pytest.mark.asyncio
async def test_returning_farmer_generates_pass_without_identity_reentry(client, auth_headers_farmer_ramesh):
    # Ramesh is already onboarded. Generates pass with only crop & quintals.
    payload = {
        "centre_id": "centre-rajgarh-01",
        "crop": "Wheat",
        "quantity_quintals": 80.0
    }
    response = await client.post("/v1/passes/generate", json=payload, headers=auth_headers_farmer_ramesh)
    assert response.status_code == 201
    data = response.json()
    
    assert data["token_code"] == "KQ-1047"
    assert data["farmer"]["name"] == "Ramesh Kumar"
    assert data["farmer"]["village"] == "Biaora"
    assert "qr_token" in data
```

---

## 4. Frontend & Accessibility Testing (Vitest & Playwright)

### 1. Automated WCAG AA Compliance (`@axe-core/playwright`)
```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Farmer Pass screen passes WCAG 2.1 AA standards', async ({ page }) => {
  await page.goto('/pass/KQ-1047');
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### 2. Micro-Interaction & Number Pop-in
```typescript
// tests/NumberPopIn.test.tsx
import { render, screen } from '@testing-library/react';
import { NumberPopIn } from '../components/motion/NumberPopIn';

test('renders new digits with motion wrapper', () => {
  const { rerender } = render(<NumberPopIn value={45} suffix="min" />);
  expect(screen.getByText('45')).toBeInTheDocument();

  rerender(<NumberPopIn value={135} suffix="min" />);
  expect(screen.getByText('135')).toBeInTheDocument();
});
```

---

## 5. Pre-Commit Quality & Code Review Checklist

Before any PR or demo deployment, ensure:
1. **Zero Secret Leakage**: No hardcoded credentials or API keys in git history.
2. **Deterministic Outputs**: All ETA unit tests pass with zero floating-point drift.
3. **No English Leakage**: In Hindi mode, 100% of user-facing copy renders in Devanagari.
4. **WebSocket Fallback**: If WebSocket server is stopped, client falls back to REST polling within 3 seconds.
