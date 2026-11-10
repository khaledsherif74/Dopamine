export const en = {
  "brand": "Dopamine Shop",
  "common": {
    "loadMore": "Load more"
  },
  "nav": {
    "main": "Main navigation",
    "orders": "Orders",
    "products": "Products",
    "earnings": "Earnings",
    "support": "Support",
    "shop": "My shop",
    "notifications": "Notifications",
    "notificationsUnread": "Notifications, {{count}} unread",
    "signOut": "Sign out"
  },
  "auth": {
    "identifier": "Email or phone",
    "password": "Password",
    "show": "Show",
    "hide": "Hide",
    "signIn": "Sign in",
    "forgot": "Forgot password?",
    "noAccount": "Don't have an account?",
    "haveAccount": "Already have an account?",
    "email": "Email",
    "passwordHint": "At least 8 characters with a letter and a number",
    "acceptTerms": "I agree to the {{terms}} and {{privacy}}",
    "forgotTitle": "Reset your password",
    "forgotSubtitle": "Enter your email and we'll send you a reset link.",
    "sendLink": "Send reset link",
    "forgotSent": "If an account exists for that email, a reset link is on its way.",
    "backToLogin": "Back to sign in",
    "resetTitle": "Choose a new password",
    "newPassword": "New password",
    "resetPassword": "Reset password",
    "resetDone": "Your password was changed. Please sign in.",
    "resetMissing": "This reset link is missing its token. Request a new one.",
    "title": "Shop sign in",
    "subtitle": "Manage your orders and products.",
    "register": "Create a shop account",
    "registerTitle": "Open your shop",
    "registerSubtitle": "Sell your desserts on Dopamine.",
    "approvalNote": "New shops are reviewed before they appear to customers. You can set up your products while you wait."
  },
  "validation": {
    "passwordShort": "At least 8 characters",
    "passwordLong": "At most 72 characters",
    "passwordWeak": "Must include a letter and a number"
  },
  "chat": {
    "supplier": "Customer",
    "reason": {
      "NOT_VISIBLE_TO_SUPPLIER": "This order is not visible to the shop yet.",
      "ORDER_CLOSED": "This order is closed, so the chat is read-only.",
      "CHAT_EXPIRED": "This conversation is no longer available.",
      "READ_ONLY_ROLE": "You can read but not write in this chat.",
      "NOT_PARTICIPANT": "You are not part of this conversation."
    }
  },
  "orders": {
    "title": "Order #{{id}}",
    "emptyTitle": "No orders yet",
    "emptyMessage": "New orders appear here as soon as customers place them.",
    "newBanner": "{{count}} new order(s) waiting for you",
    "column": {
      "new": "New",
      "inProgress": "In the kitchen",
      "handover": "Ready / on the way",
      "done": "Recently finished"
    },
    "columnEmpty": "Nothing here.",
    "action": {
      "accept": "Accept",
      "reject": "Reject",
      "startPreparing": "Start preparing",
      "markReady": "Mark ready",
      "cancel": "Cancel order"
    },
    "waitingPayment": "Waiting for the customer to complete the online payment.",
    "waiting": "Waiting {{minutes}} min",
    "scheduledFor": "Scheduled for {{when}}",
    "chatUnread": "{{count}} new message(s)",
    "reason": "Reason (shown to the customer)",
    "rejectTitle": "Reject this order",
    "rejectHelp": "The customer is told why and an online payment is refunded in full.",
    "cancelTitle": "Cancel this order",
    "cancelHelp": "Use this only if you cannot make the order. The customer is told why and an online payment is refunded in full.",
    "errors": {
      "reasonRequired": "Enter a reason",
      "reasonShort": "Enter a reason (at least 3 characters)",
      "reasonTooLong": "The reason is too long (300 characters at most)"
    },
    "cancelledWith": "Cancelled: {{reason}}",
    "rejectedWith": "Rejected: {{reason}}",
    "items": "Items",
    "subtotal": "Your sales",
    "payment": "Payment",
    "note": "Customer note",
    "customer": "Customer",
    "customerName": "Name",
    "address": "Delivery address",
    "driver": "Driver",
    "noDriver": "Not assigned yet",
    "contactSupport": "Contact support about this order",
    "chatTitle": "Chat with the customer"
  },
  "paymentMethod": {
    "CASH": "Cash",
    "CARD": "Card",
    "WALLET": "Wallet"
  },
  "paymentStatus": {
    "PENDING": "Pending",
    "PAID": "Paid",
    "FAILED": "Failed",
    "PARTIALLY_REFUNDED": "Partially refunded",
    "REFUNDED": "Refunded"
  },
  "orderStatus": {
    "CANCELLED": "Cancelled"
  },
  "products": {
    "add": "Add product",
    "addTitle": "New product",
    "editTitle": "Edit product",
    "emptyTitle": "No products yet",
    "emptyMessage": "Add your first dessert to start selling.",
    "name": "Name",
    "price": "Price",
    "stock": "Stock",
    "category": "Category",
    "description": "Description",
    "image": "Photo",
    "imageHint": "JPEG, PNG or WebP, up to 5 MB.",
    "advanceOrder": "Needs advance ordering",
    "available": "Available to customers",
    "cannotClear": "Text fields can be changed but not cleared.",
    "visible": "Visible",
    "hidden": "Hidden",
    "soldOut": "Sold out",
    "advanceBadge": "Advance order",
    "inStock": "{{count}} in stock",
    "hide": "Hide",
    "show": "Show",
    "remove": "Remove",
    "removeTitle": "Remove product",
    "removeHelp": "“{{name}}” will be hidden from customers and its stock set to 0. Past orders are not affected.",
    "errors": {
      "name": "Name must be 2–120 characters",
      "price": "Enter a price greater than 0 with at most 2 decimals",
      "stock": "Enter a whole number from 0 to 99999",
      "descriptionLong": "The description is too long (1000 characters at most)",
      "categoryLong": "The category is too long (60 characters at most)",
      "imageType": "Use a JPEG, PNG or WebP image",
      "imageSize": "The image is larger than 5 MB",
      "nothingChanged": "Nothing was changed"
    }
  },
  "earnings": {
    "range": "Period",
    "preset": {
      "today": "Today",
      "7d": "Last 7 days",
      "30d": "Last 30 days",
      "month": "This month",
      "all": "All time"
    },
    "from": "From",
    "to": "To",
    "netPayout": "Net payout",
    "totalSales": "Sales after refunds",
    "commission": "Commission ({{percent}}%)",
    "orders": "Delivered orders",
    "explain": "Gross sales {{gross}}, refunds {{refunds}}. Only delivered orders count.",
    "breakdown": "Orders",
    "none": "No delivered orders in this period.",
    "col": {
      "order": "Order",
      "date": "Date",
      "sales": "Sales",
      "refunded": "Refunded",
      "net": "Net"
    },
    "errors": {
      "date": "Enter valid dates",
      "order": "The start date must not be after the end date"
    }
  },
  "shop": {
    "name": "Shop name",
    "phone": "Phone",
    "phoneHint": "International format, e.g. +201234567890",
    "address": "Address",
    "addressOptional": "Address (optional)",
    "cannotClear": "The address can be changed but not cleared.",
    "lat": "Latitude",
    "lng": "Longitude",
    "details": "Shop details",
    "ordering": "Taking orders",
    "acceptingLabel": "My shop is accepting orders",
    "opensAt": "Opens at",
    "closesAt": "Closes at",
    "hoursHint": "Leave both empty for no fixed hours.",
    "accepting": "Accepting orders",
    "paused": "Orders paused",
    "saved": "Saved.",
    "nothingChanged": "Nothing to save.",
    "statusLine": "Account status: {{status}} · commission {{commission}}%",
    "status": {
      "PENDING": "Waiting for approval",
      "APPROVED": "Approved",
      "SUSPENDED": "Suspended",
      "REJECTED": "Rejected"
    },
    "pendingApproval": "Your shop is waiting for approval. Customers cannot see it yet.",
    "suspended": "Your shop is suspended. Contact support.",
    "errors": {
      "name": "Shop name must be 2–120 characters",
      "phone": "Enter a phone number in international format",
      "addressLong": "The address is too long (255 characters at most)",
      "lat": "Latitude must be between −90 and 90",
      "lng": "Longitude must be between −180 and 180",
      "hoursPair": "Set both opening and closing times, or neither",
      "hoursFormat": "Use the HH:MM format"
    }
  },
  "support": {
    "title": "Support tickets",
    "newTicket": "New ticket",
    "empty": "No tickets yet",
    "emptyHint": "Need a hand? Open a ticket and we will get back to you.",
    "subject": "Subject",
    "category": "What is it about?",
    "message": "Describe the problem",
    "messageHint": "The more detail, the faster we can help.",
    "submit": "Send to support",
    "linkedOrder": "About order #{{id}}",
    "ticketNumber": "Ticket #{{id}}",
    "status": {
      "OPEN": "Open",
      "IN_PROGRESS": "In progress",
      "RESOLVED": "Resolved",
      "CLOSED": "Closed"
    },
    "categories": {
      "ORDER": "An order",
      "PAYMENT": "Payment",
      "DELIVERY": "Delivery",
      "ACCOUNT": "My account",
      "REFUND": "Refund",
      "OTHER": "Something else"
    },
    "resolution": "Resolution",
    "resolvedNote": "Marked as resolved. Reply below if you still need help — it will reopen.",
    "closedNote": "This ticket is closed. Please open a new one.",
    "getHelp": "Get help with this order",
    "assigned": "Handled by {{name}}",
    "unread": "{{count}} new",
    "notFound": "We could not find this ticket.",
    "thread": "Conversation with support",
    "loadMore": "Load more",
    "author": "Support"
  },
  "notifications": {
    "title": "Notifications",
    "empty": "No notifications yet",
    "markAll": "Mark all as read",
    "new": "New",
    "open": "open"
  },
  "notFound": {
    "title": "Page not found",
    "body": "That page does not exist.",
    "home": "Back to orders"
  }
};
