from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, Field
from app.models.finance import PaymentMethod, PaymentStatus


class PaymentCreate(BaseModel):
    member_id: str
    membership_id: Optional[str] = None
    amount: float = Field(gt=0, le=10_000_000)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    method: PaymentMethod = PaymentMethod.UPI
    transaction_ref: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=1000)


class PaymentResponse(BaseModel):
    id: str
    workspace_id: str
    member_id: str
    amount: float
    currency: str
    method: PaymentMethod
    status: PaymentStatus
    transaction_ref: Optional[str] = None
    invoice_id: Optional[str] = None
    paid_at: datetime
    receipt_number: Optional[str] = None
    refunded_amount: float = 0.0
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ExpenseCreate(BaseModel):
    category: str
    title: str
    amount: float
    expense_date: Optional[date] = None
    vendor: Optional[str] = None
    payment_method: str = "bank_transfer"
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: str
    workspace_id: str
    category: str
    title: str
    amount: float
    expense_date: date
    vendor: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FinancialMetrics(BaseModel):
    monthly_revenue: float
    monthly_expenses: float
    net_profit: float
    pending_dues: float


class InvoiceResponse(BaseModel):
    id: str
    workspace_id: str
    invoice_number: str
    member_id: Optional[str] = None
    membership_id: Optional[str] = None
    subtotal: float
    tax_amount: float
    total_amount: float
    amount_paid: Optional[float] = 0.0
    outstanding_balance: Optional[float] = 0.0
    status: str
    due_date: date
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RefundCreate(BaseModel):
    amount: float = Field(gt=0, le=10_000_000)
    reason: str = Field(min_length=3, max_length=500)
    method: str = Field(default="original_method", max_length=20)
    reference: Optional[str] = Field(default=None, max_length=100)


class RefundResponse(BaseModel):
    id: str
    payment_id: str
    member_id: str
    amount: float
    method: str
    reason: str
    status: str
    reference: Optional[str] = None
    processed_by_user_id: Optional[str] = None
    processed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReconciliationClose(BaseModel):
    business_date: date
    counted: dict[str, float]
    notes: Optional[str] = Field(default=None, max_length=1000)


class ReconciliationReopen(BaseModel):
    business_date: date
    reason: str = Field(min_length=3, max_length=500)


class ReconciliationResponse(BaseModel):
    id: str
    business_date: date
    expected: dict
    counted: dict
    variance: dict
    total_expected: float
    total_counted: float
    total_variance: float
    notes: Optional[str] = None
    status: str
    closed_by_user_id: str
    closed_at: datetime

    model_config = ConfigDict(from_attributes=True)
