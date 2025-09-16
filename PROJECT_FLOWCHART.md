
# Updated Project Flowchart (Mermaid)

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
        A1 --> B1 --> C1 --> D1 --> E1 --> F1 --> G1
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
        S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7
    end

    %% Order Processing
    subgraph System [System Processing]
        O1([Order Event sent to Inngest])
        O2([Order Processing/Notification])
    end

    %% Cross-links
    S7 -.-> B1
    K1 --> O1 --> O2
```
