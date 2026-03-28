from typing import Literal

from pydantic import BaseModel, Field


ModelName = Literal["popularity", "item_cooccurrence"]


class LoginRequest(BaseModel):
    user_id: str = Field(..., min_length=1)


class Product(BaseModel):
    item_id: str
    title: str
    category: str
    price: float


class RecommendedProduct(Product):
    score: float
    reason: str


class UserSummary(BaseModel):
    user_id: str
    segment: str
    train_history_count: int
    hidden_future_count: int


class EvaluationMetrics(BaseModel):
    precision_at_k: float
    recall_at_k: float
    hit_rate: float


class RecommendationResponse(BaseModel):
    user_id: str
    model: ModelName
    recommendations: list[RecommendedProduct]
    train_history_item_ids: list[str]


class EvaluationResponse(BaseModel):
    user_id: str
    model: ModelName
    k: int
    metrics: EvaluationMetrics
    hidden_future_item_ids: list[str]
    hits: list[str]
    misses: list[str]


class DashboardModelSummary(BaseModel):
    model: ModelName
    precision_at_k: float
    recall_at_k: float
    hit_rate: float


class DashboardSummary(BaseModel):
    users: int
    items: int
    train_interactions: int
    hidden_future_interactions: int
    models: list[DashboardModelSummary]


class CoffeePairing(BaseModel):
    items: list[str]
    count: int


class CoffeeUserInsight(BaseModel):
    user_id: str
    favorite_drink: str | None
    favorite_food: str | None
    preferred_daypart: str | None
    common_pairings: list[CoffeePairing]
    recent_order_item_ids: list[str]
