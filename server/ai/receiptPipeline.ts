import { extractVisionData } from './orchestrator.js';

export interface ReceiptExtractionResult {
  merchantName: string;
  totalAmount: number;
  date: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    amount: number;
  }>;
  confidenceScore: number;
}

/**
 * Pipeline to process a receipt image and extract structured data using AI vision models.
 */
export async function processReceiptImage(
  imageBuffer: Buffer, 
  mimeType: string
): Promise<ReceiptExtractionResult> {
  const prompt = `
Extract the information from this receipt into the following JSON format:
{
  "merchantName": "Name of the store or vendor",
  "totalAmount": 12.34,
  "date": "YYYY-MM-DD",
  "lineItems": [
    {
      "description": "Item description",
      "quantity": 1,
      "amount": 5.00
    }
  ],
  "confidenceScore": 95
}

Rules:
- Parse all numbers as floats.
- For confidenceScore, provide a number from 0 to 100 indicating how clear and readable the receipt is.
- If a field is not found, leave it empty or 0.
- Return ONLY valid JSON.
  `;

  // We rely on the orchestrator to route to the vision provider (e.g., fal.ai)
  const result = await extractVisionData<ReceiptExtractionResult>(imageBuffer, mimeType, prompt);

  if (!result.success || !result.data) {
    throw new Error(`Failed to extract receipt data: ${result.error || 'Unknown error'}`);
  }

  // Basic validation/normalization
  const data = result.data;
  return {
    merchantName: data.merchantName || 'Unknown Vendor',
    totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : parseFloat(String(data.totalAmount)) || 0,
    date: data.date || new Date().toISOString().split('T')[0],
    lineItems: Array.isArray(data.lineItems) ? data.lineItems.map(item => ({
      description: item.description || 'Unknown Item',
      quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity)) || 1,
      amount: typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount)) || 0,
    })) : [],
    confidenceScore: typeof data.confidenceScore === 'number' ? data.confidenceScore : 50
  };
}
