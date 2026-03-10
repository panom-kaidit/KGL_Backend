require("dotenv").config();

const port = process.env.PORT || 5000;
const serverUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;

const errorResponse = {
  description: "Error response",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" }
    }
  }
};

const idPathParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" }
};

module.exports = {
  openapi: "3.0.0",
  info: {
    title: "Karibu Groceries Limited API",
    version: "1.0.0",
    description:
      "Interactive API documentation for authentication, users, procurement, inventory, pricing, sales, credit sales, and statistics."
  },
  servers: [{ url: serverUrl, description: "Local development server" }],
  tags: [
    { name: "Authentication" },
    { name: "Users" },
    { name: "Sales" },
    { name: "Credit Sales" },
    { name: "Procurement" },
    { name: "Inventory" },
    { name: "Pricing" },
    { name: "Statistics" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Server error" }
        }
      },
      SuccessMessage: {
        type: "object",
        properties: {
          message: { type: "string", example: "Operation completed successfully" }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "manager@karibu.com" },
          password: { type: "string", example: "StrongPass123" }
        }
      },
      LoginResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Login successful" },
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
        }
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "6642d27e1f8d5d5c3b2a1001" },
          name: { type: "string", example: "Jane Manager" },
          email: { type: "string", example: "jane@karibu.com" },
          role: { type: "string", example: "Manager" },
          branch: { type: "string", example: "Maganjo" },
          phone: { type: "string", example: "0700000000" },
          bio: { type: "string", example: "Team member profile" },
          profilePicture: { type: "string", example: "" }
        }
      },
      UserWriteRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "Jane Manager" },
          email: { type: "string", example: "jane@karibu.com" },
          password: { type: "string", example: "StrongPass123" },
          role: { type: "string", enum: ["Manager", "Sales-agent", "Director"] },
          branch: { type: "string", enum: ["Maganjo", "Matugga", "Main"] },
          phone: { type: "string", example: "0700000000" },
          bio: { type: "string", example: "Team member profile" },
          profilePicture: { type: "string", example: "data:image/png;base64,..." }
        }
      },
      UserList: {
        type: "object",
        properties: {
          branch: { type: "string", nullable: true, example: "Maganjo" },
          count: { type: "number", example: 4 },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/User" }
          }
        }
      },
      PaymentHistoryEntry: {
        type: "object",
        properties: {
          amount: { type: "number", example: 250000 },
          date: { type: "string", example: "2026-03-09" }
        }
      },
      Sale: {
        type: "object",
        properties: {
          _id: { type: "string", example: "6642d27e1f8d5d5c3b2a2001" },
          saleType: { type: "string", enum: ["cash", "credit"], example: "cash" },
          produceName: { type: "string", example: "Beans" },
          produceType: { type: "string", example: "Cereal" },
          tonnage: { type: "number", example: 1500 },
          branch: { type: "string", example: "Maganjo" },
          pricePerKg: { type: "number", example: 5000 },
          amountPaid: { type: "number", example: 7500000 },
          amountDue: { type: "number", example: 7500000 },
          buyerName: { type: "string", example: "John Buyer" },
          NationalID: { type: "string", example: "CM12345678AA1" },
          location: { type: "string", example: "Wakiso" },
          contact: { type: "string", example: "0700000000" },
          salesAgent: { type: "string", example: "Sarah Agent" },
          date: { type: "string", example: "2026-03-09" },
          time: { type: "string", example: "10:45:00 AM" },
          dueDate: { type: "string", example: "2026-03-20" },
          dispatchDate: { type: "string", example: "2026-03-09" },
          status: { type: "string", enum: ["pending", "partial", "paid"], example: "pending" },
          paymentHistory: {
            type: "array",
            items: { $ref: "#/components/schemas/PaymentHistoryEntry" }
          }
        }
      },
      SaleWriteRequest: {
        type: "object",
        required: ["saleType", "produceName", "tonnage"],
        properties: {
          saleType: { type: "string", enum: ["cash", "credit"], example: "cash" },
          produceName: { type: "string", example: "Beans" },
          produceType: { type: "string", example: "Cereal" },
          tonnage: { type: "number", example: 1500 },
          buyerName: { type: "string", example: "John Buyer" },
          salesAgentName: { type: "string", example: "Sarah Agent" },
          date: { type: "string", example: "2026-03-09" },
          time: { type: "string", example: "10:45:00 AM" },
          nationalId: { type: "string", example: "CM12345678AA1" },
          location: { type: "string", example: "Wakiso" },
          contacts: { type: "string", example: "0700000000" },
          dueDate: { type: "string", example: "2026-03-20" },
          dispatchDate: { type: "string", example: "2026-03-09" }
        }
      },
      SaleList: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Sale" }
          }
        }
      },
      Procurement: {
        type: "object",
        properties: {
          _id: { type: "string", example: "6642d27e1f8d5d5c3b2a3001" },
          produceName: { type: "string", example: "Beans" },
          produceType: { type: "string", example: "Cereal" },
          date: { type: "string", example: "2026-03-09" },
          time: { type: "string", example: "08:30" },
          tonnage: { type: "number", example: 3000 },
          cost: { type: "number", example: 4500 },
          dealerName: { type: "string", example: "Maganjo Farm" },
          branch: { type: "string", example: "Maganjo" },
          contact: { type: "string", example: "0700000001" },
          sellingPrice: { type: "number", example: 13500000 }
        }
      },
      ProcurementWriteRequest: {
        type: "object",
        properties: {
          supplier_name: { type: "string", example: "Maganjo Farm" },
          supplier_contact: { type: "string", example: "0700000001" },
          purchase_date: { type: "string", example: "2026-03-09" },
          produce_time: { type: "string", example: "08:30" },
          invoice_number: { type: "string", example: "PROC-1710000000000" },
          product_name: { type: "string", example: "Beans" },
          product_category: { type: "string", example: "Cereal" },
          quantity: { type: "number", example: 3000 },
          unit_price: { type: "number", example: 4500 },
          selling_price: { type: "number", example: 13500000 },
          payment_method: { type: "string", example: "" },
          payment_status: { type: "string", example: "" }
        }
      },
      InventoryItem: {
        type: "object",
        properties: {
          _id: { type: "string", example: "6642d27e1f8d5d5c3b2a7001" },
          itemName: { type: "string", example: "Beans" },
          category: { type: "string", example: "Cereal" },
          branch: { type: "string", example: "Maganjo" },
          stockKg: { type: "number", example: 3200 },
          costPerKg: { type: "number", example: 4500 },
          salePricePerKg: { type: "number", example: 5200 },
          createdAt: { type: "string", example: "2026-03-01T10:00:00.000Z" },
          updatedAt: { type: "string", example: "2026-03-09T12:30:00.000Z" }
        }
      },
      InventoryResponse: {
        type: "object",
        properties: {
          summary: {
            type: "object",
            properties: {
              totalStockPercentage: { type: "number", example: 72 },
              inStockCount: { type: "number", example: 8 },
              lowStockCount: { type: "number", example: 2 },
              outOfStockCount: { type: "number", example: 1 },
              total: { type: "number", example: 11 }
            }
          },
          items: { type: "array", items: { $ref: "#/components/schemas/InventoryItem" } }
        }
      },
      PricingProduct: {
        type: "object",
        properties: {
          productName: { type: "string", example: "Beans" },
          produceType: { type: "string", example: "Cereal" },
          buyingPrice: { type: "number", example: 4500 },
          sellingPrice: { type: "number", nullable: true, example: 5200 },
          lastUpdated: { type: "string", nullable: true, example: "2026-03-09T12:00:00.000Z" },
          updatedBy: { type: "string", nullable: true, example: "Jane Manager" },
          hasPricing: { type: "boolean", example: true }
        }
      },
      PricingResponse: {
        type: "object",
        properties: {
          branch: { type: "string", example: "Maganjo" },
          products: { type: "array", items: { $ref: "#/components/schemas/PricingProduct" } }
        }
      },
      PricingUpdateRequest: {
        type: "object",
        required: ["sellingPrice"],
        properties: {
          sellingPrice: { type: "number", example: 5000 }
        }
      },
      PricingUpdateResult: {
        type: "object",
        properties: {
          message: { type: "string", example: "Price updated successfully." },
          product: {
            type: "object",
            properties: {
              productName: { type: "string", example: "Beans" },
              branch: { type: "string", example: "Maganjo" },
              sellingPrice: { type: "number", example: 5200 },
              updatedBy: { type: "string", example: "Jane Manager" },
              updatedAt: { type: "string", example: "2026-03-09T12:00:00.000Z" }
            }
          }
        }
      },
      SalesDashboardResponse: {
        type: "object",
        properties: {
          todaySales: { type: "number", example: 1200000 },
          customersToday: { type: "number", example: 5 },
          weeklySales: { type: "number", example: 6450000 },
          weeklyCustomers: { type: "number", example: 19 },
          bestDay: {
            type: "object",
            properties: {
              day: { type: "string", example: "Thursday" },
              amount: { type: "number", example: 2100000 }
            }
          }
        }
      },
      SalesBreakdownItem: {
        type: "object",
        properties: {
          category: { type: "string", example: "Cereal" },
          productName: { type: "string", example: "Beans" },
          unitsSold: { type: "number", example: 1800 },
          totalRevenue: { type: "number", example: 9000000 },
          percent: { type: "number", example: 42.5 }
        }
      },
      SalesBreakdownResponse: {
        type: "object",
        properties: {
          totalRevenue: { type: "number", example: 21200000 },
          count: { type: "number", example: 4 },
          data: { type: "array", items: { $ref: "#/components/schemas/SalesBreakdownItem" } }
        }
      },
      CreditRevenueResponse: {
        type: "object",
        properties: {
          totalCreditRevenue: { type: "number", example: 17500000 },
          totalCreditSales: { type: "number", example: 12 }
        }
      },
      SaleCreateResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Sale recorded successfully" },
          pricePerKg: { type: "number", example: 5200 },
          totalAmount: { type: "number", example: 7800000 }
        }
      },
      CreditPaymentResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Payment of 250000 received. Remaining balance: 750000" },
          status: { type: "string", example: "partial" },
          amountDue: { type: "number", example: 750000 },
          data: { $ref: "#/components/schemas/Sale" }
        }
      },
      ProcurementRecord: {
        type: "object",
        properties: {
          _id: { type: "string", example: "6642d27e1f8d5d5c3b2a3001" },
          produceName: { type: "string", example: "Beans" },
          produceType: { type: "string", example: "Cereal" },
          date: { type: "string", example: "2026-03-09" },
          time: { type: "string", example: "08:30" },
          tonnage: { type: "number", example: 3000 },
          cost: { type: "number", example: 4500 },
          dealerName: { type: "string", example: "Maganjo Farm" },
          branch: { type: "string", example: "Maganjo" },
          contact: { type: "string", example: "0700000001" },
          sellingPrice: { type: "number", example: 13500000 },
          invoiceNumber: { type: "string", example: "PROC-1710000000000" },
          paymentMethod: { type: "string", example: "Mobile Money" },
          paymentStatus: { type: "string", example: "Pending" },
          recordedBy: { type: "string", example: "6642d27e1f8d5d5c3b2a1001" },
          recordedByName: { type: "string", example: "Jane Manager" }
        }
      },
      ProcurementList: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/ProcurementRecord" }
          }
        }
      },
      ManagerStatisticsResponse: {
        type: "object",
        properties: {
          branch: { type: "string", example: "Maganjo" },
          monthlySales: {
            type: "object",
            properties: {
              labels: { type: "array", items: { type: "string" }, example: ["Week 1", "Week 2", "Week 3", "Week 4"] },
              data: { type: "array", items: { type: "number" }, example: [1200000, 1500000, 1800000, 1600000] }
            }
          },
          customerActivity: {
            type: "object",
            properties: {
              labels: { type: "array", items: { type: "string" }, example: ["New", "Returning", "Inactive"] },
              data: { type: "array", items: { type: "number" }, example: [5, 12, 3] }
            }
          },
          yearlyOverview: {
            type: "object",
            properties: {
              labels: { type: "array", items: { type: "string" }, example: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] },
              data: { type: "array", items: { type: "number" }, example: [0,0,1200000,1500000,0,0,0,0,0,0,0,0] }
            }
          }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/users/login": {
      post: {
        tags: ["Authentication"],
        summary: "Log in a user",
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } }
        },
        responses: {
          200: { description: "Login successful", content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } } },
          400: errorResponse,
          401: errorResponse
        }
      }
    },
    "/users/register": {
      post: {
        tags: ["Users"],
        summary: "Register a user",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UserWriteRequest" } } }
        },
        responses: { 201: { description: "User created", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessMessage" } } } }, 400: errorResponse, 403: errorResponse }
      }
    },
    "/users": { get: { tags: ["Users"], summary: "List visible users", responses: { 200: { description: "User list", content: { "application/json": { schema: { $ref: "#/components/schemas/UserList" } } } }, 403: errorResponse } } },
    "/users/branch": { get: { tags: ["Users"], summary: "List branch users", responses: { 200: { description: "Branch user list", content: { "application/json": { schema: { $ref: "#/components/schemas/UserList" } } } }, 400: errorResponse, 403: errorResponse } } },
    "/users/{id}": {
      get: { tags: ["Users"], summary: "Get one user", parameters: [idPathParam], responses: { 200: { description: "User", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } }, 403: errorResponse, 404: errorResponse } },
      put: {
        tags: ["Users"],
        summary: "Update a user",
        parameters: [idPathParam],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UserWriteRequest" } } } },
        responses: { 200: { description: "Updated user", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } }, 400: errorResponse, 403: errorResponse, 404: errorResponse }
      },
      delete: { tags: ["Users"], summary: "Delete a user", parameters: [idPathParam], responses: { 200: { description: "User deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessMessage" } } } }, 400: errorResponse, 403: errorResponse, 404: errorResponse } }
    },
    "/sales/dashboard": {
      get: {
        tags: ["Sales"],
        summary: "Get sales-agent dashboard summary",
        responses: {
          200: { description: "Dashboard summary", content: { "application/json": { schema: { $ref: "#/components/schemas/SalesDashboardResponse" } } } },
          403: errorResponse
        }
      }
    },
    "/sales/summary/breakdown": {
      get: {
        tags: ["Sales"],
        summary: "Get sales breakdown summary",
        parameters: [
          { name: "branch", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "startDate", in: "query", schema: { type: "string" } },
          { name: "endDate", in: "query", schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Breakdown summary", content: { "application/json": { schema: { $ref: "#/components/schemas/SalesBreakdownResponse" } } } },
          403: errorResponse
        }
      }
    },
    "/sales/summary/credit-revenue": {
      get: {
        tags: ["Sales"],
        summary: "Get total credit revenue",
        responses: {
          200: { description: "Credit revenue summary", content: { "application/json": { schema: { $ref: "#/components/schemas/CreditRevenueResponse" } } } },
          403: errorResponse
        }
      }
    },
    "/sales/history": { get: { tags: ["Sales"], summary: "Get sales history for the logged-in sales agent", responses: { 200: { description: "Sales history", content: { "application/json": { schema: { $ref: "#/components/schemas/SaleList" } } } }, 500: errorResponse } } },
    "/sales/branch": {
      get: {
        tags: ["Sales"],
        summary: "Get branch sales",
        parameters: [
          { name: "branch", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "startDate", in: "query", schema: { type: "string" } },
          { name: "endDate", in: "query", schema: { type: "string" } }
        ],
        responses: { 200: { description: "Branch sales", content: { "application/json": { schema: { $ref: "#/components/schemas/SaleList" } } } }, 400: errorResponse, 403: errorResponse }
      }
    },
    "/sales": {
      post: {
        tags: ["Sales"],
        summary: "Create a sale",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SaleWriteRequest" } } } },
        responses: {
          201: { description: "Sale created", content: { "application/json": { schema: { $ref: "#/components/schemas/SaleCreateResponse" } } } },
          400: errorResponse,
          403: errorResponse
        }
      }
    },
    "/credits": { get: { tags: ["Credit Sales"], summary: "List active credit sales", responses: { 200: { description: "Credit sales", content: { "application/json": { schema: { $ref: "#/components/schemas/SaleList" } } } }, 400: errorResponse } } },
    "/credits/all": {
      get: {
        tags: ["Credit Sales"],
        summary: "List all credit sales",
        parameters: [
          { name: "branch", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "startDate", in: "query", schema: { type: "string" } },
          { name: "endDate", in: "query", schema: { type: "string" } }
        ],
        responses: { 200: { description: "All credit sales", content: { "application/json": { schema: { $ref: "#/components/schemas/SaleList" } } } }, 400: errorResponse }
      }
    },
    "/credits/search": {
      get: {
        tags: ["Credit Sales"],
        summary: "Search active credit sales",
        parameters: [{ name: "query", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Matching credit sales", content: { "application/json": { schema: { $ref: "#/components/schemas/SaleList" } } } }, 400: errorResponse, 404: errorResponse }
      }
    },
    "/credits/{id}": {
      get: {
        tags: ["Credit Sales"],
        summary: "Get one credit sale",
        parameters: [idPathParam],
        responses: {
          200: { description: "Credit sale detail", content: { "application/json": { schema: { $ref: "#/components/schemas/Sale" } } } },
          400: errorResponse,
          404: errorResponse
        }
      }
    },
    "/credits/{id}/pay": {
      patch: {
        tags: ["Credit Sales"],
        summary: "Record a credit payment",
        parameters: [idPathParam],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { paymentAmount: { type: "number", example: 250000 } } } } } },
        responses: {
          200: { description: "Payment recorded", content: { "application/json": { schema: { $ref: "#/components/schemas/CreditPaymentResponse" } } } },
          400: errorResponse,
          403: errorResponse,
          404: errorResponse
        }
      }
    },
    "/procurement": {
      get: {
        tags: ["Procurement"],
        summary: "List procurement records",
        responses: {
          200: { description: "Procurement records", content: { "application/json": { schema: { $ref: "#/components/schemas/ProcurementList" } } } },
          403: errorResponse
        }
      },
      post: {
        tags: ["Procurement"],
        summary: "Create a procurement record",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProcurementWriteRequest" } } } },
        responses: {
          201: {
            description: "Procurement created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Procurement record created and inventory updated successfully" },
                    data: { $ref: "#/components/schemas/ProcurementRecord" }
                  }
                }
              }
            }
          },
          400: errorResponse,
          403: errorResponse
        }
      }
    },
    "/procurement/{id}": {
      get: {
        tags: ["Procurement"],
        summary: "Get one procurement record",
        parameters: [idPathParam],
        responses: {
          200: { description: "Procurement record", content: { "application/json": { schema: { $ref: "#/components/schemas/ProcurementRecord" } } } },
          400: errorResponse,
          404: errorResponse
        }
      },
      put: {
        tags: ["Procurement"],
        summary: "Update a procurement record",
        parameters: [idPathParam],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProcurementWriteRequest" } } } },
        responses: {
          200: {
            description: "Procurement updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Updated successfully" },
                    data: { $ref: "#/components/schemas/ProcurementRecord" }
                  }
                }
              }
            }
          },
          400: errorResponse,
          403: errorResponse
        }
      },
      delete: {
        tags: ["Procurement"],
        summary: "Delete a procurement record",
        parameters: [idPathParam],
        responses: {
          200: {
            description: "Procurement deleted",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessMessage" } } }
          },
          400: errorResponse,
          403: errorResponse
        }
      }
    },
    "/api/inventory": { get: { tags: ["Inventory"], summary: "Get branch inventory", responses: { 200: { description: "Inventory payload", content: { "application/json": { schema: { $ref: "#/components/schemas/InventoryResponse" } } } }, 400: errorResponse } } },
    "/api/pricing": { get: { tags: ["Pricing"], summary: "Get branch pricing", responses: { 200: { description: "Pricing payload", content: { "application/json": { schema: { $ref: "#/components/schemas/PricingResponse" } } } }, 400: errorResponse, 403: errorResponse } } },
    "/api/pricing/{productName}": {
      put: {
        tags: ["Pricing"],
        summary: "Update product selling price",
        parameters: [{ name: "productName", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PricingUpdateRequest" } } } },
        responses: {
          200: { description: "Price updated", content: { "application/json": { schema: { $ref: "#/components/schemas/PricingUpdateResult" } } } },
          400: errorResponse,
          403: errorResponse,
          404: errorResponse
        }
      }
    },
    "/api/manager/statistics": {
      get: {
        tags: ["Statistics"],
        summary: "Get manager branch statistics",
        responses: {
          200: { description: "Statistics payload", content: { "application/json": { schema: { $ref: "#/components/schemas/ManagerStatisticsResponse" } } } },
          403: errorResponse
        }
      }
    }
  }
};
