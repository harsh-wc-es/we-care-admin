// ============================================================
// PayoutsPage — Redirect to EarningsPage (single source of truth)
// Both pages use the same earningsService and same backend endpoints.
// EarningsPage is the canonical payout lifecycle manager.
// This page is kept for route compatibility.
// ============================================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PayoutsPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/earnings', { replace: true }); }, [navigate]);
  return null;
}
