# 7 Star Super Market — Full Admin + Customer Checkout

This version adds a complete browser-based customer flow to the existing admin panel:

- Customer sign-in with email/name/phone
- Optional Google Sign-In using Google Identity Services
- Delivery address collection at checkout
- Real order creation from the cart
- Stock reduction when an order is placed
- Automatic customer creation/update
- Admin Orders and Customers pages populated from checkout activity
- Order status workflow: Pending → Confirmed → Packed → Out for delivery → Delivered / Cancelled
- Product images, categories, inventory, offers, coupons and logo settings remain available

## Google Sign-In
1. Create a Google OAuth Web Client ID in Google Cloud.
2. Add the site's origin as an authorized JavaScript origin.
3. Open **Admin → Website Settings** and paste the Client ID into **Google OAuth Client ID**.
4. Reload the site.

For a production store, Google ID tokens, customers, orders and payments should be verified/stored on a secure backend/database. This ZIP remains a static-browser app, so localStorage is used for persistence and must not be treated as production-grade storage.

## Admin
Current demo admin password: `admin123`.
For a public deployment, replace the browser-only password with server-side authentication before exposing the admin panel.


## What was updated
- Google Sign-In setup now initializes from the saved Website Settings Client ID.
- Legacy order statuses are normalized to the requested workflow.
- Cart totals now consistently use the active offer price.
- Customer records are matched case-insensitively by email and updated on sign-in/checkout.
- Checkout validates a 10-digit Indian phone number and 6-digit pincode.
- Existing localStorage data keys and catalog/admin data structures are preserved.

## Important production note
This project is still a static HTML/CSS/JavaScript application. Browser localStorage is suitable for a demo/local deployment but is **not** a secure production order system. A production store should move authentication, Google ID-token verification, orders, customers, inventory transactions and payment handling to a server/database.

## Order email automation setup
1. In EmailJS, create a service connected to the store's mailbox.
2. Create an EmailJS template using these variables:
   `to_email`, `store_email`, `order_id`, `order_date`, `customer_name`, `customer_email`, `customer_phone`, `delivery_address`, `delivery_instructions`, `order_items`, `order_total`, `payment_status`, `order_status`.
3. In Admin → Website Settings, enter the store Email plus the EmailJS Public Key, Service ID and Template ID.
4. When a customer places an order, the order is created first and then the complete order information is automatically emailed to the store. An email failure will not delete the order.

## Loyalty & customer order tracking
- Customers can see their previous orders and current order status.
- Previous delivery addresses are displayed in the customer's account.
- A public points lookup allows a customer to enter their phone number and see their points.
- The leaderboard shows customers by name and points.
- Admin can see all customers' points and manually send/add points to an individual customer.
- Customers earn points automatically on successful orders (1 point per whole currency unit).
