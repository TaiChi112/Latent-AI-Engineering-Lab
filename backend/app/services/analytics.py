from __future__ import annotations

from functools import lru_cache

from app.models import DashboardModelSummary, DashboardSummary, EvaluationMetrics, EvaluationResponse, RecommendationResponse, RecommendedProduct, UserSummary
from app.services.dataset import DatasetBundle, load_dataset
from app.services.recommender import RecommendationResult, build_recommender


SUPPORTED_MODELS = ("popularity", "item_cooccurrence")


@lru_cache(maxsize=1)
def get_dataset() -> DatasetBundle:
    return load_dataset()


def list_users() -> list[UserSummary]:
    dataset = get_dataset()
    train_counts = dataset.train_interactions.groupby("user_id").size().to_dict()
    test_counts = dataset.test_interactions.groupby("user_id").size().to_dict()

    return [
        UserSummary(
            user_id=row["user_id"],
            segment=row["segment"],
            train_history_count=int(train_counts.get(row["user_id"], 0)),
            hidden_future_count=int(test_counts.get(row["user_id"], 0)),
        )
        for row in dataset.users.to_dict("records")
    ]


def _product_payload(dataset: DatasetBundle, rec: RecommendationResult) -> RecommendedProduct:
    product = dataset.products.loc[dataset.products["item_id"] == rec.item_id].iloc[0]
    return RecommendedProduct(
        item_id=rec.item_id,
        title=str(product["title"]),
        category=str(product["category"]),
        price=float(product["price"]),
        score=round(rec.score, 4),
        reason=rec.reason,
    )


def get_recommendations(user_id: str, model: str, k: int) -> RecommendationResponse:
    dataset = get_dataset()
    recommender = build_recommender(model, dataset)
    recommendations = recommender.recommend(user_id=user_id, k=k)
    history = dataset.train_interactions.loc[
        dataset.train_interactions["user_id"] == user_id, "item_id"
    ].tolist()

    return RecommendationResponse(
        user_id=user_id,
        model=model,
        recommendations=[_product_payload(dataset, rec) for rec in recommendations],
        train_history_item_ids=history,
    )


def evaluate_user(user_id: str, model: str, k: int) -> EvaluationResponse:
    response = get_recommendations(user_id=user_id, model=model, k=k)
    dataset = get_dataset()
    hidden = dataset.test_interactions.loc[
        dataset.test_interactions["user_id"] == user_id, "item_id"
    ].tolist()
    recommended = [item.item_id for item in response.recommendations]

    hits = [item_id for item_id in recommended if item_id in hidden]
    misses = [item_id for item_id in hidden if item_id not in recommended]

    precision = len(hits) / max(len(recommended), 1)
    recall = len(hits) / max(len(hidden), 1)
    hit_rate = 1.0 if hits else 0.0

    return EvaluationResponse(
        user_id=user_id,
        model=model,
        k=k,
        metrics=EvaluationMetrics(
            precision_at_k=round(precision, 4),
            recall_at_k=round(recall, 4),
            hit_rate=round(hit_rate, 4),
        ),
        hidden_future_item_ids=hidden,
        hits=hits,
        misses=misses,
    )


def dashboard_summary(k: int = 6) -> DashboardSummary:
    dataset = get_dataset()
    users = dataset.users["user_id"].tolist()
    models: list[DashboardModelSummary] = []

    for model in SUPPORTED_MODELS:
        user_metrics = [evaluate_user(user_id=user_id, model=model, k=k).metrics for user_id in users]
        models.append(
            DashboardModelSummary(
                model=model,
                precision_at_k=round(sum(metric.precision_at_k for metric in user_metrics) / len(user_metrics), 4),
                recall_at_k=round(sum(metric.recall_at_k for metric in user_metrics) / len(user_metrics), 4),
                hit_rate=round(sum(metric.hit_rate for metric in user_metrics) / len(user_metrics), 4),
            )
        )

    return DashboardSummary(
        users=len(dataset.users),
        items=len(dataset.products),
        train_interactions=len(dataset.train_interactions),
        hidden_future_interactions=len(dataset.test_interactions),
        models=models,
    )
