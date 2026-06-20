from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class IngredientModel(Base):
    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    category: Mapped[str] = mapped_column(String(40), index=True)
    subcategory: Mapped[str] = mapped_column(String(80), index=True)
    price_per_kg_real: Mapped[float] = mapped_column(Float)
    price_per_kg_calc: Mapped[float] = mapped_column(Float)
    yield_factor: Mapped[float] = mapped_column(Float)
    tier: Mapped[str] = mapped_column(String(40))
    lead_time_hours: Mapped[int] = mapped_column(Integer)
    safety_percentage: Mapped[float] = mapped_column(Float)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    flags: Mapped[dict] = mapped_column(JSON, default=dict)
    supplier_reference: Mapped[str] = mapped_column(String(120), default="Joanin")
    last_price_update: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class OrderModel(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_name: Mapped[str] = mapped_column(String(160), index=True)
    customer_phone: Mapped[str] = mapped_column(String(80))
    payment_status: Mapped[str] = mapped_column(String(40), index=True)
    order_status: Mapped[str] = mapped_column(String(40), index=True)
    payload: Mapped[dict] = mapped_column(JSON)
    quote: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
