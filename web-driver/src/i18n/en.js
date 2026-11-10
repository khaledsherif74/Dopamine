export const en = {
  "brand": "Dopamine Drivers",
  "common": {
    "loadMore": "Load more"
  },
  "nav": {
    "main": "Main navigation",
    "jobs": "Deliveries",
    "earnings": "Earnings",
    "support": "Support",
    "profile": "Profile",
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
    "title": "Driver sign in",
    "subtitle": "Pick up and deliver orders.",
    "register": "Become a driver",
    "registerTitle": "Join as a driver",
    "registerSubtitle": "Deliver desserts and earn per delivery.",
    "approvalNote": "New drivers are approved by our team before they can go online."
  },
  "validation": {
    "passwordShort": "At least 8 characters",
    "passwordLong": "At most 72 characters",
    "passwordWeak": "Must include a letter and a number"
  },
  "chat": {
    "driver": "Customer",
    "reason": {
      "NO_DRIVER_ASSIGNED": "No driver is assigned to this order.",
      "DELIVERY_NOT_ACTIVE": "This delivery is finished, so the chat is read-only.",
      "ORDER_CLOSED": "This order is closed, so the chat is read-only.",
      "CHAT_EXPIRED": "This conversation is no longer available.",
      "READ_ONLY_ROLE": "You can read but not write in this chat.",
      "NOT_PARTICIPANT": "You are not part of this conversation."
    }
  },
  "driver": {
    "online": "Online",
    "offline": "Offline",
    "pendingApproval": "Your account is waiting for approval. You can go online once it is approved.",
    "suspended": "Your account is suspended. Contact support.",
    "status": {
      "PENDING": "Waiting for approval",
      "APPROVED": "Approved",
      "SUSPENDED": "Suspended",
      "REJECTED": "Rejected"
    }
  },
  "location": {
    "denied": "Location access is blocked. Allow it in your browser settings to see distances.",
    "unavailable": "Your location is not available right now.",
    "timeout": "Finding your location took too long."
  },
  "jobs": {
    "title": "Delivery #{{id}}",
    "tabs": "Delivery lists",
    "tab": {
      "available": "Available",
      "mine": "My deliveries"
    },
    "empty": {
      "available": {
        "title": "No deliveries available",
        "message": "New ready orders appear here as soon as shops finish them. Stay online."
      },
      "mine": {
        "title": "No active deliveries",
        "message": "Deliveries you accept appear here."
      }
    },
    "action": {
      "accept": "Accept delivery",
      "pickup": "I picked it up",
      "deliver": "Delivered"
    },
    "blocked": {
      "notApproved": "Your account must be approved before you can accept deliveries.",
      "offline": "Go online to accept deliveries."
    },
    "noPosition": "Allow location access to sort deliveries by distance to the shop.",
    "fee": "You earn {{amount}}",
    "distance": "{{km}} km away",
    "status": {
      "ASSIGNED": "Go to the shop",
      "PICKED_UP": "On the way"
    },
    "chatUnread": "{{count}} new message(s)",
    "pickupFrom": "Pick up from",
    "deliverTo": "Deliver to",
    "addressAfterAccept": "The exact address and phone appear after you accept.",
    "openMap": "Open in Maps",
    "callCustomer": "Call customer",
    "items": "{{count}} item(s)",
    "cashOrder": "Collect {{amount}} in cash",
    "details": "Details & chat",
    "chatTitle": "Chat with the customer",
    "cashTitle": "Collect the cash",
    "cashHelp": "This is a cash order. Collect the full amount from the customer before you finish.",
    "cashCollected": "I collected {{amount}} in cash",
    "finishedTitle": "This delivery is finished",
    "finishedMessage": "It is no longer in your active deliveries (delivered, cancelled or reassigned)."
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
    "total": "Total earned",
    "deliveries": "Deliveries",
    "explain": "You earn the delivery fee of each delivered order.",
    "breakdown": "Deliveries",
    "none": "No deliveries in this period.",
    "col": {
      "order": "Order",
      "date": "Delivered",
      "fee": "Fee"
    },
    "errors": {
      "date": "Enter valid dates",
      "order": "The start date must not be after the end date"
    }
  },
  "profile": {
    "name": "Name",
    "phone": "Phone",
    "phoneHint": "International format, e.g. +201234567890",
    "vehicle": "Vehicle",
    "vehicleOptional": "Vehicle (optional)",
    "cannotClear": "The vehicle can be changed but not cleared.",
    "details": "My details",
    "saved": "Saved.",
    "nothingChanged": "Nothing to save.",
    "location": "My location",
    "locationHelp": "While you are online, your position is shared with dispatch every few minutes.",
    "noLocation": "No position yet.",
    "updateLocation": "Update my location",
    "locationSent": "Location updated.",
    "errors": {
      "name": "Name must be 2–80 characters",
      "phone": "Enter a phone number in international format",
      "vehicleLong": "The vehicle is too long (40 characters at most)"
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
    "home": "Back to deliveries"
  }
};
