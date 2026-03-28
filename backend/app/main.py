from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.models import CoffeeUserInsight, DashboardSummary, EvaluationResponse, LoginRequest, RecommendationResponse, UserSummary
from app.services.analytics import SUPPORTED_MODELS, dashboard_summary, evaluate_user, get_dataset, get_recommendations, list_users
from app.services.coffee_analytics import coffee_dashboard_summary, coffee_user_insight, evaluate_coffee_user, get_coffee_dataset, get_coffee_recommendations, list_coffee_users


app = FastAPI(
    title="E-commerce Recommender MVP API",
    version="0.1.0",
    description="Mock-authenticated recommendation and evaluation service for ecommerce MVP experiments.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _ensure_user_exists(user_id: str) -> None:
    dataset = get_dataset()
    if user_id not in set(dataset.users["user_id"].tolist()):
        raise HTTPException(status_code=404, detail=f"Unknown user_id '{user_id}'")


def _ensure_model_supported(model: str) -> None:
    if model not in SUPPORTED_MODELS:
        raise HTTPException(status_code=400, detail=f"Unsupported model '{model}'")


def _ensure_coffee_user_exists(user_id: str) -> None:
    dataset = get_coffee_dataset()
    if user_id not in set(dataset.users["user_id"].tolist()):
        raise HTTPException(status_code=404, detail=f"Unknown coffee user_id '{user_id}'")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/users", response_model=list[UserSummary])
def users() -> list[UserSummary]:
    return list_users()


@app.post("/auth/mock-login")
def mock_login(payload: LoginRequest) -> dict[str, str]:
    _ensure_user_exists(payload.user_id)
    return {"user_id": payload.user_id, "message": "Mock login successful"}


@app.get("/users/{user_id}/recommendations", response_model=RecommendationResponse)
def recommendations(
    user_id: str,
    model: str = Query(default="item_cooccurrence"),
    k: int = Query(default=6, ge=1, le=20),
) -> RecommendationResponse:
    _ensure_user_exists(user_id)
    _ensure_model_supported(model)
    return get_recommendations(user_id=user_id, model=model, k=k)


@app.get("/users/{user_id}/evaluation", response_model=EvaluationResponse)
def evaluation(
    user_id: str,
    model: str = Query(default="item_cooccurrence"),
    k: int = Query(default=6, ge=1, le=20),
) -> EvaluationResponse:
    _ensure_user_exists(user_id)
    _ensure_model_supported(model)
    return evaluate_user(user_id=user_id, model=model, k=k)


@app.get("/dashboard/summary", response_model=DashboardSummary)
def summary(k: int = Query(default=6, ge=1, le=20)) -> DashboardSummary:
    return dashboard_summary(k=k)


@app.get("/coffee/users", response_model=list[UserSummary])
def coffee_users() -> list[UserSummary]:
    return list_coffee_users()


@app.post("/coffee/auth/mock-login")
def coffee_mock_login(payload: LoginRequest) -> dict[str, str]:
    _ensure_coffee_user_exists(payload.user_id)
    return {"user_id": payload.user_id, "message": "Coffee mock login successful"}


@app.get("/coffee/users/{user_id}/recommendations", response_model=RecommendationResponse)
def coffee_recommendations(
    user_id: str,
    model: str = Query(default="item_cooccurrence"),
    k: int = Query(default=6, ge=1, le=20),
) -> RecommendationResponse:
    _ensure_coffee_user_exists(user_id)
    _ensure_model_supported(model)
    return get_coffee_recommendations(user_id=user_id, model=model, k=k)


@app.get("/coffee/users/{user_id}/evaluation", response_model=EvaluationResponse)
def coffee_evaluation(
    user_id: str,
    model: str = Query(default="item_cooccurrence"),
    k: int = Query(default=6, ge=1, le=20),
) -> EvaluationResponse:
    _ensure_coffee_user_exists(user_id)
    _ensure_model_supported(model)
    return evaluate_coffee_user(user_id=user_id, model=model, k=k)


@app.get("/coffee/users/{user_id}/insights", response_model=CoffeeUserInsight)
def coffee_insights(user_id: str) -> CoffeeUserInsight:
    _ensure_coffee_user_exists(user_id)
    return coffee_user_insight(user_id)


@app.get("/coffee/dashboard/summary", response_model=DashboardSummary)
def coffee_summary(k: int = Query(default=6, ge=1, le=20)) -> DashboardSummary:
    return coffee_dashboard_summary(k=k)
