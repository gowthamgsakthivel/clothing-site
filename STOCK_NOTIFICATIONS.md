````markdown
# Out of Stock Notification System - Documentation

## Overview
The Out of Stock Notification System allows customers to subscribe to notifications for products that are currently unavailable. When a product is restocked, users who subscribed will be notified.

## Features
- Visual "Out of Stock" indicators on product cards and detail pages
- "Notify Me" button for out-of-stock products
- Notification subscription storage in user profile
- Toast notifications for better user feedback
- User notification management page
- Notification count badge in navigation (single bell icon in navbar)
- API caching for improved performance

## Implementation Details

### Models

#### User Model Extension
```javascript
// models/User.js
stockNotifications: { 
  type: [Object], 
  default: [] 
}
```

Each notification object contains:
- `productId` - The MongoDB ID of the product
- `productName` - Name of the product
- `color` - Selected color 
- `size` - Selected size (optional)
- `date` - When the notification was requested
- `productImage` - URL to the product image
- `price` - Product price at time of subscription
- `brand` - Product brand (optional)
- `category` - Product category (optional)

### API Endpoints

#### 1. Subscribe to Notifications
- **Endpoint**: `/api/product/notify-stock`
- **Method**: POST
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "productId": "MongoDB ID",
    "color": "Color value",
    "size": "Size value",
    "productName": "Optional product name",
    "image": "Optional image URL",
    "price": "Optional price"
  }
  ```
- **Response**: Success/error message

#### 2. Retrieve User's Notifications
- **Endpoint**: `/api/user/notifications`
- **Method**: GET
- **Authentication**: Required
- **Response**: Array of notification objects

#### 3. Remove Notification
- **Endpoint**: `/api/user/notifications/remove`
- **Method**: POST
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "productId": "MongoDB ID",
    "color": "Color value",
    "size": "Size value"
  }
  ```
- **Response**: Success/error message

### Components

#### Product Card
- Displays "Out of Stock" overlay for unavailable products
- Shows "Notify Me" button instead of "Buy Now" for out-of-stock products
- Links to product detail page with notify=true parameter

#### Product Detail Page
- Shows stock status message based on color selection
- Displays "Notify When In Stock" button for out-of-stock items
- Handles notification subscription with proper validation and feedback

#### Stock Notification Icon
- Shows notification count badge in navigation
- Links to notifications management page

#### Notifications Management Page
- Lists all product notifications
- Allows removal of individual notifications
- Shows product details, selected options, and subscription date

## User Flow
1. User browses products and sees "Out of Stock" on unavailable items
2. User clicks "Notify Me" on product card or product detail page
3. If not logged in, user is prompted to sign in
4. User selects desired color/size options
5. User clicks "Notify When In Stock" button
6. System confirms subscription with toast notification
7. User can view and manage all notifications on the notifications page

## Future Enhancements
- Email notifications when products are restocked
- Admin panel for managing stock notifications
- Analytics on most requested out-of-stock products
- Batch notification processing for multiple users
- Expiration date for notifications (auto-remove after X days)
- Integration with inventory management systems
- Mobile push notifications
- Scheduled reminders for persistent out-of-stock items

## Error Handling
- Proper validation for required fields (productId, color)
- Prevention of duplicate notifications
- Authentication validation
- Null checking for product data
- Proper feedback for all error states

## Dependencies
- react-hot-toast for notifications
- date-fns for date formatting
- Clerk for authentication
- In-memory caching for API performance
- Next.js App Router for API routes
- MongoDB for notification storage