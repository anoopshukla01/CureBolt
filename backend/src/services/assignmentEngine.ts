import { 
  Order, 
  RiderPresence, 
  AssignmentSettings, 
  RiderOffer, 
  AssignmentDecision, 
  AssignmentDecisionCandidate, 
  CandidateScoreBreakdown, 
  AssignmentOutcome 
} from '../types';
import { dbStore } from '../store';

export class AssignmentEngine {
  /**
   * Calculate Haversine distance in km between two geo-coordinates
   */
  public static calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * Evaluate order for rider assignment
   */
  public static evaluateOrder(orderId: string, zoneId: string = 'zone-gkp-central'): AssignmentDecision {
    const order = dbStore.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const settings = dbStore.getAssignmentSettings(zoneId);
    const orderOffers = dbStore.getOrderOffers(orderId);
    const pastAttempts = orderOffers.length;

    // Check if auto assignment is paused for this specific order
    if (dbStore.isAutoAssignmentPaused(orderId)) {
      const decision: AssignmentDecision = {
        id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderId,
        zoneId,
        mode: settings.mode,
        evaluatedAt: new Date().toISOString(),
        candidateCount: 0,
        candidates: [],
        outcome: 'PAUSED',
        notes: 'Automatic assignment is paused for this order by a dispatcher',
        createdAt: new Date().toISOString()
      };
      dbStore.assignmentDecisions.set(decision.id, decision);
      return decision;
    }

    // Platform-wide kill switch forces MANUAL mode
    if (settings.killSwitchEnabled || settings.mode === 'MANUAL') {
      const decision: AssignmentDecision = {
        id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderId,
        zoneId,
        mode: 'MANUAL',
        evaluatedAt: new Date().toISOString(),
        candidateCount: 0,
        candidates: [],
        outcome: 'MANUAL_ONLY',
        notes: settings.killSwitchEnabled 
          ? 'Platform-wide kill switch active: manual dispatcher assignment only' 
          : 'Zone configured for manual dispatcher assignment only',
        createdAt: new Date().toISOString()
      };
      dbStore.assignmentDecisions.set(decision.id, decision);
      return decision;
    }

    // Check pharmacy location
    const pharmacy = dbStore.pharmacies.get(order.pharmacyId);
    const pharmacyLat = pharmacy?.latitude ?? 26.7606;
    const pharmacyLng = pharmacy?.longitude ?? 83.3732;

    // Effective search radius with expansion if previous attempts were declined/expired
    let currentRadius = settings.searchRadiusKm;
    if (pastAttempts > 0) {
      const expansion = pastAttempts * settings.radiusExpansionStepKm;
      currentRadius = Math.min(settings.searchRadiusKm + expansion, settings.maxExpandedRadiusKm);
    }

    const now = Date.now();
    const candidateDecisions: AssignmentDecisionCandidate[] = [];

    // All registered riders in presence table
    const allRiders = Array.from(dbStore.riderPresence.values());

    for (const rider of allRiders) {
      let eligible = true;
      let exclusionReason: string | undefined;

      // 1. Approval & suspension status
      if (!rider.isApproved || rider.isSuspended) {
        eligible = false;
        exclusionReason = !rider.isApproved ? 'Rider not approved' : 'Rider is suspended';
      }

      // 2. Licence validity
      if (eligible && rider.drivingLicenceExpiryDate) {
        const expiryDate = new Date(rider.drivingLicenceExpiryDate).getTime();
        if (expiryDate <= now) {
          eligible = false;
          exclusionReason = 'Driving licence expired';
        }
      }

      // 3. Online status
      if (eligible && !rider.isOnline) {
        eligible = false;
        exclusionReason = 'Rider is offline';
      }

      // 4. Location freshness <= 30 seconds
      const locAgeMs = now - new Date(rider.lastLocationUpdateAt).getTime();
      if (eligible && locAgeMs > 30000) {
        eligible = false;
        exclusionReason = `Stale GPS location (${Math.round(locAgeMs / 1000)}s old > 30s threshold)`;
      }

      // 5. Distance check (Haversine)
      const distanceKm = this.calculateDistanceKm(
        rider.currentLatitude, 
        rider.currentLongitude, 
        pharmacyLat, 
        pharmacyLng
      );
      if (eligible && distanceKm > currentRadius) {
        eligible = false;
        exclusionReason = `Outside search radius (${distanceKm} km > ${currentRadius} km)`;
      }

      // 6. Max concurrent orders check (default 1)
      if (eligible && rider.currentLoad >= settings.maxConcurrentOrders) {
        eligible = false;
        exclusionReason = `Load limit reached (${rider.currentLoad}/${settings.maxConcurrentOrders} active orders)`;
      }

      // 7. Cash in hand limit for COD orders (default ₹5,000 / 500,000 paise)
      const isCodOrder = order.paymentMode === 'COD';
      const orderAmountPaise = order.payableAmountPaise || Math.round(order.payableAmount * 100);
      if (eligible && isCodOrder && (rider.currentCashInHandPaise + orderAmountPaise > settings.maxCodCashPaise)) {
        eligible = false;
        exclusionReason = `Exceeds COD cash-in-hand limit (Current: ₹${(rider.currentCashInHandPaise / 100).toFixed(0)} + Order: ₹${(orderAmountPaise / 100).toFixed(0)} > Limit: ₹${(settings.maxCodCashPaise / 100).toFixed(0)})`;
      }

      // 8. Already offered this order?
      const alreadyOffered = orderOffers.some(o => o.riderId === rider.riderId && (o.status === 'declined' || o.status === 'expired'));
      if (eligible && alreadyOffered) {
        eligible = false;
        exclusionReason = 'Order previously declined or expired by this rider';
      }

      // 9. Holding other open offer? (Race-safety: 1 open offer per rider)
      const hasOtherOpenOffer = Array.from(dbStore.riderOffers.values()).some(
        o => o.riderId === rider.riderId && o.status === 'offered'
      );
      if (eligible && hasOtherOpenOffer) {
        eligible = false;
        exclusionReason = 'Rider currently has another pending offer';
      }

      // Calculate score breakdown
      const etaMinutes = Math.max(2, Math.ceil((distanceKm / 20) * 60) + 2); // 20 km/h average city transit
      const etaScore = Math.max(0, 1 - (etaMinutes / 30));
      const loadScore = Math.max(0, 1 - (rider.currentLoad / Math.max(1, settings.maxConcurrentOrders)));
      
      const idleMinutes = rider.lastCompletedDeliveryAt 
        ? Math.floor((now - new Date(rider.lastCompletedDeliveryAt).getTime()) / 60000) 
        : 120; // default 2 hours if new or first order
      const idleScore = Math.min(1, idleMinutes / 60);
      
      const acceptanceScore = Math.min(1, Math.max(0, rider.acceptanceRate));
      const ratingScore = Math.min(1, Math.max(0, rider.rating / 5.0));

      const weights = settings.scoringWeights;
      const totalScore = eligible 
        ? Number((
            (etaScore * weights.eta) +
            (loadScore * weights.load) +
            (idleScore * weights.idle) +
            (acceptanceScore * weights.acceptance) +
            (ratingScore * weights.rating)
          ).toFixed(4))
        : 0;

      const breakdown: CandidateScoreBreakdown = {
        distanceKm,
        etaMinutes,
        etaScore: Number((etaScore * weights.eta).toFixed(3)),
        loadScore: Number((loadScore * weights.load).toFixed(3)),
        idleScore: Number((idleScore * weights.idle).toFixed(3)),
        acceptanceScore: Number((acceptanceScore * weights.acceptance).toFixed(3)),
        ratingScore: Number((ratingScore * weights.rating).toFixed(3)),
        totalScore,
        eligible,
        exclusionReason
      };

      candidateDecisions.push({
        riderId: rider.riderId,
        riderName: rider.fullName,
        scoreBreakdown: breakdown,
        totalScore,
        eligible,
        exclusionReason
      });
    }

    // Rank eligible candidates: highest score first, tie-break deterministically by riderId
    const eligibleCandidates = candidateDecisions
      .filter(c => c.eligible)
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        return a.riderId.localeCompare(b.riderId);
      });

    // Check escalation limits
    if (eligibleCandidates.length === 0) {
      const isEscalated = pastAttempts >= settings.maxEscalationOffers;
      const outcome: AssignmentOutcome = isEscalated ? 'ESCALATED' : 'NO_CANDIDATES';

      // Raise operational alert
      dbStore.addOperationalAlert({
        alertType: isEscalated ? 'SLA_BREACH' : 'SLA_BREACH',
        severity: isEscalated ? 'critical' : 'warning',
        title: isEscalated ? `Assignment Escalated to Dispatcher: ${order.orderCode}` : `No Rider Available: ${order.orderCode}`,
        description: isEscalated 
          ? `Order ${order.orderCode} exceeded max automated attempts (${pastAttempts}/${settings.maxEscalationOffers}). Moved to dispatcher queue.`
          : `No eligible online riders within ${currentRadius} km of pharmacy for order ${order.orderCode}.`,
        entityType: 'order',
        entityId: order.id
      });

      const decision: AssignmentDecision = {
        id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderId,
        zoneId,
        mode: settings.mode,
        evaluatedAt: new Date().toISOString(),
        candidateCount: allRiders.length,
        candidates: candidateDecisions,
        outcome,
        notes: isEscalated 
          ? `Order escalated after ${pastAttempts} declined/expired offers. Dispatcher intervention required.` 
          : `Zero eligible riders found among ${allRiders.length} candidates.`,
        createdAt: new Date().toISOString()
      };

      dbStore.assignmentDecisions.set(decision.id, decision);
      return decision;
    }

    // Top candidate selected
    const topCandidate = eligibleCandidates[0];
    const offerExpiresAt = new Date(now + (settings.offerTimeoutSeconds * 1000)).toISOString();

    const newOffer: RiderOffer = {
      id: `off-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderId,
      riderId: topCandidate.riderId,
      riderName: topCandidate.riderName,
      status: 'offered',
      attemptNumber: pastAttempts + 1,
      offeredAt: new Date(now).toISOString(),
      expiresAt: offerExpiresAt,
      createdAt: new Date(now).toISOString()
    };

    dbStore.riderOffers.set(newOffer.id, newOffer);

    const decision: AssignmentDecision = {
      id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderId,
      zoneId,
      mode: settings.mode,
      evaluatedAt: new Date().toISOString(),
      candidateCount: allRiders.length,
      candidates: candidateDecisions,
      selectedRiderId: topCandidate.riderId,
      outcome: 'OFFERED',
      notes: `Offer #${newOffer.attemptNumber} dispatched to ${topCandidate.riderName} (Score: ${topCandidate.totalScore}). Valid for ${settings.offerTimeoutSeconds}s.`,
      createdAt: new Date().toISOString()
    };

    dbStore.assignmentDecisions.set(decision.id, decision);
    return decision;
  }

  /**
   * Respond to offer (accept or decline)
   */
  public static respondToOffer(
    offerId: string, 
    action: 'accept' | 'decline', 
    reason?: string
  ): { success: boolean; message: string; offer: RiderOffer } {
    const offer = dbStore.riderOffers.get(offerId);
    if (!offer) {
      throw new Error(`Offer ${offerId} not found`);
    }

    if (offer.status !== 'offered') {
      throw new Error(`Offer ${offerId} is already in '${offer.status}' state`);
    }

    const now = Date.now();
    const isExpired = new Date(offer.expiresAt).getTime() < now;

    if (isExpired && action === 'accept') {
      offer.status = 'expired';
      offer.respondedAt = new Date(now).toISOString();
      throw new Error('Offer has expired');
    }

    if (action === 'accept') {
      // 1. Mark this offer as accepted
      offer.status = 'accepted';
      offer.respondedAt = new Date(now).toISOString();

      // 2. Atomically cancel any other offers for this order
      const allOffers = Array.from(dbStore.riderOffers.values());
      for (const otherOffer of allOffers) {
        if (otherOffer.orderId === offer.orderId && otherOffer.id !== offer.id && otherOffer.status === 'offered') {
          otherOffer.status = 'cancelled';
        }
      }

      // 3. Atomically assign order to rider
      const order = dbStore.orders.get(offer.orderId);
      if (order) {
        order.riderId = offer.riderId;
        order.state = 'RIDER_ASSIGNED';
        order.updatedAt = new Date().toISOString();
      }

      // 4. Update rider load and presence
      const riderPresence = dbStore.riderPresence.get(offer.riderId);
      if (riderPresence) {
        riderPresence.currentLoad += 1;
        riderPresence.updatedAt = new Date().toISOString();
      }

      return {
        success: true,
        message: `Offer accepted by rider ${offer.riderName}. Order assigned.`,
        offer
      };
    } else {
      // Decline offer
      offer.status = 'declined';
      offer.respondedAt = new Date(now).toISOString();
      offer.declineReason = reason || 'Rider declined offer';

      // Automatically cascade to next candidate!
      try {
        this.evaluateOrder(offer.orderId);
      } catch (err) {
        console.warn('Failed to cascade assignment on decline:', err);
      }

      return {
        success: true,
        message: `Offer declined by rider ${offer.riderName}. Cascading to next candidate.`,
        offer
      };
    }
  }

  /**
   * Manual assignment by dispatcher (cancels active offers atomically)
   */
  public static manualAssign(
    orderId: string, 
    riderId: string, 
    staffUserId: string, 
    reason: string
  ): { success: boolean; order: Order; rider: RiderPresence } {
    const order = dbStore.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const rider = dbStore.riderPresence.get(riderId);
    if (!rider) {
      throw new Error(`Rider ${riderId} not found`);
    }

    if (!rider.isApproved || rider.isSuspended) {
      throw new Error(`Rider ${rider.fullName} is not eligible for assignment`);
    }

    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed reason is required for manual dispatcher assignment');
    }

    // 1. Cancel all outstanding offers for this order
    const orderOffers = dbStore.getOrderOffers(orderId);
    for (const off of orderOffers) {
      if (off.status === 'offered') {
        off.status = 'cancelled';
      }
    }

    // 2. Decrement load from previously assigned rider if any
    if (order.riderId && order.riderId !== riderId) {
      const prevRider = dbStore.riderPresence.get(order.riderId);
      if (prevRider) {
        prevRider.currentLoad = Math.max(0, prevRider.currentLoad - 1);
      }
    }

    // 3. Atomically assign order
    order.riderId = riderId;
    order.state = 'RIDER_ASSIGNED';
    order.updatedAt = new Date().toISOString();

    // 4. Increment new rider load
    rider.currentLoad += 1;
    rider.updatedAt = new Date().toISOString();

    // 5. Record intervention and audit
    dbStore.addDispatcherIntervention({
      orderId,
      staffUserId,
      interventionType: 'MANUAL_OVERRIDE',
      targetEntity: `rider:${riderId}`,
      notes: `Manual assignment to ${rider.fullName}. Reason: ${reason}`
    });

    dbStore.recordAudit(staffUserId, 'MANUAL_RIDER_ASSIGNMENT', 'order', orderId, {
      riderId,
      riderName: rider.fullName,
      reason
    });

    return { success: true, order, rider };
  }

  /**
   * Manual unassign by dispatcher
   */
  public static manualUnassign(
    orderId: string, 
    staffUserId: string, 
    reason: string
  ): { success: boolean; order: Order } {
    const order = dbStore.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed reason is required to unassign a rider');
    }

    const prevRiderId = order.riderId;
    if (prevRiderId) {
      const prevRider = dbStore.riderPresence.get(prevRiderId);
      if (prevRider) {
        prevRider.currentLoad = Math.max(0, prevRider.currentLoad - 1);
      }
    }

    // Cancel any active offers
    const orderOffers = dbStore.getOrderOffers(orderId);
    for (const off of orderOffers) {
      if (off.status === 'offered') {
        off.status = 'cancelled';
      }
    }

    order.riderId = undefined;
    order.state = 'PACKED'; // return to ready for dispatch
    order.updatedAt = new Date().toISOString();

    dbStore.addDispatcherIntervention({
      orderId,
      staffUserId,
      interventionType: 'MANUAL_OVERRIDE',
      targetEntity: `order:${orderId}`,
      notes: `Unassigned rider. Reason: ${reason}`
    });

    dbStore.recordAudit(staffUserId, 'MANUAL_RIDER_UNASSIGNMENT', 'order', orderId, {
      prevRiderId,
      reason
    });

    return { success: true, order };
  }
}
