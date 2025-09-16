
# Updated User Flow Diagram (Mermaid)

```mermaid
flowchart TD
    A[Landing Page] --> B[Product Listing]
    B --> B1[Search/Filter Products]
    B1 --> C[Product Details]
    C --> D[Add to Cart]
    D --> E[Cart Page]
    E --> F[Checkout]
    F --> G[Login/Register]
    G --> H[Address Entry]
    H --> I[Payment via Razorpay]
    I --> J[Order Placement]
    J --> K[Order Confirmation]
    K --> L[Track/View Orders]
```
