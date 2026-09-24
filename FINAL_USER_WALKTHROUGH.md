# BIRRMIND & MERCATO AI — FINAL CUSTOMER USER WALKTHROUGH
**Target Audience:** Ethiopian Micro, Small, and Medium Business Owners & Operators  
**Platform URL:** `https://birrmind.onrender.com`  

---

## Welcome to BirrMind

**BirrMind** is the complete operating platform designed specifically for Ethiopian merchants, mini-markets, cafes, and retail shops. Embedded directly inside BirrMind is **Mercato AI**—your 24/7 business strategist and financial brain that speaks Amharic, Afaan Oromo, and English.

This guide walks you through every step of using the application, from your very first visit to running daily store operations.

---

### Step 1: Visit BirrMind
- **Action:** Open your browser (on your phone, tablet, or laptop) and navigate to `https://birrmind.onrender.com`.
- **What You See:**
  - A clean, modern homepage tailored for Ethiopian commerce.
  - The hero title: *"The Operating System for Ethiopian MSMEs Powered by Mercato AI"*.
  - Key feature highlights: Instant POS, Telebirr & CBE Cash Tracking, Inventory Optimization, and Voice-Driven Sales.
  - Prominent buttons: **Get Started** and **Sign In**.
  - An instant **"Explore Demo Account"** button if you wish to try the system with sample store data before creating an account.

---

### Step 2: Sign Up
- **Action:** Click **"Get Started"** or navigate to the signup tab.
- **What You See:**
  - A secure registration form requesting your **Full Name**, **Business Email Address**, and a secure **Password**.
  - An option to choose your preferred language interface (English, አማርኛ - Amharic, Afaan Oromoo).
  - Clear terms indicating that your commercial records remain private and encrypted.
- **Outcome:** Submitting the form creates your Supabase account and triggers an email confirmation.

---

### Step 3: Verify Email
- **Action:** Open your email inbox and click the verification link sent by Supabase Auth.
- **What You See:**
  - A confirmation notification confirming your email address is verified.
  - Automatic redirection back to BirrMind to log into your new workspace.
  *(Note: In local or demo environments where email confirmations are disabled, you are immediately signed in).*

---

### Step 4: Sign In
- **Action:** Enter your verified email address and password, then click **"Sign In"**.
- **What You See:**
  - Fast, secure authentication via Supabase JWT tokens.
  - The system checks your profile. Because you are a brand new customer with zero existing businesses, the smart routing gate automatically guides you to the **Business Onboarding Wizard**.

---

### Step 5 & 6: Complete Onboarding & Create Your Business
- **Action:** Follow the 7-step guided setup wizard:
  1. **Business Name & Sector:** Enter your business name (e.g., *"Bole Fresh Mini Market"* or *"Arat Kilo Provisions"*) and select your sector (Retail, Grocery, Cafe, Pharmacy, Electronics).
  2. **Location:** Select your city and sub-city (Addis Ababa - Bole, Kirkos, Arada, Yeka, or Hawassa, Adama, Bahir Dar).
  3. **Team Size:** Indicate whether you operate solo or have cashiers and store managers.
  4. **Operating Currency:** Defaulted to **ETB (Ethiopian Birr)** with standard 15% VAT and withholding settings.
  5. **Daily Sales Goal:** Enter your target daily revenue (e.g., `10,000 ETB`).
  6. **Catalog Starter:** Choose whether you want to start with a blank catalog or auto-seed standard Ethiopian fast-moving retail items (Coffee, Sugar, Cooking Oil, Teff, Milk, Soap).
  7. **Review & Launch:** Click **"Launch Business Workspace"**.
- **What You See:**
  - The server creates your dedicated database entry, assigns your account as the **Owner**, creates an initial audit log event, and redirects you directly into your new **Dashboard**.

---

### Step 7: Add Products to Your Catalog
- **Action:** Click on the **"Inventory"** tab in the navigation bar, then click **"+ Add Product"**.
- **What You See:**
  - A clean product creation modal.
  - Fields for: Product Name, Category (Grains, Beverages, Household, Dairy), Cost Price (ETB), Selling Price (ETB), Stock on Hand, and Minimum Reorder Threshold.
  - Instant profit margin calculation (e.g., Cost 80 ETB, Price 100 ETB = 20% margin).
  - Once saved, the product appears immediately in your live catalog with real-time stock status badges.

---

### Step 8: Record Sales (POS Terminal)
- **Action:** Click the **"Sales"** tab to open the touch-friendly Point of Sale (POS) screen.
- **What You See:**
  - A search bar and category pills for fast filtering.
  - Tapping an item adds it to the **Current Cart** on the right side (or bottom on mobile).
  - Quantity steppers (`+` and `-`) allow you to adjust amounts in one tap.
  - Payment Method Selector:
    - **Cash** (with automated change calculation)
    - **Telebirr** (digital mobile money)
    - **CBE Birr** (bank digital wallet)
    - **Customer Credit ("Arera / Baqi")** for trusted neighborhood accounts
  - Click **"Complete Sale"**. A success sound plays, stock quantities automatically decrement, and the sale is recorded in the permanent audit ledger.

---

