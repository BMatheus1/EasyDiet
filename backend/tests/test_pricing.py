from __future__ import annotations

import unittest
from dataclasses import replace
from datetime import datetime, timedelta

from app.catalog import CATALOG_BY_ID, Ingredient
from app.pricing import (
    Address,
    MealGrams,
    PricingError,
    QuoteRequest,
    calculate_delivery,
    calculate_preparation_days,
    calculate_quote,
    quote_is_expired,
    raw_needed,
)


def base_request(**overrides) -> QuoteRequest:
    data = {
        "weeks": 1,
        "days_per_week": 5,
        "meal_types": ("lunch", "dinner"),
        "grams": {
            "lunch": MealGrams(protein=150, carb=100, vegetable=100),
            "dinner": MealGrams(protein=120, carb=80, vegetable=120),
        },
        "protein_ids": ("peito-frango",),
        "carb_ids": ("arroz-integral",),
        "vegetable_ids": ("brocolis",),
        "restrictions": (),
        "address": Address(
            zip_code="00000-000",
            street="Rua Teste",
            number="10",
            district="Cooperativa",
            city="Sao Bernardo do Campo",
        ),
    }
    data.update(overrides)
    return QuoteRequest(**data)


class PricingTests(unittest.TestCase):
    def test_chicken_quote(self):
        quote = calculate_quote(base_request())
        self.assertEqual(quote["client"]["total_meals"], 10)
        self.assertGreater(quote["client"]["final_price"], 0)
        self.assertEqual(quote["admin"]["tier_margin_used"], "common")

    def test_file_mignon_quote(self):
        quote = calculate_quote(base_request(protein_ids=("file-mignon",)))
        self.assertEqual(quote["admin"]["tier_margin_used"], "super_premium")
        self.assertEqual(quote["client"]["preparation_days"], 5)

    def test_mixed_common_and_super_premium_uses_highest_margin(self):
        quote = calculate_quote(base_request(protein_ids=("peito-frango", "file-mignon")))
        self.assertEqual(quote["admin"]["tier_margin_used"], "super_premium")

    def test_raw_cooked_yield(self):
        self.assertAlmostEqual(raw_needed(150, 0.75, 0.05), 210.0)

    def test_delivery_by_region(self):
        fee = calculate_delivery(base_request().address)
        self.assertEqual(fee["public_price"], 29.90)

    def test_delivery_blocks_outside_abc(self):
        with self.assertRaises(PricingError):
            calculate_delivery(replace(base_request().address, city="Sao Paulo", district="Pinheiros"))

    def test_common_deadline(self):
        self.assertEqual(calculate_preparation_days("common", 10), 3)

    def test_premium_deadline(self):
        self.assertEqual(calculate_preparation_days("premium", 10), 4)

    def test_super_premium_deadline(self):
        self.assertEqual(calculate_preparation_days("super_premium", 10), 5)

    def test_more_than_20_meals_adds_day(self):
        self.assertEqual(calculate_preparation_days("common", 21), 4)

    def test_more_than_40_meals_adds_two_days(self):
        self.assertEqual(calculate_preparation_days("common", 41), 5)

    def test_minimum_profit_per_meal(self):
        quote = calculate_quote(base_request())
        profit_per_meal = quote["admin"]["estimated_profit"] / quote["client"]["total_meals"]
        self.assertGreaterEqual(round(profit_per_meal, 2), 8.00)

    def test_expired_quote(self):
        expires_at = (datetime.now() - timedelta(minutes=1)).isoformat()
        self.assertTrue(quote_is_expired(expires_at))

    def test_unavailable_ingredient(self):
        original = CATALOG_BY_ID["peito-frango"]
        CATALOG_BY_ID["peito-frango"] = replace(original, is_available=False)
        try:
            with self.assertRaises(PricingError):
                calculate_quote(base_request())
        finally:
            CATALOG_BY_ID["peito-frango"] = original

    def test_restriction_blocks_ingredient(self):
        with self.assertRaises(PricingError):
            calculate_quote(base_request(protein_ids=("tilapia",), restrictions=("no_fish",)))


if __name__ == "__main__":
    unittest.main()
