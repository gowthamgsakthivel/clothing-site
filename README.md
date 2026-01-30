# Clothing E-Commerce Site

A modern, full-featured e-commerce platform for clothing and fashion products built with Next.js.

## Features

### Customer Features
- **Product Browsing**: Browse products with filtering, search, and recently viewed items
- **Shopping Cart**: Full cart management with size selection
- **Wishlist**: Save favorite items for later
- **Custom Design**: Request custom clothing designs with negotiation system
- **Order Management**: Track orders, view order history, and manage returns
- **User Profiles**: Manage addresses, view referrals, and track notifications
- **Product Reviews**: Read and write product reviews with ratings
- **Stock Notifications**: Get notified when out-of-stock items are available
- **Size Guide & Recommendations**: Interactive size guides and personalized recommendations

### Seller Features
- **Seller Dashboard**: Manage products and inventory
- **Custom Design Responses**: Respond to custom design requests with quotes
- **Negotiation System**: Handle price negotiations with customers

### Admin Features
- **Admin Dashboard**: Complete admin panel for managing the platform
- **Product Management**: Add, edit, and remove products
- **Order Processing**: View and manage customer orders

## Tech Stack

- **Framework**: Next.js (App Router)
- **Database**: MongoDB with Mongoose
- **Styling**: Tailwind CSS
- **Authentication**: Custom authentication system
- **Background Jobs**: Inngest
- **Email Service**: Custom email service integration
- **Testing**: Jest with React Testing Library

## Project Structure

```
├── app/                    # Next.js app directory (routes & pages)
├── components/             # Reusable React components
├── context/                # React context providers
├── models/                 # MongoDB/Mongoose models
├── lib/                    # Utility functions and services
├── config/                 # Configuration files
├── assets/                 # Static assets and product data
├── __tests__/              # Test files
└── public/                 # Public static files
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dharanidharansr/clothing-site.git
   cd clothing-site
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the required variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   # Add other required environment variables
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Key Features Implementation

### API Routes
- Product listing and search
- Order creation and management
- User data management
- Custom design request handling

### Caching & Optimization
- API response caching
- Request batching
- Rate limiting
- Performance monitoring

### Database Models
- User & Address management
- Product & Inventory
- Orders & Returns
- Custom Designs & Negotiations
- Reviews & Ratings
- Referrals

## Testing

The project includes comprehensive tests for:
- API endpoints
- React components
- Context providers
- Core features (cart, checkout flow)

Run tests with:
```bash
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Contact

For any inquiries, please use the contact form on the website or reach out to the repository owner.
