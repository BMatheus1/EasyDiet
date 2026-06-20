from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class Ingredient:
    id: str
    name: str
    category: str
    subcategory: str
    price_per_kg_real: float
    price_per_kg_calc: float
    yield_factor: float
    tier: str
    lead_time_hours: int
    safety_percentage: float
    is_available: bool = True
    contains_lactose: bool = False
    contains_gluten: bool = False
    contains_egg: bool = False
    contains_fish: bool = False
    contains_seafood: bool = False
    contains_pork: bool = False
    is_red_meat: bool = False
    is_vegetarian: bool = False
    is_vegan: bool = False
    supplier_reference: str = "Joanin"
    last_price_update: str = date.today().isoformat()


def _i(
    id: str,
    name: str,
    category: str,
    subcategory: str,
    real: float,
    calc: float,
    yield_factor: float,
    tier: str = "common",
    lead: int = 72,
    safety: float = 0.05,
    **flags: bool,
) -> Ingredient:
    return Ingredient(
        id=id,
        name=name,
        category=category,
        subcategory=subcategory,
        price_per_kg_real=real,
        price_per_kg_calc=calc,
        yield_factor=yield_factor,
        tier=tier,
        lead_time_hours=lead,
        safety_percentage=safety,
        **flags,
    )


INGREDIENTS: list[Ingredient] = [
    _i("peito-frango", "Peito de frango", "protein", "Aves", 16.67, 19.00, 0.75),
    _i("frango-sassami", "Frango sassami", "protein", "Aves", 18.90, 21.90, 0.78),
    _i("sobrecoxa-sem-pele", "Sobrecoxa sem pele", "protein", "Aves", 16.90, 20.00, 0.72, safety=0.06),
    _i("peito-peru", "Peito de peru", "protein", "Aves", 45.00, 55.00, 0.78, "premium", 96, 0.08),
    _i("patinho", "Patinho", "protein", "Bovinas", 39.99, 46.00, 0.72, "premium", 96, 0.08, is_red_meat=True),
    _i("patinho-moido", "Patinho moido", "protein", "Bovinas", 39.99, 46.00, 0.72, "premium", 96, 0.08, is_red_meat=True),
    _i("coxao-mole", "Coxao mole", "protein", "Bovinas", 39.99, 46.00, 0.75, "premium", 96, 0.08, is_red_meat=True),
    _i("coxao-duro", "Coxao duro", "protein", "Bovinas", 36.99, 43.00, 0.72, "common", 96, 0.08, is_red_meat=True),
    _i("lagarto", "Lagarto", "protein", "Bovinas", 42.00, 49.00, 0.76, "premium", 96, 0.08, is_red_meat=True),
    _i("musculo", "Musculo", "protein", "Bovinas", 34.00, 40.00, 0.70, "common", 96, 0.08, is_red_meat=True),
    _i("alcatra", "Alcatra", "protein", "Bovinas premium", 49.90, 60.00, 0.78, "premium", 96, 0.08, is_red_meat=True),
    _i("file-mignon", "File mignon", "protein", "Bovinas premium", 89.90, 109.90, 0.80, "super_premium", 120, 0.10, is_red_meat=True),
    _i("picanha", "Picanha", "protein", "Bovinas premium", 79.90, 99.90, 0.75, "super_premium", 120, 0.10, is_red_meat=True),
    _i("lombo-suino", "Lombo suino", "protein", "Suinas", 29.90, 36.00, 0.75, "premium", 96, 0.08, contains_pork=True),
    _i("pernil-suino", "Pernil suino", "protein", "Suinas", 24.90, 31.00, 0.72, "common", 96, 0.08, contains_pork=True),
    _i("tilapia", "Tilapia", "protein", "Peixes", 49.90, 59.90, 0.82, "premium", 96, 0.08, contains_fish=True),
    _i("salmao", "Salmao", "protein", "Peixes", 99.90, 124.90, 0.82, "super_premium", 120, 0.10, contains_fish=True),
    _i("camarao", "Camarao", "protein", "Frutos do mar", 89.90, 119.90, 0.80, "super_premium", 120, 0.12, contains_seafood=True),
    _i("ovo-galinha", "Ovo de galinha", "protein", "Ovos", 13.00, 16.00, 0.90, contains_egg=True, is_vegetarian=True),
    _i("clara-ovo", "Clara de ovo", "protein", "Ovos", 22.00, 28.00, 0.95, "premium", 96, 0.08, contains_egg=True, is_vegetarian=True),
    _i("tofu", "Tofu", "protein", "Vegetarianas", 32.00, 42.00, 0.90, "premium", 96, 0.08, is_vegetarian=True, is_vegan=True),
    _i("grao-bico", "Grao-de-bico", "protein", "Vegetarianas", 14.00, 18.00, 2.20, is_vegetarian=True, is_vegan=True),
    _i("lentilha", "Lentilha", "protein", "Vegetarianas", 14.00, 18.00, 2.30, is_vegetarian=True, is_vegan=True),
    _i("proteina-soja", "Proteina de soja", "protein", "Vegetarianas", 18.00, 24.00, 2.20, is_vegetarian=True, is_vegan=True),
    _i("arroz-branco", "Arroz branco", "carb", "Arroz e graos", 6.00, 7.50, 2.70),
    _i("arroz-integral", "Arroz integral", "carb", "Arroz e graos", 8.00, 10.00, 2.50),
    _i("batata-doce", "Batata doce", "carb", "Tuberculos", 6.00, 8.00, 0.90),
    _i("batata-inglesa", "Batata inglesa", "carb", "Tuberculos", 5.00, 7.00, 0.90),
    _i("mandioca", "Mandioca", "carb", "Tuberculos", 8.00, 10.00, 0.85),
    _i("mandioquinha", "Mandioquinha", "carb", "Opcoes premium", 18.00, 24.00, 0.85, "premium"),
    _i("quinoa", "Quinoa", "carb", "Opcoes premium", 45.00, 58.00, 2.70, "super_premium", 96, 0.08),
    _i("macarrao-integral", "Macarrao integral", "carb", "Massas", 12.00, 16.00, 2.20, "premium", contains_gluten=True),
    _i("brocolis", "Brocolis", "vegetable", "Legumes comuns", 14.00, 19.00, 0.80),
    _i("cenoura", "Cenoura", "vegetable", "Legumes comuns", 5.00, 7.00, 0.90),
    _i("vagem", "Vagem", "vegetable", "Premium", 16.00, 22.00, 0.85, "premium"),
    _i("abobrinha", "Abobrinha", "vegetable", "Legumes comuns", 7.00, 10.00, 0.85),
    _i("couve-flor", "Couve-flor", "vegetable", "Legumes comuns", 14.00, 20.00, 0.80),
    _i("couve", "Couve", "vegetable", "Verduras", 9.00, 13.00, 0.85),
    _i("espinafre", "Espinafre", "vegetable", "Verduras", 18.00, 25.00, 0.75, "premium"),
    _i("aspargos", "Aspargos", "vegetable", "Premium", 55.00, 75.00, 0.80, "super_premium", 96, 0.08),
    _i("cogumelos", "Cogumelos", "vegetable", "Premium", 45.00, 60.00, 0.85, "super_premium", 96, 0.08, is_vegetarian=True, is_vegan=True),
]


CATALOG_BY_ID = {item.id: item for item in INGREDIENTS}


def public_catalog() -> list[dict]:
    return [
        {
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "subcategory": item.subcategory,
            "tier": item.tier,
            "lead_time_hours": item.lead_time_hours,
            "is_available": item.is_available,
        }
        for item in INGREDIENTS
        if item.is_available
    ]
