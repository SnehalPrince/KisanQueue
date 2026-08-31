# Contributing to KisanQueue 🌾

Thank you for your interest in contributing to **KisanQueue**! We welcome contributions that help improve operational visibility, dignity, and fair wait times for India's farmers at government MSP procurement centres.

---

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Branching & Commit Conventions](#branching--commit-conventions)
5. [Design & UI Standards](#design--ui-standards)
6. [Submitting a Pull Request](#submitting-a-pull-request)
7. [Reporting Issues & Bugs](#reporting-issues--bugs)

---

## Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all community members with empathy, respect, and professionalism.

---

## Getting Started

1. **Fork the Repository**: Click "Fork" on GitHub to create your own copy of `SnehalPrince/KisanQueue`.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/<your-username>/KisanQueue.git
   cd KisanQueue
   ```
3. **Set up upstream remote**:
   ```bash
   git remote add upstream https://github.com/SnehalPrince/KisanQueue.git
   ```

---

## Development Setup

### Frontend (React + Vite + TypeScript + Tailwind)
```bash
cd frontend
npm install
npm run dev
```

### Backend (Python 3.11+ + FastAPI)
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## Branching & Commit Conventions

We follow the **Conventional Commits** specification:

* `feat(scope)`: A new feature (e.g. `feat(queue): Add 1-tap pass generator`)
* `fix(scope)`: A bug fix (e.g. `fix(eta): Prevent division by zero when counters are 0`)
* `docs(scope)`: Documentation only changes (e.g. `docs(arch): Update backend diagram`)
* `style(scope)`: Code formatting, missing semicolons, etc.
* `refactor(scope)`: Code change that neither fixes a bug nor adds a feature
* `test(scope)`: Adding or correcting tests

### Branch Naming
- `feat/feature-name`
- `fix/bug-description`
- `docs/doc-update`

---

## Design & UI Standards

* **Color Palette**: Strictly use the official brand tokens:
  - 🌰 **Almond**: `#D6BD98`
  - 🍵 **Matcha Brew**: `#677D6A`
  - 🌲 **Forest Roast**: `#40534C`
  - 🌑 **Eclipse**: `#1A3636`
* **Typography**:
  - English: `Urbanist` + `Rustic Roadway`
  - Hindi: `AMS Shikha` / `Manoja` + `Noto Sans Devanagari`
* **UI Libraries**: Skiper UI, React Bits (`reactbits.dev`), Motion (`motion/react`), and Bklit UI.
* **No Placeholders**: Never use grey placeholder boxes; use real photographic/vector assets in `assets/images/`.

---

## Submitting a Pull Request

1. Rebase your branch onto `upstream/main`:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. Run tests to ensure everything passes:
   ```bash
   # Backend:
   pytest
   # Frontend:
   npm run test
   ```
3. Push your branch to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
4. Open a Pull Request on GitHub against `main`. Fill in the PR template with a clear description and screenshots/recordings if applicable.

---

## Reporting Issues & Bugs

Please search existing issues before opening a new one. When opening an issue, use our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
* Clear description of the problem
* Steps to reproduce
* Expected vs actual behavior
* Screenshots or console error logs

---

<div align="center">

Thank you for building for India's farmers! 🌾

</div>
