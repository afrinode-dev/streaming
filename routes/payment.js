const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// Créer une session de paiement
router.post('/create-session', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: { name: 'Abonnement StreamVision Premium' },
                    unit_amount: 599,
                    recurring: { interval: 'month' }
                },
                quantity: 1
            }],
            customer_email: user.email,
            client_reference_id: user._id.toString(),
            success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/subscribe`
        });
        
        res.json({ id: session.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la création de la session de paiement' });
    }
});

// Webhook Stripe pour les événements
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Erreur de webhook:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Gérer les événements
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await handleCheckoutSession(session);
            break;
        case 'invoice.paid':
            const invoice = event.data.object;
            await handleInvoicePaid(invoice);
            break;
        case 'invoice.payment_failed':
            const failedInvoice = event.data.object;
            await handlePaymentFailed(failedInvoice);
            break;
        default:
            console.log(`Événement non géré: ${event.type}`);
    }
    
    res.json({ received: true });
});

async function handleCheckoutSession(session) {
    const userId = session.client_reference_id;
    const user = await User.findById(userId);
    
    if (user) {
        user.role = 'subscriber';
        user.subscription = {
            plan: 'premium',
            status: 'active',
            startDate: new Date(),
            stripeId: session.customer
        };
        await user.save();
    }
}

async function handleInvoicePaid(invoice) {
    const stripeId = invoice.customer;
    const user = await User.findOne({ 'subscription.stripeId': stripeId });
    
    if (user) {
        user.subscription.status = 'active';
        await user.save();
    }
}

async function handlePaymentFailed(invoice) {
    const stripeId = invoice.customer;
    const user = await User.findOne({ 'subscription.stripeId': stripeId });
    
    if (user) {
        user.subscription.status = 'past_due';
        await user.save();
    }
}

module.exports = router;