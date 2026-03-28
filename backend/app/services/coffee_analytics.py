from __future__ import annotations

from collections import Counter
from functools import lru_cache
from itertools import combinations

from app.models import CoffeePairing, CoffeeUserInsight, DashboardModelSummary, DashboardSummary, EvaluationMetrics, EvaluationResponse, RecommendationResponse, RecommendedProduct, UserSummary
from app.services.coffee_dataset import CoffeeDatasetBundle, load_coffee_dataset
from app.services.recommender import build_recommender


SUPPORTED_MODELS = ("popularity", "item_cooccurrence")


@lru_cache(maxsize=1)
def get_coffee_dataset() -> CoffeeDatasetBundle:
    return load_coffee_dataset()


def list_coffee_users() -> list[UserSummary]:
    dataset = get_coffee_dataset()
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


def _product_payload(dataset: CoffeeDatasetBundle, item_id: str, score: float, reason: str) -> RecommendedProduct:
    product = dataset.products.loc[dataset.products["item_id"] == item_id].iloc[0]
    return RecommendedProduct(
        item_id=item_id,
        title=str(product["title"]),
        category=str(product["category"]),
        price=float(product["price"]),
        score=round(score, 4),
        reason=reason,
    )


def get_coffee_recommendations(user_id: str, model: str, k: int) -> RecommendationResponse:
    dataset = get_coffee_dataset()
    recommender = build_recommender(model, dataset)  # shared recommenders operate on the same shape
    recommendations = recommender.recommend(user_id=user_id, k=k)
    history = dataset.train_interactions.loc[
        dataset.train_interactions["user_id"] == user_id, "item_id"
    ].tolist()

    return RecommendationResponse(
        user_id=user_id,
        model=model,
        recommendations=[
            _product_payload(dataset, rec.item_id, rec.score, rec.reason) for rec in recommendations
        ],
        train_history_item_ids=history,
    )


def evaluate_coffee_user(user_id: str, model: str, k: int) -> EvaluationResponse:
    response = get_coffee_recommendations(user_id=user_id, model=model, k=k)
    dataset = get_coffee_dataset()
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


def coffee_dashboard_summary(k: int = 6) -> DashboardSummary:
    dataset = get_coffee_dataset()
    users = dataset.users["user_id"].tolist()
    models: list[DashboardModelSummary] = []

    for model in SUPPORTED_MODELS:
        user_metrics = [evaluate_coffee_user(user_id=user_id, model=model, k=k).metrics for user_id in users]
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


def _daypart_from_hour(hour: int) -> str:
    if hour < 11:
        return "Morning"
    if hour < 14:
        return "Lunch"
    if hour < 17:
        return "Afternoon"
    return "Evening"


def coffee_user_insight(user_id: str) -> CoffeeUserInsight:
    dataset = get_coffee_dataset()
    user_history = dataset.train_interactions.loc[dataset.train_interactions["user_id"] == user_id].copy()
    products_by_id = dataset.products.set_index("item_id").to_dict("index")

    drink_counter: Counter[str] = Counter()
    food_counter: Counter[str] = Counter()
    daypart_counter: Counter[str] = Counter()
    pairing_counter: Counter[tuple[str, str]] = Counter()

    for row in user_history.to_dict("records"):
        product = products_by_id[row["item_id"]]
        category = str(product["category"])
        if category in {"Coffee", "Tea"}:
            drink_counter[str(product["title"])] += 1
        else:
            food_counter[str(product["title"])] += 1

        daypart_counter[_daypart_from_hour(row["timestamp"].hour)] += 1

    for _, order_group in user_history.groupby("order_id"):
        titles = [str(products_by_id[item_id]["title"]) for item_id in order_group["item_id"].tolist()]
        for left, right in combinations(sorted(set(titles)), 2):
            pairing_counter[(left, right)] += 1

    recent_order_ids = user_history["order_id"].drop_duplicates().tolist()
    recent_items: list[str] = []
    if recent_order_ids:
        recent_order_id = recent_order_ids[-1]
        recent_items = user_history.loc[user_history["order_id"] == recent_order_id, "item_id"].tolist()

    return CoffeeUserInsight(
        user_id=user_id,
        favorite_drink=drink_counter.most_common(1)[0][0] if drink_counter else None,
        favorite_food=food_counter.most_common(1)[0][0] if food_counter else None,
        preferred_daypart=daypart_counter.most_common(1)[0][0] if daypart_counter else None,
        common_pairings=[
            CoffeePairing(items=[left, right], count=count)
            for (left, right), count in pairing_counter.most_common(3)
        ],
        recent_order_item_ids=recent_items,
    )
