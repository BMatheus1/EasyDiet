from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from math import ceil
from typing import Iterable

from .catalog import CATALOG_BY_ID, Ingredient


TIER_ORDER = {"common": 1, "premium": 2, "super_premium": 3}
MARGINS = {"common": 0.45, "premium": 0.55, "super_premium": 0.65}
COMMERCIAL_DELIVERY_PRICES = [14.90, 19.90, 24.90, 29.90, 34.90, 39.90, 49.90, 59.90]
MEAL_COSTS = {
    "packaging_cost": 1.50,
    "label_cost": 0.20,
    "seasoning_cost": 0.60,
    "energy_cost": 0.90,
    "labor_cost": 4.50,
}
ORDER_COSTS = {
    "order_handling_cost": 5.00,
    "support_cost": 2.00,
    "thermal_bag_cost": 3.00,
    "operation_reserve_percentage": 0.08,
    "payment_fee_percentage": 0.03,
}
DELIVERY = {
    "delivery_base_fee": 8.00,
    "delivery_price_per_km": 2.20,
    "delivery_price_per_minute": 0.35,
    "cold_transport_fee": 4.00,
    "max_delivery_distance_km": 30,
}
MINIMUM_PROFIT_PER_MEAL = 8.00
QUOTE_TTL_MINUTES = 30
BATCH_CAPACITY_MEALS = 100
BATCH_SAFETY_LIMIT_MEALS = 90


class PricingError(ValueError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True)
class MealGrams:
    protein: int
    carb: int
    vegetable: int


@dataclass(frozen=True)
class Address:
    zip_code: str
    street: str
    number: str
    district: str
    city: str
    complement: str = ""
    reference: str = ""


@dataclass(frozen=True)
class QuoteRequest:
    weeks: int
    days_per_week: int
    meal_types: tuple[str, ...]
    grams: dict[str, MealGrams]
    protein_ids: tuple[str, ...]
    carb_ids: tuple[str, ...]
    vegetable_ids: tuple[str, ...]
    restrictions: tuple[str, ...]
    address: Address
    paid_at: datetime | None = None
    now: datetime | None = None


def calculate_quote(request: QuoteRequest) -> dict:
    validate_plan(request)
    ingredients = selected_ingredients(request)
    assert_ingredients_allowed(ingredients, request.restrictions)

    total_meals = request.weeks * request.days_per_week * len(request.meal_types)
    tier = highest_tier(ingredients)
    shopping = build_shopping_list(request, total_meals)
    ingredient_cost = sum(item["estimated_cost"] for item in shopping)
    operational_per_meal = sum(MEAL_COSTS.values()) * total_meals
    order_fixed_cost = sum(value for key, value in ORDER_COSTS.items() if not key.endswith("percentage"))
    delivery = calculate_delivery(request.address)
    reserve = (ingredient_cost + operational_per_meal + order_fixed_cost + delivery["internal_cost"]) * ORDER_COSTS[
        "operation_reserve_percentage"
    ]
    pre_fee_cost = ingredient_cost + operational_per_meal + order_fixed_cost + delivery["internal_cost"] + reserve
    payment_fee = pre_fee_cost * ORDER_COSTS["payment_fee_percentage"]
    waste = ingredient_cost * 0.03
    total_cost = pre_fee_cost + payment_fee + waste
    margin = MARGINS[tier]
    meal_subtotal = total_cost / (1 - margin)
    minimum_price = total_cost + (MINIMUM_PROFIT_PER_MEAL * total_meals)
    meal_subtotal = max(meal_subtotal, minimum_price)
    meal_subtotal = money(meal_subtotal)
    delivery_price = delivery["public_price"]
    final_price = money(meal_subtotal + delivery_price)
    profit = money(final_price - delivery_price - total_cost)
    real_margin = round(profit / (final_price - delivery_price), 4) if final_price > delivery_price else 0
    prep_days = calculate_preparation_days(tier, total_meals, request.paid_at)
    now = request.now or datetime.now()

    return {
        "client": {
            "total_meals": total_meals,
            "meal_subtotal": meal_subtotal,
            "delivery_fee": delivery_price,
            "final_price": final_price,
            "preparation_days": prep_days,
            "quote_expires_at": (now + timedelta(minutes=QUOTE_TTL_MINUTES)).isoformat(),
            "message": (
                "Seu pedido sera preparado apos a confirmacao do pagamento. "
                "O prazo considera compra dos ingredientes, preparo, pesagem, congelamento, embalagem e entrega."
            ),
        },
        "admin": {
            "ingredient_cost": money(ingredient_cost),
            "operational_cost": money(operational_per_meal + order_fixed_cost + reserve + payment_fee + waste),
            "delivery_internal_cost": delivery["internal_cost"],
            "total_cost": money(total_cost),
            "price_final": final_price,
            "estimated_profit": profit,
            "estimated_margin": real_margin,
            "tier_margin_used": tier,
            "shopping_list": shopping,
            "quantity_per_week": request.days_per_week * len(request.meal_types),
            "quantity_total_plan": total_meals,
            "batch": assign_batch(total_meals),
            "production_plan": build_production_plan(request),
            "labels": build_labels_preview(request),
        },
    }


