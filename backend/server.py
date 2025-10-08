from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from typing import List
from datetime import datetime, timedelta
import json

# Local imports
from database import get_db, init_db
from models import User, Product, Order, OrderItem, Supplier, StockTransaction, OrderStatus, TransactionType
from schemas import (
    UserCreate, UserLogin, UserResponse,
    ProductCreate, ProductUpdate, ProductResponse,
    OrderCreate, OrderResponse,
    SupplierCreate, SupplierResponse,
    StockTransactionCreate, StockTransactionResponse,
    AIForecastRequest, AIReorderRequest, AICategorizationRequest
)

# AI Integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="Puregold Inventory Management System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variable to store current user (simple session management)
current_user_store = {}

# Helper: AI Chat Instance
def get_ai_chat():
    return LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id="puregold-inventory-ai",
        system_message="You are an AI assistant for Puregold inventory management. Provide helpful, concise insights."
    ).with_model("openai", "gpt-5")

# ==================== AUTHENTICATION ROUTES ====================
@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user"""
    # Check if username already exists
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create user (no hashing as per requirement)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        role=user_data.role
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user

@api_router.post("/auth/login")
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login user"""
    result = await db.execute(select(User).where(User.username == credentials.username))
    user = result.scalar_one_or_none()
    
    if not user or user.password != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Store user session (simple approach)
    current_user_store[credentials.username] = {
        "id": user.id,
        "username": user.username,
        "role": user.role.value,
        "email": user.email
    }
    
    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role.value
        }
    }

@api_router.get("/auth/users", response_model=List[UserResponse])
async def get_all_users(db: AsyncSession = Depends(get_db)):
    """Get all users"""
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users

# ==================== PRODUCT ROUTES ====================
@api_router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, db: AsyncSession = Depends(get_db)):
    """Create a new product"""
    # Check if SKU already exists
    result = await db.execute(select(Product).where(Product.sku == product.sku))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    new_product = Product(**product.model_dump())
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    
    return new_product

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(db: AsyncSession = Depends(get_db)):
    """Get all products"""
    result = await db.execute(select(Product))
    products = result.scalars().all()
    return products

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single product"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, product_data: ProductUpdate, db: AsyncSession = Depends(get_db)):
    """Update a product"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update fields
    update_data = product_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    product.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(product)
    
    return product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a product"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.delete(product)
    await db.commit()
    
    return {"message": "Product deleted successfully"}

@api_router.get("/products/low-stock/alerts")
async def get_low_stock_alerts(db: AsyncSession = Depends(get_db)):
    """Get products with low stock"""
    result = await db.execute(
        select(Product).where(Product.quantity <= Product.reorder_level)
    )
    products = result.scalars().all()
    
    return {
        "count": len(products),
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "quantity": p.quantity,
                "reorder_level": p.reorder_level
            } for p in products
        ]
    }

# ==================== SUPPLIER ROUTES ====================
@api_router.post("/suppliers", response_model=SupplierResponse)
async def create_supplier(supplier: SupplierCreate, db: AsyncSession = Depends(get_db)):
    """Create a new supplier"""
    new_supplier = Supplier(**supplier.model_dump())
    db.add(new_supplier)
    await db.commit()
    await db.refresh(new_supplier)
    
    return new_supplier

@api_router.get("/suppliers", response_model=List[SupplierResponse])
async def get_suppliers(db: AsyncSession = Depends(get_db)):
    """Get all suppliers"""
    result = await db.execute(select(Supplier))
    suppliers = result.scalars().all()
    return suppliers

@api_router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(supplier_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single supplier"""
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    return supplier

