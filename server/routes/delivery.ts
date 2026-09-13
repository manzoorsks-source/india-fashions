import { Router, Request, Response } from 'express';
import { validateDeliveryLocation } from '../services/deliveryService.js';

const router = Router();

router.post('/check', (req: Request, res: Response) => {
  const { latitude, longitude, pincode, address } = req.body;
  const result = validateDeliveryLocation(latitude, longitude, pincode);
  res.json(result);
});

export default router;