def validate_plan(request: QuoteRequest) -> None:
    if request.weeks not in {1, 2, 3, 4}:
        raise PricingError("invalid_weeks", "Escolha um plano entre 1 e 4 semanas.")
    if request.days_per_week not in {3, 5, 7}:
        raise PricingError("invalid_days", "Escolha 3, 5 ou 7 dias por semana.")
    if not request.meal_types or any(meal not in {"lunch", "dinner"} for meal in request.meal_types):
        raise PricingError("invalid_meals", "Escolha almoco, jantar ou ambos.")
    for meal in request.meal_types:
        if meal not in request.grams:
            raise PricingError("missing_grams", "Informe as gramagens de todas as refeicoes.")
    if not request.protein_ids or not request.carb_ids or not request.vegetable_ids:
        raise PricingError("missing_ingredients", "Escolha ao menos uma proteina, um carboidrato e um legume.")


def selected_ingredients(request: QuoteRequest) -> list[Ingredient]:
    ids = [*request.protein_ids, *request.carb_ids, *request.vegetable_ids]
    try:
        ingredients = [CATALOG_BY_ID[item_id] for item_id in ids]
    except KeyError as exc:
        raise PricingError("ingredient_not_found", "Ingrediente nao encontrado.") from exc
    unavailable = [item.name for item in ingredients if not item.is_available]
    if unavailable:
        raise PricingError("ingredient_unavailable", f"Ingrediente indisponivel: {', '.join(unavailable)}.")
    return ingredients


def assert_ingredients_allowed(ingredients: Iterable[Ingredient], restrictions: Iterable[str]) -> None:
    restrictions = set(restrictions)
    checks = {
        "no_lactose": ("contains_lactose", "sem lactose"),
        "no_gluten": ("contains_gluten", "sem gluten"),
        "no_egg": ("contains_egg", "sem ovo"),
        "no_fish": ("contains_fish", "sem peixe"),
        "no_seafood": ("contains_seafood", "sem frutos do mar"),
        "no_red_meat": ("is_red_meat", "sem carne vermelha"),
        "no_pork": ("contains_pork", "sem carne suina"),
    }
    for item in ingredients:
        if "vegetarian" in restrictions and not item.is_vegetarian and item.category == "protein":
            raise PricingError("restriction_blocked", f"{item.name} nao atende a restricao vegetariana.")
        if "vegan" in restrictions and not item.is_vegan:
            raise PricingError("restriction_blocked", f"{item.name} nao atende a restricao vegana.")
        for key, (attr, label) in checks.items():
            if key in restrictions and getattr(item, attr):
                raise PricingError("restriction_blocked", f"{item.name} nao atende a restricao {label}.")


def build_shopping_list(request: QuoteRequest, total_meals: int) -> list[dict]:
    totals: dict[str, dict] = {}
    meal_slots = request.weeks * request.days_per_week
    for index in range(meal_slots):
        for meal_type in request.meal_types:
            grams = request.grams[meal_type]
            choices = [
                (request.protein_ids[index % len(request.protein_ids)], grams.protein),
                (request.carb_ids[index % len(request.carb_ids)], grams.carb),
                (request.vegetable_ids[index % len(request.vegetable_ids)], grams.vegetable),
            ]
            for ingredient_id, cooked_grams in choices:
                add_shopping_item(totals, CATALOG_BY_ID[ingredient_id], cooked_grams)
    return list(totals.values())


def add_shopping_item(totals: dict[str, dict], ingredient: Ingredient, cooked_grams: int) -> None:
    cooked_kg = cooked_grams / 1000
    raw_kg = (cooked_kg / ingredient.yield_factor) * (1 + ingredient.safety_percentage)
    cost = raw_kg * ingredient.price_per_kg_calc
    row = totals.setdefault(
        ingredient.id,
        {
            "ingredient_id": ingredient.id,
            "name": ingredient.name,
            "category": ingredient.category,
            "subcategory": ingredient.subcategory,
            "raw_kg_needed": 0.0,
            "cooked_kg_expected": 0.0,
            "estimated_cost": 0.0,
            "supplier_reference": ingredient.supplier_reference,
            "price_per_kg_calc": ingredient.price_per_kg_calc,
        },
    )
    row["raw_kg_needed"] = round(row["raw_kg_needed"] + raw_kg, 3)
    row["cooked_kg_expected"] = round(row["cooked_kg_expected"] + cooked_kg, 3)
    row["estimated_cost"] = money(row["estimated_cost"] + cost)