@api_router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a supplier"""
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    await db.delete(supplier)
    await db.commit()
    
    return {"message": "Supplier deleted successfully"}

# ==================== ORDER ROUTES ====================
@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order_data: OrderCreate, db: AsyncSession = Depends(get_db)):
    """Create a new order"""
    # For now, use the first user as creator (in real app, use authenticated user)
    result = await db.execute(select(User).limit(1))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=400, detail="No users found. Please create a user first.")
    
    # Create order
    new_order = Order(
        created_by=user.id,
        notes=order_data.notes,
        status=OrderStatus.pending
    )
    
    total_amount = 0.0
    order_items = []
    
    # Process order items
    for item in order_data.items:
        # Get product
        result = await db.execute(select(Product).where(Product.id == item.product_id))
        product = result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for {product.name}. Available: {product.quantity}"
            )
        
        # Create order item
        order_item = OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            price=product.price
        )
        order_items.append(order_item)
        
        # Update stock
        product.quantity -= item.quantity
        
        # Calculate total
        total_amount += product.price * item.quantity
        
        # Create stock transaction
        transaction = StockTransaction(
            product_id=product.id,
            transaction_type=TransactionType.out_stock,
            quantity=item.quantity,
            user_id=user.id,
            notes=f"Order created"
        )
        db.add(transaction)
    
    new_order.total_amount = total_amount
    new_order.order_items = order_items
    
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    
    return new_order

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(db: AsyncSession = Depends(get_db)):
    """Get all orders"""
    result = await db.execute(select(Order))
    orders = result.scalars().all()
    return orders

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single order"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: int, status: OrderStatus, db: AsyncSession = Depends(get_db)):
    """Update order status"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status
    order.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(order)
    
    return {"message": "Order status updated", "order": order}

