# E-commerce Recommender MVP

This repository contains a full-stack MVP for testing e-commerce recommender datasets and models in a simulated product experience.

Language options:

- English: [README.md](d:\RepositoryVS\Codex\README.md)
- Thai: [docs/README.th.md](d:\RepositoryVS\Codex\docs\README.th.md)

## Quick Start

### 1. Clone the repository

```powershell
git clone <your-repository-url>
cd recommender-sandbox-mvp
```

### 2. Start the backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

### 4. Open the app

- E-commerce scenario: `http://localhost:3000/`
- Coffee scenario: `http://localhost:3000/coffee`
- Backend API docs: `http://localhost:8000/docs`

### 5. Try a test user

- E-commerce user example: `U100`
- Coffee user example: `C100`

## What this MVP includes

- Mock authentication using dataset `user_id` values
- Personalized product recommendations for a chosen user
- Offline evaluation against hidden future purchases
- A dashboard to compare simple recommender strategies
- A model-agnostic backend service layer so stronger recommenders can be added later
- A second scenario page for a coffee shop recommendation web app at `/coffee`

## Architecture

- `frontend/`: Next.js app for login, recommendation browsing, and evaluation dashboards
- `backend/`: FastAPI service for dataset loading, recommendation generation, and analytics

## Available Pages

- `http://localhost:3000/`: Original e-commerce recommender MVP
- `http://localhost:3000/coffee`: Coffee recommendation web app scenario

## Local setup

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and expects the backend on `http://localhost:8000`.

## Idea We Are Testing

The original product idea is:

1. A user can log in with an existing `user_id` from an e-commerce dataset.
2. After login, the app shows personalized product recommendations for that user.
3. The system measures whether those recommendations are useful by comparing them against the user's hidden future purchases.
4. We can compare multiple recommendation strategies in one web app.

This MVP is designed to simulate that full loop in a simple, controlled environment.

## Current State

The current implementation is working as an MVP and already covers the main idea prompt.

What is implemented now:

- Mock authentication using dataset `user_id`
- Dataset-backed recommendations
- Two recommender strategies:
  - `popularity`
  - `item_cooccurrence`
- Offline evaluation using a time-based holdout
- A web dashboard to inspect:
  - selected user
  - training history
  - recommended products
  - hidden future purchases
  - hit/miss results
  - aggregate model metrics

Current limitations:

- The dataset is currently a small synthetic sample stored in CSV files
- Authentication is mock-only and not secure for production use
- Evaluation is offline only and does not yet track real user clicks or purchases
- The database layer is not yet connected to PostgreSQL; the MVP currently reads from CSV files

## Coffee Scenario

The repository now also includes a second scenario focused on a coffee shop recommendation web app.

What the coffee scenario demonstrates:

- login with coffee dataset `user_id`
- recommend coffee, tea, bakery, dessert, and ready-to-eat items
- show likely drink and food pairings
- show which items a user often buys together
- show preferred purchase time of day such as morning, lunch, or afternoon
- evaluate recommendations against a hidden future order

Useful coffee endpoints:

- `GET /coffee/users`
- `POST /coffee/auth/mock-login`
- `GET /coffee/users/{user_id}/recommendations?model=item_cooccurrence&k=6`
- `GET /coffee/users/{user_id}/evaluation?model=item_cooccurrence&k=6`
- `GET /coffee/users/{user_id}/insights`
- `GET /coffee/dashboard/summary`

Coffee dataset files:

- [coffee_users.csv](d:\RepositoryVS\Codex\backend\data\coffee_users.csv)
- [coffee_products.csv](d:\RepositoryVS\Codex\backend\data\coffee_products.csv)
- [coffee_interactions.csv](d:\RepositoryVS\Codex\backend\data\coffee_interactions.csv)

## Step-by-Step Testing Guide

Use the following steps to test whether the app behaves according to the idea prompt.

### Test 1: Start the backend

What we do:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Expected result:

- The FastAPI server starts without crashing
- The API is available at `http://localhost:8000`
- Opening `http://localhost:8000/health` returns:

```json
{"status":"ok"}
```

What this proves:

- The backend service is running
- The app can load the dataset and expose the MVP endpoints

### Test 2: Start the frontend

What we do:

```powershell
cd frontend
npm install
npm run dev
```

Expected result:

- The Next.js app starts without crashing
- The UI is available at `http://localhost:3000`
- The landing page loads the recommendation dashboard

What this proves:

- The frontend can boot successfully
- The frontend can communicate with the backend
- Both `/` and `/coffee` can be opened as separate MVP scenarios

### Test 3: Verify dataset users are available for mock login

What we do:

- Open the web app in the browser
- Look at the `Mock Login` section
- Open the dataset user dropdown

Expected result:

- The dropdown shows valid dataset user IDs such as `U100`, `U101`, and others
- Each option includes a user segment

What this proves:

- The app is using dataset identities instead of manually created app accounts
- The mock authentication flow matches the original idea