### Step 9: Manage Inventory
- **Action:** Open the **"Inventory"** tab.
- **What You See:**
  - High-level KPIs: Total Inventory Valuation (ETB), Low Stock Items, Out of Stock warnings.
  - Table of all items with real-time stock levels.
  - Quick action buttons: **"Restock"** (records new incoming inventory and supplier cost) and **"Adjust Stock"** (handles damaged or expired goods with audit logging).

---

### Step 10: Track Expenses
- **Action:** Open the **"Expenses"** tab and click **"+ Record Expense"**.
- **What You See:**
  - Quick category selector: Rent, Store Utilities (Electric/Water), Restock Logistics, Staff Wages, Government Taxes, Miscellaneous.
  - Amount in ETB and payment method (Cash drawer or Telebirr merchant account).
  - Option to attach a receipt note or image.
  - The expense immediately updates your daily Net Cash on Hand KPI.

---

### Step 11: Ask Mercato AI (Your Dedicated Business Brain)
- **Action:** Click the **"Mercato AI"** tab or tap the floating sparkle button in the bottom right corner.
- **What You See:**
  - A dedicated executive intelligence command center.
  - Language toggle: **English**, **አማርኛ (Amharic)**, or **Afaan Oromoo**.
  - Ready-to-use executive prompt chips:
    - *"How can I improve my gross margin this week?"*
    - *"Which items are moving slowest in my store?"*
    - *"What inventory should I prepare for the upcoming holiday?"*
  - Responses reference your real store data: exact sales totals, low stock alerts, and store profit margins.
  - AI Grounding Badges: Mercato AI highlights facts sourced directly from your store database versus general market guidance.

---

### Step 12: Use Voice-Driven Sales
- **Action:** In the POS screen or Mercato AI tab, tap the **Microphone** icon.
- **What You See:**
  - The browser requests microphone permission via the native Web Speech API.
  - Speak naturally in English, Amharic, or code-switched retail terminology (e.g., *"Sell two cooking oil and one sugar with Telebirr"*).
  - A **Voice Draft Review Modal** appears instantly on screen:
    - Shows recognized text.
    - Displays detected catalog matches with quantities and calculated total.
    - Allows you to edit or adjust before tapping **"Confirm & Add to Cart"**.
  - Prevents noisy market background chatter from corrupting your financial records.

---

### Step 13: Scan Receipts with Receipt AI
- **Action:** Click **"Scan Receipt"** under Sales or Expenses.
- **What You See:**
  - Use your mobile device camera or upload a saved photo of a paper receipt or supplier invoice.
  - Mercato AI's computer vision pipeline analyzes the receipt image to extract Vendor Name, Date, Itemized Lines, and Total Amount.
  - An **Extracted Receipt Review Modal** displays the parsed data:
    - You can edit any item, fix misread prices, and adjust VAT.
    - Tap **"Post to Ledger"** to formally book the transaction.

---

### Step 14: Read Business Health & Morning Briefing
- **Action:** Navigate to the **"Home"** tab.
- **What You See:**
  - **Daily Mercato AI Briefing:** Personalized morning summary taking into account today's sales target, top 3 priority actions, and weather or calendar events.
  - **Financial Vital Signs:**
    - Today's Revenue vs. Target progress bar.
    - Cash on Hand vs. Telebirr/CBE Digital Split.
    - Estimated Gross Margin percentage.
  - **Quick Action Bar:** One-click shortcuts to Record Sale, Restock Inventory, Log Expense, or Consult AI.

---

### Step 15: Review Market Pulse
- **Action:** Click the **"Market Pulse"** tab.
- **What You See:**
  - Regional economic and commodity intelligence focused on Addis Ababa and regional Ethiopian hubs.
  - Verifiable origin badges on every card:
    - `Verified Benchmark: Merkato Wholesale Index` (Grain, oil, and coffee wholesale shifts).
    - `Aggregated BirrMind Trend` (Anonymized consumer demand spikes).
    - `Local Event Registry` (Fasting seasons, public holidays).
  - Explicit transparency notice: BirrMind clearly separates verified commodity benchmarks from AI economic interpretations.

---

### Step 16: Manage Account & Security
- **Action:** Click your **User Profile Avatar** in the top-right corner of the header.
- **What You See:**
  - User details: Full Name, Email, and your active role badge (**Owner**).
  - Options:
    - **"Business Settings"**: Edit store hours, tax registration (TIN), receipt header.
    - **"Subscription & Plan"**: View your Pioneer Partner status and tier features.
    - **"Security"**: Manage password and session authentications.

---

### Step 17: Multi-Store & Team Management
- **Action:** Open the **"Team"** tab or the business switcher in the top bar.
- **What You See:**
  - Multi-business switcher: Seamlessly switch between different store locations if you run multiple branches (e.g., Pantry branch vs. Cafe branch).
  - Team permissions: Invite cashiers or managers with restricted access (cashiers cannot view overall business profit or delete products).

---

### Step 18: Logout
- **Action:** Click your avatar and select **"Log Out"**.
- **What You See:**
  - Active Supabase session is revoked securely.
  - Local cached tokens are cleared.
  - You are safely returned to the landing page.

---

### Step 19: Returning Later
- **Action:** Return to `https://birrmind.onrender.com` on any device.
- **What You See:**
  - If your session is active, you are automatically directed back to your store dashboard.
  - If signed out, click **Sign In** and enter your credentials to immediately resume right where you left off. All your products, sales history, and Mercato AI memories remain permanently intact.
