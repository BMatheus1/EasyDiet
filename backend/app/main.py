from __future__ import annotations

from dataclasses import asdict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .catalog import INGREDIENTS, public_catalog
from .pricing import Address, MealGrams, PricingError, QuoteRequest, calculate_quote
from .schemas import OrderIn, QuoteIn
from .storage import ORDERS, approve_payment, create_order, dashboard, get_order, production_orders

app = FastAPI(title="EasyDiet API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/catalog")
def catalog() -> dict:
    return {"items": public_catalog()}


@app.get("/admin/ingredients")
def admin_ingredients() -> dict:
    return {"items": [asdict(item) for item in INGREDIENTS]}


@app.post("/pricing/quote")
def pricing_quote(payload: QuoteIn) -> dict:
    try:
        quote = calculate_quote(to_quote_request(payload))
    except PricingError as exc:
        raise HTTPException(status_code=422, detail={"code": exc.code, "message": exc.message}) from exc
    return quote["client"]


@app.post("/orders")
def post_order(payload: OrderIn) -> dict:
    try:
        quote = calculate_quote(to_quote_request(payload))
    except PricingError as exc:
        raise HTTPException(status_code=422, detail={"code": exc.code, "message": exc.message}) from exc
    return create_order(payload.model_dump(), quote)


@app.get("/admin/dashboard")
def admin_dashboard() -> dict:
    return dashboard()


@app.get("/admin/orders")
def admin_orders() -> dict:
    return {"items": ORDERS}


@app.get("/admin/orders/production")
def admin_production_orders() -> dict:
    return {"items": production_orders()}


@app.get("/admin/orders/{order_id}")
def admin_order(order_id: int) -> dict:
    order = get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido nao encontrado.")
    return order


@app.post("/orders/{order_id}/simulate-payment-approved")
def simulate_payment(order_id: int) -> dict:
    try:
        return approve_payment(order_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Pedido nao encontrado.") from exc


def to_quote_request(payload: QuoteIn) -> QuoteRequest:
    return QuoteRequest(
        weeks=payload.weeks,
        days_per_week=payload.days_per_week,
        meal_types=tuple(payload.meal_types),
        grams={key: MealGrams(**value.model_dump()) for key, value in payload.grams.items()},
        protein_ids=tuple(payload.protein_ids),
        carb_ids=tuple(payload.carb_ids),
        vegetable_ids=tuple(payload.vegetable_ids),
        restrictions=tuple(payload.restrictions),
        address=Address(**payload.address.model_dump()),
    )
