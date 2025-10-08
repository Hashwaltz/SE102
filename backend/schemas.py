from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from models import UserRole, OrderStatus, TransactionType

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: UserRole = UserRole.staff

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Supplier Schemas
class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float = Field(..., gt=0)
    cost: float = Field(..., gt=0)
    quantity: int = Field(default=0, ge=0)
    reorder_level: int = Field(default=10, ge=0)
    supplier_id: Optional[int] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    quantity: Optional[int] = None
    reorder_level: Optional[int] = None
    supplier_id: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Order Schemas
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: float
    
    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    notes: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    order_date: datetime
    status: OrderStatus
    total_amount: float
    created_by: int
    notes: Optional[str] = None
    items: List[OrderItemResponse]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Stock Transaction Schemas
class StockTransactionCreate(BaseModel):
    product_id: int
    transaction_type: TransactionType
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = None

class StockTransactionResponse(BaseModel):
    id: int
    product_id: int
    transaction_type: TransactionType
    quantity: int
    user_id: int
    notes: Optional[str] = None
    transaction_date: datetime
    
    class Config:
        from_attributes = True

# AI Schemas
class AIForecastRequest(BaseModel):
    product_id: int
    days: int = Field(default=30, ge=1, le=365)

class AIReorderRequest(BaseModel):
    threshold: Optional[float] = 0.8

class AICategorizationRequest(BaseModel):
    product_name: str
    product_description: Optional[str] = None