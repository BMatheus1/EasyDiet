from __future__ import annotations

from datetime import datetime


ORDERS: list[dict] = []
NEXT_ID = 1024


def create_order(payload: dict, quote: dict) -> dict:
    global NEXT_ID
    order = {
        "id": NEXT_ID,
        "customer_name": payload["customer_name"],
        "customer_phone": payload["customer_phone"],
        "payment_status": "pending",
        "order_status": "awaiting_payment",
        "quote": quote,
        "request": payload,
        "created_at": datetime.now(),
    }
    NEXT_ID += 1
    ORDERS.append(order)
    return order


def get_order(order_id: int) -> dict | None:
    return next((order for order in ORDERS if order["id"] == order_id), None)


def approve_payment(order_id: int) -> dict:
    order = get_order(order_id)
    if not order:
        raise KeyError(order_id)
    order["payment_status"] = "approved"
    order["order_status"] = "payment_approved"
    return order


def production_orders() -> list[dict]:
    return [order for order in ORDERS if order["payment_status"] == "approved"]


def dashboard() -> dict:
    approved = production_orders()
    all_orders = ORDERS
    return {
        "paid_orders": len(approved),
        "awaiting_payment": len([order for order in all_orders if order["payment_status"] == "pending"]),
        "meals_sold": sum(order["quote"]["client"]["total_meals"] for order in approved),
        "confirmed_revenue": round(sum(order["quote"]["client"]["final_price"] for order in approved), 2),
        "estimated_cost": round(sum(order["quote"]["admin"]["total_cost"] for order in approved), 2),
        "estimated_profit": round(sum(order["quote"]["admin"]["estimated_profit"] for order in approved), 2),
        "average_margin": round(
            sum(order["quote"]["admin"]["estimated_margin"] for order in approved) / len(approved),
            4,
        )
        if approved
        else 0,
        "active_batches": 1 if approved else 0,
        "current_batch_meals": sum(order["quote"]["client"]["total_meals"] for order in approved),
    }