### Test 4: Log in as a dataset user

What we do:

- Select one user from the dropdown, for example `U100`

Expected result:

- The app automatically performs mock login for that `user_id`
- The user summary panel updates
- You can see:
  - selected `user_id`
  - user segment
  - number of training interactions
  - number of hidden future purchases

What this proves:

- The system can log in using a dataset user ID directly
- The selected user becomes the active profile for recommendation generation

### Test 5: Verify personalized recommendations are shown

What we do:

- After selecting a user, inspect the `Recommendations` section

Expected result:

- A list of recommended products appears
- Each product shows:
  - `item_id`
  - title
  - category
  - price
  - recommendation score
  - explanation text
- The panel also shows the user's training history item IDs

What this proves:

- The recommendation engine is producing user-specific results
- The app is not only showing static products; it is responding to the selected user profile

### Test 6: Verify the evaluation logic

What we do:

- Inspect the `Evaluation` section for the same user

Expected result:

- The UI shows:
  - `Precision`
  - `Recall`
  - `Hit Rate`
  - hidden future purchase item IDs
  - hits
  - misses

What this proves:

- The app is evaluating recommendation quality against hidden future behavior
- This directly supports the original requirement to analyze whether recommendations are effective

### Test 7: Compare recommendation models

What we do:

- Change the `Model` dropdown between:
  - `item_cooccurrence`
  - `popularity`

Expected result:

- The recommended items may change
- The evaluation results may change
- The dataset-level model comparison table remains visible

What this proves:

- The MVP supports model experimentation
- The same web app can be used to compare different recommendation strategies

### Test 8: Verify dataset-level summary metrics

What we do:

- Scroll to the `Model Comparison` table

Expected result:

- The table shows one row per model
- Each row includes:
  - `Precision@6`
  - `Recall@6`
  - `Hit Rate`

What this proves:

- The MVP is not limited to single-user inspection
- It can summarize model performance across the dataset

### Test 9: Verify API endpoints directly

What we do:

- Call the backend endpoints directly in the browser or with a tool like PowerShell/curl

Useful endpoints:

- `GET /health`
- `GET /users`
- `POST /auth/mock-login`
- `GET /users/U100/recommendations?model=item_cooccurrence&k=6`
- `GET /users/U100/evaluation?model=item_cooccurrence&k=6`
- `GET /dashboard/summary`

Expected result:

- Each endpoint returns valid JSON
- Unknown users return an error
- Unsupported models return an error

What this proves:

- The frontend behavior is backed by real API logic
- The core MVP functionality is testable independently of the UI

### Test 10: Verify the coffee recommendation web app

What we do:

- Open `http://localhost:3000/coffee`
- Select a coffee dataset user such as `C100`
- Review the recommendation cards and open the behavior insights modal

Expected result:

- The page loads as a standard web app layout, not a mobile frame
- The user can log in with coffee dataset IDs
- The app shows recommended drinks and food items
- The page surfaces coffee-specific insights such as favorite drink, favorite food, preferred daypart, common pairings, and recent order items

What this proves:

- The same recommender MVP architecture can be adapted to another domain
- We can test relationship patterns such as what users drink, what they eat with it, and when they usually buy

## Expected Overall Outcome

If all tests above pass, then the MVP is working according to the original idea prompt:

- users can log in using dataset IDs
- recommendations are generated for the selected user
- recommendation quality is evaluated against hidden future purchases
- multiple recommender approaches can be compared in one interface

## Known Verification Status

The following checks have already been verified in the current workspace:

- Backend health endpoint returned `{"status": "ok"}`
- Mock login worked for `U100`
- Recommendations were returned for `U100`
- Evaluation metrics were returned for `U100`
- Dashboard summary returned aggregate metrics for both models
- Coffee endpoints returned users, recommendations, evaluation data, and user insights for `C100`
- Frontend production build completed successfully

## Next Recommended Testing After This

Once the MVP behavior above is confirmed manually, the next useful tests are:

1. Replace the synthetic CSV dataset with a real e-commerce dataset
2. Add one stronger recommender model such as ALS or LightFM
3. Add automated backend tests for endpoint responses and metric calculations
4. Add experiment tracking so different datasets and model runs can be compared over time

## Contributing

Contributions are welcome, especially for:

- new datasets and domain scenarios
- additional recommender models
- improved offline evaluation metrics
- frontend UX improvements
- automated tests and developer tooling

Suggested contribution flow:

1. Fork the repository
2. Create a branch such as `feature/coffee-insights` or `fix/dashboard-layout`
3. Make focused changes with clear commit messages
4. Run the backend and frontend locally
5. Verify the relevant route or API endpoint works
6. Open a pull request with:
   - what changed
   - why it changed
   - how it was tested

Before opening a PR, please try to confirm:

- `uvicorn app.main:app --reload` starts successfully
- `npm run build` passes in `frontend/`
- the main route `/` still works
- the coffee route `/coffee` still works if your change affects shared logic
