# PBW Dropshipper Portal - TODO

## Database & Backend
- [x] Database schema: users (with role), orders, order_traces tables
- [x] Drizzle migration and SQL applied
- [x] tRPC procedures: auth (login/register/me/logout/updateProfile)
- [x] tRPC procedures: orders (create, update, list, getById, delete, myStats)
- [x] tRPC procedures: admin (allOrders, allAgents, updateOrderStatus, assignCashback, addTracking, recentOrders, agentStats)
- [x] tRPC procedures: tracking (public lookup by orderNo or trackingNumber)
- [x] S3 upload endpoint for Aadhaar documents and product images
- [x] Email notification on order status change / cashback / tracking update

## Authentication & Landing
- [x] Custom login page (PBW OAuth flow, demo credentials shown)
- [x] Custom register page (agent onboarding)
- [x] Demo credentials shown on login page
- [x] Role-based route protection (admin vs agent)
- [x] Landing page with features, workflow, hero section, CTA

## Agent Features
- [x] Agent dashboard with metrics (total orders, paid, revenue, cashback)
- [x] Agent dashboard recent orders table
- [x] Order list page with status/payment filters
- [x] Order create form (product, customer, Aadhaar upload, notes)
- [x] Order edit form (same fields, read-only price/cashback for agents)
- [x] Aadhaar front/back image upload to S3

## Admin Features
- [x] Admin dashboard with system-wide metrics
- [x] Admin orders page: all orders across all agents, status updates
- [x] Admin orders: assign cashback, add tracking number
- [x] Admin agents page: list all agents with performance metrics
- [x] Admin can edit any order fully (price, status, cashback, tracking)

## Public Tracking
- [x] Public /track page (no login required)
- [x] Search by order number or tracking ID
- [x] Demo mode with sample tracking data
- [x] Tracking timeline display
- [x] Progress steps visualization (processing → shipped → delivered)

## Profile & Settings
- [x] Profile settings page (name, phone, email read-only)
- [x] Save profile changes

## Notifications
- [x] Email notification to agent when order status changes
- [x] Email notification to agent when cashback is assigned
- [x] Email notification to agent when tracking number is added

## Testing
- [x] auth.logout tests
- [x] auth.me tests
- [x] Admin RBAC enforcement tests
- [x] Orders RBAC enforcement tests
- [x] Public tracking test
- [x] auth.updateProfile RBAC test

## Live Shipments Rotating Number
- [x] Landing page "Live shipments" stat rotates between 17 and 45 every 4 hours using a time-based seed
