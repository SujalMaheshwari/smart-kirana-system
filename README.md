# 🏪 KiranaOS — Digital Kirana Store Platform

> Helping local kirana shops compete with Swiggy Instamart & Blinkit.  
> Shop owners get a powerful dashboard. Customers scan a QR and order in 2 minutes — no app download needed.

---

## 💡 The Problem

Local kirana shops are losing customers to quick commerce apps like Swiggy Instamart and Blinkit. But these platforms charge high commissions and don't serve the trust-based relationship between a neighbourhood shopkeeper and his regular customers.

**KiranaOS** gives every kirana shop its own digital storefront — free, fast, and built for the way Indian grocery shopping actually works.

---

## ✨ Features

### For Shop Owners
- 📦 **Order Management** — View, update and track all incoming orders in real time
- 🧺 **Inventory Management** — Add products, manage stock, get low stock alerts
- 📊 **Analytics Dashboard** — Daily/weekly revenue, top products, payment split
- 🤖 **AI Assistant** — Gemini-powered chatbot for inventory insights in Hinglish
- 🚚 **Delivery Settings** — Set delivery radius, base charge, per-km rate
- ⭐ **Reviews** — Customers can leave ratings and feedback
- 🌙 **Dark Mode** — Full dark mode support for the dashboard
- 📱 **QR Code Storefront** — Each shop gets a unique URL and QR code

### For Customers
- 🛒 **Browse & Order** — Shop by category, search products, add to cart
- 🛵 **Delivery or Pickup** — Choose home delivery or self-pickup
- 💳 **UPI & COD** — Pay via UPI (with QR) or Cash on Delivery
- 📦 **Order Tracking** — Live tracking via secure UUID token (no login needed)
- 🧾 **Order History** — View past orders by entering phone number
- 🤖 **AI Chatbot** — Ask about products, availability, delivery in natural Hinglish
- 📍 **Map-based Delivery** — Auto-calculates delivery charge based on distance
- 💾 **Remembered Details** — Name, phone, address saved automatically for next visit

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django (Python) |
| Database | SQLite (dev) |
| Frontend | React + Tailwind CSS |
| AI | Google Gemini 2.0 Flash via LangChain |
| Auth | Django Sessions |
| Deployment | Render (backend) + Vercel (frontend) |

---

## 📸 Screenshots

> Shop storefront, owner dashboard, order tracking, and AI chat

| Customer Storefront | Owner Dashboard | Order Tracking |
|---|---|---|
| Browse products by category | Manage orders with live status | Track order via UUID token |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- Google Gemini API key

### 1. Clone the repository
```bash
git clone https://github.com/SujalMaheshwari/smart-kirana-system.git
cd smart-kirana-system
```

### 2. Set up the backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
```

### 3. Create a `.env` file in the `backend/` folder
```
SECRET_KEY=your-django-secret-key
GOOGLE_API_KEY=your-gemini-api-key
DEBUG=True
```

### 4. Run migrations and load sample data
```bash
python manage.py migrate
python manage.py load_sample_data
```

### 5. Start the backend server
```bash
python manage.py runserver
```

### 6. Set up the frontend
```bash
cd ../frontend         # or wherever your React app is
npm install
npm run dev
```

### 7. Open in browser
```
Frontend:  http://localhost:5173
Backend:   http://localhost:8000
```

### 8. Login with sample accounts
| Email | Password | Shop |
|---|---|---|
| rajesh@kirana.local | demo1234 | Kumar Kirana Store |
| priya@kirana.local | demo1234 | Priya General Store |
| vikram@kirana.local | demo1234 | Vikram Supermart |

---

## 🗂️ Project Structure

```
smart-kirana-system/
├── backend/
│   ├── shops/              # Shop model, auth, suppliers, reviews
│   ├── inventory/          # Product model
│   ├── chatbot/            # Orders, AI chat, tracking
│   │   ├── models.py       # Order, OrderItem, CustomerProfile
│   │   ├── views.py        # Checkout, tracking, status update
│   │   └── ai_logic.py     # Gemini customer + admin bots
│   └── manage.py
└── frontend/
    ├── src/
    │   ├── CustomerStorefront.jsx   # Customer shopping experience
    │   ├── TrackOrder.jsx           # Order tracking page
    │   ├── MyOrders.jsx             # Order history by phone
    │   └── OwnerDashboard.jsx       # Shop owner dashboard
    └── package.json
```

---

## 🔐 Security Features

- **UUID-based order tracking** — Order IDs are never exposed to customers. All tracking uses unguessable UUID tokens
- **Shop-scoped data** — Every query is filtered by shop. One shop owner can never see another shop's data
- **CSRF protection** — Django CSRF middleware enabled
- **Auth-gated dashboard** — All owner routes require session authentication

---

## 🛣️ Roadmap

- [ ] OTP-based customer verification
- [ ] Push notifications for order updates
- [ ] Multiple shop support (unified customer app)
- [ ] PostgreSQL for production
- [ ] WhatsApp order notifications for shop owners
- [ ] Subscription plans for shop owners

---

## 🙏 Why KiranaOS?

India has over **12 million** kirana stores. They run on trust, relationships, and community — things no algorithm can replace. KiranaOS gives them the digital tools to survive and thrive without losing what makes them special.

---

## 👨‍💻 Author

**Sujal Maheshwari**  
Built with ❤️ for India's kirana shops

---

## 📄 License

MIT License — free to use, modify and distribute.
