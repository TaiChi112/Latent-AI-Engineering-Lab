from __future__ import annotations

from abc import ABC, abstractmethod
from collections import defaultdict
from dataclasses import dataclass
from itertools import combinations

from app.models import ModelName
from app.services.dataset import DatasetBundle


@dataclass
class RecommendationResult:
    item_id: str
    score: float
    reason: str


class BaseRecommender(ABC):
    def __init__(self, dataset: DatasetBundle) -> None:
        self.dataset = dataset

    @abstractmethod
    def recommend(self, user_id: str, k: int) -> list[RecommendationResult]:
        raise NotImplementedError


class PopularityRecommender(BaseRecommender):
    def __init__(self, dataset: DatasetBundle) -> None:
        super().__init__(dataset)
        counts = (
            dataset.train_interactions.groupby("item_id")
            .size()
            .sort_values(ascending=False)
        )
        self.popularity = counts.to_dict()

    def recommend(self, user_id: str, k: int) -> list[RecommendationResult]:
        seen = set(
            self.dataset.train_interactions.loc[
                self.dataset.train_interactions["user_id"] == user_id, "item_id"
            ].tolist()
        )

        candidates = [
            RecommendationResult(
                item_id=item_id,
                score=float(score),
                reason="Popular across all shoppers in the training history",
            )
            for item_id, score in self.popularity.items()
            if item_id not in seen
        ]
        return candidates[:k]


class ItemCooccurrenceRecommender(BaseRecommender):
    def __init__(self, dataset: DatasetBundle) -> None:
        super().__init__(dataset)
        self.similarity: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
        grouped = dataset.train_interactions.groupby("user_id")["item_id"].apply(list)

        for items in grouped:
            unique_items = sorted(set(items))
            for left, right in combinations(unique_items, 2):
                self.similarity[left][right] += 1.0
                self.similarity[right][left] += 1.0

        self.popularity = (
            dataset.train_interactions.groupby("item_id").size().sort_values(ascending=False).to_dict()
        )

    def recommend(self, user_id: str, k: int) -> list[RecommendationResult]:
        history = self.dataset.train_interactions.loc[
            self.dataset.train_interactions["user_id"] == user_id, "item_id"
        ].tolist()
        seen = set(history)
        scores: dict[str, float] = defaultdict(float)

        for item_id in history:
            for neighbor, value in self.similarity.get(item_id, {}).items():
                if neighbor in seen:
                    continue
                scores[neighbor] += value

        ranked = sorted(
            scores.items(),
            key=lambda pair: (pair[1], self.popularity.get(pair[0], 0)),
            reverse=True,
        )

        if len(ranked) < k:
            existing_ranked = {item_id for item_id, _ in ranked}
            for item_id, popularity in self.popularity.items():
                if item_id in seen or item_id in existing_ranked:
                    continue
                ranked.append((item_id, float(popularity)))
                if len(ranked) >= k:
                    break

        return [
            RecommendationResult(
                item_id=item_id,
                score=float(score),
                reason="Recommended from similar historical baskets in the training history",
            )
            for item_id, score in ranked[:k]
        ]


def build_recommender(model: ModelName, dataset: DatasetBundle) -> BaseRecommender:
    available_models: dict[ModelName, type[BaseRecommender]] = {
        "popularity": PopularityRecommender,
        "item_cooccurrence": ItemCooccurrenceRecommender,
    }
    return available_models[model](dataset)
