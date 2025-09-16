
# Updated High-Level Architectural Diagram (Mermaid)

```mermaid
graph TD
    subgraph Frontend (Next.js/React)
        A1[Pages (app/)]
        A2[Components (components/)]
        A3[Context (context/)]
        A4[Sidebar/Topbar Filters]
        A5[Search Bar]
        A6[Seller Dashboard & Modal]
    end

    subgraph API Layer (Next.js API Routes)
        B1[API Endpoints (app/api/)]
    end

    subgraph Backend
        C1[Business Logic]
        C2[Database Models (models/)]
        C3[Config (config/)]
        C4[Inngest (Event Processing)]
        C5[Central Category/Gender Management]
    end

    subgraph External Services
        E1[Cloudinary (Image Storage)]
        E2[Razorpay (Payment Gateway)]
        E3[Clerk (Authentication)]
    end

    subgraph Database
        D1[(MongoDB)]
    end

    %% Standard app flow
    A1 --> B1
    A2 --> A1
    A3 --> A1
    A4 --> A1
    A5 --> A1
    A6 --> A1
    B1 --> C1
    C1 --> C2
    C1 --> C3
    C1 --> C4
    C1 --> C5
    C1 --> E1
    C1 --> E2
    C1 --> E3
    C2 --> D1
    C5 --> D1

    %% Image upload flow
    A1 -. Upload Image .-> B1
    B1 -. Store Image .-> E1
    E1 -. Image URL .-> B1
    B1 -. Save Product (with imageUrl) .-> D1

    %% Payment flow
    A1 -. Checkout .-> B1
    B1 -. Payment .-> E2
    E2 -. Payment Status .-> B1
    B1 -. Save Order .-> D1

    %% Auth flow
    A1 -. Login/Register .-> E3
    E3 -. Auth Token .-> A1
```

**Note:**
- Product schema supports category, genderCategory, color/size/stock, and images.
- Seller dashboard and modal allow product management.
- Centralized category/gender management for consistency.
- Payment handled via Razorpay.
- Authentication via Clerk.
