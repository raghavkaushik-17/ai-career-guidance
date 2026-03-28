const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const supabase = require('../supabase');

function getRazorpay() {
  const Razorpay = require('razorpay');
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys not set in .env');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// GET /api/mentor/session
router.get('/session', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mentor_sessions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.warn('mentor session fetch:', error.message);
      return res.json(null);
    }
    res.json(data || null);
  } catch(e) {
    console.warn('mentor session error:', e.message);
    res.json(null);
  }
});

// POST /api/mentor/order
router.post('/order', async (req, res) => {
  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: 50000,
      currency: 'INR',
      receipt: 'ms_' + Date.now(),
      notes: { user_id: req.user.id }
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch(err) {
    console.error('Razorpay order error:', err.message);
    res.status(500).json({ error: err.message || 'Could not create payment order' });
  }
});

// POST /api/mentor/verify
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, preferences, demo } = req.body;

    if (demo) {
      // Demo mode - skip all verification
      console.log('[Mentor] Demo payment accepted');
    } else {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment details' });
      }
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment verification failed' });
      }
    }
    const { data, error } = await supabase
      .from('mentor_sessions')
      .insert({
        user_id: req.user.id,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        amount: 500,
        currency: 'INR',
        status: 'paid',
        preferences: preferences || {}
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, session: data });
  } catch(e) {
    console.error('Verify error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/mentor/sessions - all sessions (transaction history)
router.get('/sessions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mentor_sessions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) return res.json([]);
    res.json(data || []);
  } catch(e) { res.json([]); }
});

module.exports = router;