def calculate_delivery(address: Address) -> dict:
    city = normalize(address.city)
    district = normalize(address.district)
    if "cooperativa" in district and "bernardo" in city:
        distance_km, duration_min = 5, 15
    elif "sao bernardo" in city or "bernardo do campo" in city:
        distance_km, duration_min = 10, 25
    elif "santo andre" in city:
        distance_km, duration_min = 18, 40
    elif "sao caetano" in city:
        distance_km, duration_min = 20, 45
    elif "diadema" in city:
        distance_km, duration_min = 16, 35
    elif "maua" in city:
        distance_km, duration_min = 28, 60
    else:
        raise PricingError("delivery_unavailable", "Ainda nao atendemos sua regiao.")
    if distance_km > DELIVERY["max_delivery_distance_km"]:
        raise PricingError("delivery_unavailable", "Ainda nao atendemos sua regiao.")
    raw = (
        DELIVERY["delivery_base_fee"]
        + distance_km * DELIVERY["delivery_price_per_km"]
        + duration_min * DELIVERY["delivery_price_per_minute"]
        + DELIVERY["cold_transport_fee"]
    )
    public_price = next((price for price in COMMERCIAL_DELIVERY_PRICES if price >= raw), COMMERCIAL_DELIVERY_PRICES[-1])
    return {
        "distance_km": distance_km,
        "duration_min": duration_min,
        "internal_cost": money(raw),
        "public_price": public_price,
    }


def calculate_preparation_days(tier: str, total_meals: int, paid_at: datetime | None = None) -> int:
    days = {"common": 3, "premium": 4, "super_premium": 5}[tier]
    if total_meals > 40:
        days += 2
    elif total_meals > 20:
        days += 1
    if paid_at and paid_at.hour >= 18:
        days += 1
    return days


def highest_tier(ingredients: Iterable[Ingredient]) -> str:
    return max((item.tier for item in ingredients), key=lambda tier: TIER_ORDER[tier])


def assign_batch(total_meals: int) -> dict:
    if total_meals > BATCH_CAPACITY_MEALS:
        return {"status": "next_batch", "alert": "Pedido excede a capacidade do lote atual."}
    if total_meals > BATCH_SAFETY_LIMIT_MEALS:
        return {"status": "open", "alert": "Lote acima do limite de seguranca."}
    return {"status": "open", "alert": None}


def build_production_plan(request: QuoteRequest) -> list[dict]:
    days = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"]
    plan = []
    for week in range(1, request.weeks + 1):
        for day_index in range(request.days_per_week):
            for meal_type in request.meal_types:
                grams = request.grams[meal_type]
                slot = day_index + ((week - 1) * request.days_per_week)
                plan.append(
                    {
                        "week": week,
                        "day": days[day_index],
                        "meal": "Almoco" if meal_type == "lunch" else "Jantar",
                        "protein": CATALOG_BY_ID[request.protein_ids[slot % len(request.protein_ids)]].name,
                        "carb": CATALOG_BY_ID[request.carb_ids[slot % len(request.carb_ids)]].name,
                        "vegetable": CATALOG_BY_ID[request.vegetable_ids[slot % len(request.vegetable_ids)]].name,
                        "grams": asdict(grams),
                    }
                )
    return plan


def build_labels_preview(request: QuoteRequest) -> list[dict]:
    return [
        {
            "brand": "EasyDiet",
            "customer": "Cliente",
            "order_id": "preview",
            "week": item["week"],
            "day": item["day"],
            "meal": item["meal"],
            "ingredients": f"{item['protein']} + {item['carb']} + {item['vegetable']}",
            "grams": item["grams"],
            "restrictions": list(request.restrictions),
        }
        for item in build_production_plan(request)[:12]
    ]


def quote_is_expired(expires_at: str, now: datetime | None = None) -> bool:
    return (now or datetime.now()) > datetime.fromisoformat(expires_at)


def normalize(value: str) -> str:
    replacements = str.maketrans("ãáàâéêíóôõúç", "aaaaeeiooouc")
    return value.lower().translate(replacements).strip()


def money(value: float) -> float:
    return round(value + 1e-9, 2)


def raw_needed(cooked_grams: int, yield_factor: float, safety_percentage: float) -> float:
    return (cooked_grams / yield_factor) * (1 + safety_percentage)