# ==================== STOCK TRANSACTION ROUTES ====================
@api_router.post("/stock/transactions", response_model=StockTransactionResponse)
async def create_stock_transaction(
    transaction_data: StockTransactionCreate, 
    db: AsyncSession = Depends(get_db)
):
    """Create a stock transaction"""
    # Get user (use first user for now)
    result = await db.execute(select(User).limit(1))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=400, detail="No users found")
    
    # Get product
    result = await db.execute(select(Product).where(Product.id == transaction_data.product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update product quantity
    if transaction_data.transaction_type == TransactionType.in_stock:
        product.quantity += transaction_data.quantity
    elif transaction_data.transaction_type == TransactionType.out_stock:
        if product.quantity < transaction_data.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        product.quantity -= transaction_data.quantity
    else:  # adjustment
        product.quantity = transaction_data.quantity
    
    # Create transaction
    transaction = StockTransaction(
        product_id=transaction_data.product_id,
        transaction_type=transaction_data.transaction_type,
        quantity=transaction_data.quantity,
        user_id=user.id,
        notes=transaction_data.notes
    )
    
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    
    return transaction

@api_router.get("/stock/transactions", response_model=List[StockTransactionResponse])
async def get_stock_transactions(db: AsyncSession = Depends(get_db)):
    """Get all stock transactions"""
    result = await db.execute(select(StockTransaction).order_by(StockTransaction.transaction_date.desc()))
    transactions = result.scalars().all()
    return transactions

# ==================== AI ROUTES ====================
@api_router.post("/ai/forecast")
async def ai_forecast(request: AIForecastRequest, db: AsyncSession = Depends(get_db)):
    """AI-powered inventory forecasting"""
    # Get product
    result = await db.execute(select(Product).where(Product.id == request.product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get recent transactions
    result = await db.execute(
        select(StockTransaction)
        .where(StockTransaction.product_id == request.product_id)
        .order_by(StockTransaction.transaction_date.desc())
        .limit(30)
    )
    transactions = result.scalars().all()
    
    # Prepare data for AI
    transaction_data = [
        {
            "date": t.transaction_date.isoformat(),
            "type": t.transaction_type.value,
            "quantity": t.quantity
        } for t in transactions
    ]
    
    # Get AI insights
    chat = get_ai_chat()
    message = UserMessage(
        text=f"""Analyze this product's inventory data and provide a forecast for the next {request.days} days:
        
Product: {product.name} (SKU: {product.sku})
Current Stock: {product.quantity}
Reorder Level: {product.reorder_level}
Recent Transactions: {json.dumps(transaction_data)}

Provide:
1. Predicted demand for next {request.days} days
2. Recommended reorder date
3. Suggested order quantity
4. Risk assessment (low/medium/high)

Format as JSON with keys: predicted_demand, reorder_date, order_quantity, risk_level, analysis"""
    )
    
    try:
        response = await chat.send_message(message)
        return {
            "product_id": product.id,
            "product_name": product.name,
            "current_stock": product.quantity,
            "forecast": response
        }
    except Exception as e:
        logger.error(f"AI forecast error: {e}")
        raise HTTPException(status_code=500, detail="AI forecast failed")

@api_router.post("/ai/reorder-suggestions")
async def ai_reorder_suggestions(request: AIReorderRequest, db: AsyncSession = Depends(get_db)):
    """Get AI-powered reorder suggestions"""
    # Get low stock products
    result = await db.execute(
        select(Product).where(Product.quantity <= Product.reorder_level)
    )
    products = result.scalars().all()
    
    if not products:
        return {"message": "No products need reordering", "suggestions": []}
    
    suggestions = []
    chat = get_ai_chat()
    
    for product in products[:5]:  # Limit to 5 for performance
        message = UserMessage(
            text=f"""Product needs reordering:
Name: {product.name}
Current Stock: {product.quantity}
Reorder Level: {product.reorder_level}
Price: ${product.price}
Cost: ${product.cost}

Suggest optimal order quantity considering:
- Stock level
- Typical turnover
- Cost efficiency

Return only a number representing the suggested quantity."""
        )
        
        try:
            response = await chat.send_message(message)
            suggestions.append({
                "product_id": product.id,
                "product_name": product.name,
                "sku": product.sku,
                "current_stock": product.quantity,
                "reorder_level": product.reorder_level,
                "suggested_quantity": response.strip()
            })
        except Exception as e:
            logger.error(f"AI suggestion error for product {product.id}: {e}")
    
    return {"suggestions": suggestions}

@api_router.post("/ai/categorize")
async def ai_categorize_product(request: AICategorizationRequest):
    """AI-powered product categorization"""
    chat = get_ai_chat()
    
    message = UserMessage(
        text=f"""Categorize this product and generate a professional description:
        
Product Name: {request.product_name}
Description: {request.product_description or 'Not provided'}

Return JSON with:
1. category (single category from: Electronics, Food & Beverage, Household, Personal Care, Clothing, Other)
2. enhanced_description (professional, 2-3 sentences)
3. tags (array of 3-5 relevant tags)"""
    )
    
    try:
        response = await chat.send_message(message)
        return {
            "product_name": request.product_name,
            "ai_response": response
        }
    except Exception as e:
        logger.error(f"AI categorization error: {e}")
        raise HTTPException(status_code=500, detail="AI categorization failed")

# ==================== DASHBOARD ROUTES ====================
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Get dashboard statistics"""
    # Total products
    result = await db.execute(select(func.count(Product.id)))
    total_products = result.scalar()
    
    # Low stock count
    result = await db.execute(
        select(func.count(Product.id)).where(Product.quantity <= Product.reorder_level)
    )
    low_stock_count = result.scalar()
    
    # Total orders
    result = await db.execute(select(func.count(Order.id)))
    total_orders = result.scalar()
    
    # Pending orders
    result = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.pending)
    )
    pending_orders = result.scalar()
    
    # Total inventory value
    result = await db.execute(select(Product))
    products = result.scalars().all()
    inventory_value = sum(p.quantity * p.cost for p in products)
    
    # Recent orders
    result = await db.execute(
        select(Order).order_by(Order.created_at.desc()).limit(5)
    )
    recent_orders = result.scalars().all()
    
    return {
        "total_products": total_products,
        "low_stock_count": low_stock_count,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "inventory_value": round(inventory_value, 2),
        "recent_orders": [
            {
                "id": o.id,
                "order_date": o.order_date.isoformat(),
                "status": o.status.value,
                "total_amount": o.total_amount
            } for o in recent_orders
        ]
    }

# ==================== ROOT ROUTE ====================
@api_router.get("/")
async def root():
    return {
        "message": "Puregold Inventory Management API",
        "version": "1.0.0",
        "features": [
            "User Authentication (Role-based)",
            "Product Management",
            "Order Processing",
            "Stock Tracking",
            "Supplier Management",
            "AI Forecasting",
            "AI Reorder Suggestions",
            "AI Product Categorization"
        ]
    }

# Include the router in the main app
app.include_router(api_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Initializing database...")
    await init_db()
    logger.info("Database initialized successfully!")
