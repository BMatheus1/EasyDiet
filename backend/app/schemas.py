from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


PaymentStatus = Literal["pending", "approved", "rejected", "expired", "refunded"]
OrderStatus = Literal[
    "draft",
    "awaiting_payment",
    "payment_approved",
    "assigned_to_batch",
    "shopping_pending",
    "in_production",
    "freezing",
    "ready_for_delivery",
    "out_for_delivery",
    "delivered",
    "canceled",
]


class MealGramsIn(BaseModel):
    protein: int = Field(ge=0)
    carb: int = Field(ge=0)
    vegetable: int = Field(ge=0)


class AddressIn(BaseModel):
    zip_code: str
    street: str
    number: str
    district: str
    city: str
    complement: str = ""
    reference: str = ""


class QuoteIn(BaseModel):
    weeks: int
    days_per_week: int
    meal_types: list[Literal["lunch", "dinner"]]
    grams: dict[Literal["lunch", "dinner"], MealGramsIn]
    protein_ids: list[str]
    carb_ids: list[str]
    vegetable_ids: list[str]
    restrictions: list[str] = []
    address: AddressIn


class OrderIn(QuoteIn):
    customer_name: str
    customer_phone: str


class OrderOut(BaseModel):
    id: int
    customer_name: str
    customer_phone: str
    payment_status: PaymentStatus
    order_status: OrderStatus
    quote: dict
    request: dict
    created_at: datetime
