import { Router, Request, Response } from 'express';

const router = Router();

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'India Fashions Royal Heritage E-Commerce API',
    version: '1.0.0',
    description: 'RESTful API for the India Fashions customer storefront and operations dashboard.'
  },
  servers: [{ url: '/api', description: 'Local Development Server' }],
  paths: {
    '/products': {
      get: {
        summary: 'Get products with multi-faceted filtering, searching, and sorting',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'color', in: 'query', schema: { type: 'string' } },
          { name: 'fabric', in: 'query', schema: { type: 'string' } },
          { name: 'inStockOnly', in: 'query', schema: { type: 'boolean' } },
          { name: 'onSale', in: 'query', schema: { type: 'boolean' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['newest', 'price_asc', 'price_desc'] } }
        ],
        responses: { '200': { description: 'Filtered list of products' } }
      },
      post: {
        summary: 'Create product (Super Admin / Admin only)',
        responses: { '201': { description: 'Product created' }, '400': { description: 'Price protection violation' } }
      }
    },
    '/orders/checkout': {
      post: {
        summary: 'Submit customer order with 12km radius validation and pricing protection',
        responses: { '201': { description: 'Order created' }, '400': { description: 'Validation error' } }
      }
    },
    '/orders/{id}/verify-payment': {
      post: {
        summary: 'Head Cashier manual verification of IMPS/NEFT UTR reference',
        responses: { '200': { description: 'Payment status updated' } }
      }
    },
    '/advance-orders': {
      post: {
        summary: 'Submit advance order reservation for out-of-stock saree',
        responses: { '201': { description: 'Advance order recorded' } }
      }
    },
    '/delivery/check': {
      post: {
        summary: 'Check if customer address or coordinates are within 12 km delivery radius',
        responses: { '200': { description: 'Eligibility and distance result' } }
      }
    },
    '/events': {
      get: {
        summary: 'Server-Sent Events stream for live inventory, price, and campaign updates',
        responses: { '200': { description: 'SSE event stream' } }
      }
    }
  }
};

router.get('/', (req: Request, res: Response) => {
  res.json(openApiSpec);
});

export default router;
