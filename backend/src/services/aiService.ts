import { dbStore } from '../store';

export interface AIChatResponse {
  message: string;
  suggestedProductIds?: string[];
  disclaimer: string;
  escalateToHumanSupport: boolean;
}

export class MedcureAIAssistant {
  private static readonly MEDICAL_ADVICE_TRIGGERS = [
    'diagnose',
    'symptom',
    'disease',
    'dosage',
    'how many tablets',
    'how much ml',
    'substitute',
    'alternative for',
    'cure',
    'treatment plan',
    'fever for 5 days',
    'vomiting blood',
    'chest pain',
    'pregnant'
  ];

  public static async processCustomerPrompt(
    prompt: string, 
    userId?: string
  ): Promise<AIChatResponse> {
    const lowerPrompt = prompt.toLowerCase();

    // 1. Critical Medical Advice Guardrail
    for (const trigger of this.MEDICAL_ADVICE_TRIGGERS) {
      if (lowerPrompt.includes(trigger)) {
        return {
          message: "Medcure AI is an ordering assistant and cannot diagnose medical conditions, calculate drug dosages, or recommend treatments. For medical emergencies or diagnosis, please consult a registered medical doctor or qualified veterinarian immediately.",
          disclaimer: "Disclaimer: Medical advice and prescription approval must only be provided by qualified licensed practitioners.",
          escalateToHumanSupport: true
        };
      }
    }

    // 2. Order Status Lookup (Authenticated only)
    if (lowerPrompt.includes('order status') || lowerPrompt.includes('where is my order') || lowerPrompt.includes('track order')) {
      if (!userId) {
        return {
          message: "Please log in to your Medcure account so I can look up your active order status securely.",
          disclaimer: "Order lookups require verified authentication.",
          escalateToHumanSupport: false
        };
      }

      const userOrders = Array.from(dbStore.orders.values())
        .filter(o => o.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (userOrders.length === 0) {
        return {
          message: "You have no active or past orders in your account.",
          disclaimer: "Grounded real-time account data.",
          escalateToHumanSupport: false
        };
      }

      const latest = userOrders[0];
      const humanReadableState: Record<string, string> = {
        CREATED: 'created and received',
        PAYMENT_PENDING: 'awaiting payment',
        PAYMENT_CONFIRMED: 'payment confirmed and routed to pharmacy',
        PHARMACY_REVIEW: 'under prescription review by our registered pharmacist at Golghar',
        ACCEPTED: 'accepted by pharmacy',
        PACKING: 'being picked and packed',
        PACKED: 'packed in a tamper-evident seal bag, awaiting rider collection',
        RIDER_ASSIGNED: 'rider assigned for pickup',
        PICKED_UP: 'collected by rider',
        OUT_FOR_DELIVERY: 'out for delivery to your address in Gorakhpur',
        DELIVERED: 'delivered successfully',
        CANCELLED: 'cancelled'
      };

      return {
        message: `Your latest order ${latest.orderCode} is currently: ${humanReadableState[latest.state] || latest.state}. Total payable: ₹${latest.payableAmount.toFixed(2)}.`,
        disclaimer: "Order status sourced from Medcure live fulfillment engine.",
        escalateToHumanSupport: false
      };
    }

    // 3. Grounded Catalogue Search (Human & Veterinary)
    const tokens = lowerPrompt.replace(/[?,.!]/g, '').split(/\s+/).filter(t => t.length > 2);
    const matchedProducts = Array.from(dbStore.products.values()).filter(p => {
      const nameLower = p.name.toLowerCase();
      const genericLower = (p.genericSaltName || '').toLowerCase();
      const brandLower = p.brand.toLowerCase();

      // Check token match
      const hasTokenMatch = tokens.some(t => 
        nameLower.includes(t) || genericLower.includes(t) || brandLower.includes(t)
      );

      const hasDomainKeyword = 
        (p.categoryDomain === 'veterinary' && tokens.some(t => ['cattle', 'cow', 'dog', 'pet', 'vet', 'animal'].includes(t))) ||
        (p.categoryDomain === 'human' && tokens.some(t => ['fever', 'paracetamol', 'sugar', 'diabetes', 'human'].includes(t)));

      return hasTokenMatch || hasDomainKeyword;
    });

    if (matchedProducts.length > 0) {
      const first = matchedProducts[0];
      const inv = Array.from(dbStore.inventory.values()).find(i => i.productId === first.id);
      const stockInfo = inv && inv.availableQuantity > 0 ? `In Stock (₹${inv.sellingPrice.toFixed(2)})` : 'Currently Out of Stock';
      const domainLabel = first.categoryDomain === 'veterinary' ? 'Veterinary Product' : 'Human Healthcare';
      const rxNote = first.requiresPrescription ? ' [Requires Doctor/Vet Prescription]' : ' [Over The Counter]';

      let speciesExtra = '';
      if (first.speciesRestrictions && first.speciesRestrictions.length > 0) {
        speciesExtra = ` Suitable for: ${first.speciesRestrictions.map(s => s.speciesName).join(', ')}.`;
      }

      return {
        message: `Found in Medcure catalogue (${domainLabel}): **${first.name}** by ${first.manufacturer}.${rxNote}.${speciesExtra} Available at partner pharmacy in Gorakhpur: ${stockInfo}.`,
        suggestedProductIds: matchedProducts.slice(0, 3).map(p => p.id),
        disclaimer: "Medcure catalogue results. Verified dispensing only through licensed partner pharmacies.",
        escalateToHumanSupport: false
      };
    }

    // 4. Default Safe Response
    return {
      message: "I couldn't find an exact catalogue match in our Gorakhpur partner pharmacies for that item. Would you like to connect with our support desk or browse our Human / Veterinary categories?",
      disclaimer: "Medcure AI ordering assistant.",
      escalateToHumanSupport: true
    };
  }
}
