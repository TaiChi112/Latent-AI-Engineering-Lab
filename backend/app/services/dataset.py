from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd


DATA_DIR = Path(__file__).resolve().parents[2] / "data"


@dataclass
class DatasetBundle:
    users: pd.DataFrame
    products: pd.DataFrame
    interactions: pd.DataFrame
    train_interactions: pd.DataFrame
    test_interactions: pd.DataFrame


def _load_csv(name: str) -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / name)


def load_dataset() -> DatasetBundle:
    users = _load_csv("users.csv")
    products = _load_csv("products.csv")
    interactions = _load_csv("interactions.csv")
    interactions["timestamp"] = pd.to_datetime(interactions["timestamp"], utc=True)
    interactions = interactions.sort_values(["user_id", "timestamp"]).reset_index(drop=True)

    train_parts: list[pd.DataFrame] = []
    test_parts: list[pd.DataFrame] = []

    for _, group in interactions.groupby("user_id", sort=False):
        if len(group) < 2:
            train_parts.append(group)
            test_parts.append(group.iloc[0:0])
            continue
        train_parts.append(group.iloc[:-1])
        test_parts.append(group.iloc[-1:])

    train_interactions = pd.concat(train_parts, ignore_index=True)
    test_interactions = pd.concat(test_parts, ignore_index=True)

    return DatasetBundle(
        users=users,
        products=products,
        interactions=interactions,
        train_interactions=train_interactions,
        test_interactions=test_interactions,
    )
