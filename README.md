# Puregold Inventory Management System

A comprehensive web-based inventory management and ordering system powered by AI, built with FastAPI, React, SQLite, and OpenAI GPT-5.

## 🚀 Features

### Core Features
- **User Authentication & Role-Based Access Control**
  - Roles: Admin, Manager, Staff
  - No password hashing (as per requirement)
  - Session-based authentication

- **Product Management**
  - Add, edit, delete products
  - SKU management
  - Category organization
  - Supplier linkage
  - Low stock alerts
  - Real-time stock tracking

- **Order Processing**
  - Create multi-item orders
  - Order status management (Pending, Processing, Completed, Cancelled)
  - Automatic stock deduction
  - Order history tracking

- **Supplier Management**
  - Add and manage suppliers
  - Contact information tracking
  - Product-supplier relationships

- **Stock Transaction Tracking**
  - Stock In (additions)
  - Stock Out (removals)
  - Adjustments (set exact amount)
  - Complete transaction history
  - User tracking for each transaction

### AI-Powered Features (OpenAI GPT-5)
1. **Inventory Forecasting**
   - Predicts future demand based on historical data
   - Recommends reorder dates
   - Suggests optimal order quantities
   - Risk assessment (low/medium/high)

2. **Smart Reorder Suggestions**
   - Analyzes low stock items
   - AI-powered quantity recommendations
   - Cost-efficiency considerations

3. **Product Categorization**
   - Automatic category assignment
   - Enhanced product description generation
   - Tag suggestions

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy (async)
- **ORM**: SQLAlchemy with aiosqlite
- **AI Integration**: OpenAI GPT-5 via emergentintegrations
- **API Documentation**: Auto-generated Swagger/OpenAPI

### Frontend
- **Framework**: React 19
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Fonts**: Space Grotesk, Inter
- **Notifications**: Sonner (toast notifications)
- **Icons**: Lucide React

### Database Schema
- **Users**: id, username, email, password, role, created_at
- **Products**: id, name, sku, description, category, price, cost, quantity, reorder_level, supplier_id
- **Suppliers**: id, name, contact_person, email, phone, address
- **Orders**: id, order_date, status, total_amount, created_by, notes
- **OrderItems**: id, order_id, product_id, quantity, price
- **StockTransactions**: id, product_id, transaction_type, quantity, user_id, notes, transaction_date

## 📁 Project Structure

```
/app/
├── backend/
│   ├── server.py           # Main FastAPI application
│   ├── database.py         # Database configuration
│   ├── models.py          # SQLAlchemy models
│   ├── schemas.py         # Pydantic schemas
│   ├── .env               # Environment variables
│   ├── requirements.txt   # Python dependencies
│   └── instance/
│       └── puregold.db    # SQLite database
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React app
│   │   ├── App.css        # Global styles
│   │   ├── pages/         # Page components
│   │   │   ├── LoginPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Suppliers.jsx
│   │   │   ├── StockTransactions.jsx
│   │   │   └── AIFeatures.jsx
│   │   └── components/
│   │       ├── Layout.jsx  # Main layout with sidebar
│   │       └── ui/         # Shadcn UI components
│   ├── package.json
│   └── .env
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- yarn

### Installation

1. **Backend Setup**
```bash
cd /app/backend
pip install -r requirements.txt
```

2. **Frontend Setup**
```bash
cd /app/frontend
yarn install
```

### Configuration

**Backend (.env)**
```env
DATABASE_URL=sqlite+aiosqlite:///./instance/puregold.db
EMERGENT_LLM_KEY=sk-emergent-864001031A5C4941b5
CORS_ORIGINS=*
```

**Frontend (.env)**
```env
REACT_APP_BACKEND_URL=https://inventory-ai-9.preview.emergentagent.com
```

### Running the Application

The application is managed by supervisord:

```bash
# Restart all services
sudo supervisorctl restart all

# Restart individual services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# Check status
sudo supervisorctl status
```

### Default User
After registration, use these credentials:
- **Username**: admin
- **Password**: admin123
- **Role**: admin

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/users` - Get all users

### Products
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product
- `GET /api/products/low-stock/alerts` - Get low stock alerts

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/{id}` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/{id}/status` - Update order status

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/{id}` - Get single supplier
- `POST /api/suppliers` - Create supplier
- `DELETE /api/suppliers/{id}` - Delete supplier

### Stock Transactions
- `GET /api/stock/transactions` - Get all transactions
- `POST /api/stock/transactions` - Record transaction

### AI Features
- `POST /api/ai/forecast` - Generate inventory forecast
- `POST /api/ai/reorder-suggestions` - Get reorder suggestions
- `POST /api/ai/categorize` - Categorize product

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🎨 Design Features

### Modern UI/UX
- **Glass-morphism effects** with backdrop blur
- **Gradient accents** for visual appeal
- **Smooth animations** and transitions
- **Responsive design** for all screen sizes
- **Dark theme** optimized for long usage
- **Interactive elements** with hover states

### Color Scheme
- Primary: Blue (600-700) to Indigo (600-700)
- Success: Green (400-600)
- Warning: Orange/Yellow (400-600)
- Danger: Red (400-600)
- Background: Slate (800-900)
- Text: White/Slate (300-400)

### Typography
- Headings: Space Grotesk
- Body: Inter
- Monospace: Font-mono (for SKUs)

## 🔒 Security Notes

**Important**: As per requirements, passwords are **not hashed**. This is suitable for development/internal use only. For production deployment, implement proper password hashing (bcrypt, argon2, etc.).

## 🧪 Testing

The system has been tested with:
- User registration and authentication
- Product CRUD operations
- Order creation and management
- Stock transaction recording
- AI features (categorization, forecasting)
- Dashboard statistics

## 📈 Future Enhancements

- Barcode scanning support
- Export reports (PDF, Excel)
- Email notifications
- Multi-warehouse support
- Advanced analytics dashboard
- Mobile app

## 🐛 Troubleshooting

### Database Issues
```bash
# Check database location
ls -la /app/backend/instance/

# Reset database (delete and restart backend)
rm /app/backend/instance/puregold.db
sudo supervisorctl restart backend
```

### Service Issues
```bash
# Check logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.err.log
```

## 📄 License

This project is built for Puregold Inventory Management.

## 👨‍💻 Development

Built with ❤️ using FastAPI, React, and OpenAI GPT-5.

---

**Note**: The SQLite database is stored in `/app/backend/instance/puregold.db`. This is a production-ready setup that can handle thousands of transactions efficiently.
