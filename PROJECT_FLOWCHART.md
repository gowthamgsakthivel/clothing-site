
````markdown

# Project Flowchart

```mermaid
flowchart TB
    %% Customer Flow
    subgraph Customer [Customer Flow]
        A1([User visits site])
        B1([Browse/Search/Filter Products])
        C1([View Product Details])
        D1([Add to Cart])
        E1([View Cart])
        F1([Checkout])
        G1{Logged In?}
        H1([Login/Register])
        I1([Enter Address])
        J1([Payment via Razorpay])
        K1([Order Placement])
        L1([Order Confirmation])
        M1([Track/View Orders])
        N1([Subscribe to Stock Notifications])
        O1([View/Manage Notifications])
        P1([Request Custom Design])
        Q1([View/Manage Custom Designs])

        A1 --> B1 --> C1 
        C1 --> D1 --> E1 --> F1 --> G1
        C1 --> N1 --> O1
        C1 --> P1 --> Q1
        G1 -- No --> H1 --> I1
        G1 -- Yes --> I1
        I1 --> J1 --> K1 --> L1 --> M1
    end

    %% Seller/Product Management Flow
    subgraph Seller [Seller/Product Management]
        S1([Seller Dashboard])
        S2([Add/Edit Product via Modal])
        S3([Set Category/Gender/Color/Size/Stock])
        S4([Upload Image])
        S5([Image sent to Cloudinary])
        S6([Cloudinary returns image URL])
        S7([Save Product (with image URL) to DB])
        S8([View/Process Orders])
        S9([Manage Stock Levels])
        S10([Handle Custom Design Requests])
        S11([View Analytics])
        
        S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7
        S1 --> S8
        S1 --> S9
        S1 --> S10
        S1 --> S11
    end

    %% System Processing
    subgraph System [System Processing]
        O1([Order Event sent to Inngest])
        O2([Order Processing/Notification])
        O3([API Monitoring & Metrics])
        O4([API Response Caching])
        O5([Stock Notification Processing])
        
        O1 --> O2
        O3 --> O4
        O4 --> O5
    end

    %% Cross-links
    S7 -.-> B1
    K1 --> O1
    S9 -.-> N1 --> O5
    S10 -.-> P1
    O5 -.-> O1
```
