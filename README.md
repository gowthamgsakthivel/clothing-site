
# Sparrow Sports E-Commerce Platform

## Overview
Sparrow Sports is a modern, full-stack e-commerce platform for sports and electronics products. It features advanced product filtering, seller dashboard with modal product management, secure checkout via Razorpay, centralized category/gender management, and a beautiful, responsive UI built with Next.js, React, MongoDB, and Tailwind CSS.

## Features
- Product listing with sidebar category and gender/age filters
- Product search by name, brand, or description
- Seller dashboard with modal for product management
- Add/edit products with category, gender, color, size, and stock
- Image upload via Cloudinary
- Cart and order management
- Secure authentication (Clerk)
- Order tracking and history
- Responsive design for mobile and desktop
- Centralized category/genderCategory management (MongoDB collections)
- Payment gateway integration (Razorpay)
- Event-driven order processing (Inngest)

## Tech Stack
- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Next.js API routes, MongoDB (Mongoose)
- **Auth:** Clerk
- **Image Storage:** Cloudinary
- **Payments:** Razorpay
- **Notifications/Events:** Inngest

## Project Structure
- `app/` — Next.js pages and API routes
- `components/` — Reusable React components
- `context/` — Global state/context providers
- `models/` — Mongoose models (Product, User, Orders, Address)
- `config/` — Database and event config
- `assets/` — Images and icons


## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Replace values with your actual credentials.

## Setup & Installation
1. Clone the repo:
	```bash
	git clone https://github.com/gowthamgsakthivel/clothing-site.git
	cd sparrow-sports
	```
2. Install dependencies:
	```bash
	npm install
	```
3. Configure your environment variables as above.
4. Run the development server:
	```bash
	npm run dev
	```
5. Access the app at `http://localhost:3000`

## Diagrams

### Architecture
See [`ARCHITECTURE_DIAGRAM.md`](./ARCHITECTURE_DIAGRAM.md) for a high-level overview.

### Project Flow
See [`PROJECT_FLOWCHART.md`](./PROJECT_FLOWCHART.md) for customer, seller, and system flows.

### User Flow
See [`USER_FLOW_DIAGRAM.md`](./USER_FLOW_DIAGRAM.md) for user journey from landing to order.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
MIT

---
**Developed by Gowtham G Sakthivel and contributors.**
