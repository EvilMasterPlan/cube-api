const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeSigningSecret = process.env.STRIPE_WEBHOOK_SECRET;

const db = require('./db.js');
const stripe = require('stripe')(stripeSecretKey);
const asyncHandler = require('express-async-handler');
const utility = require('./utility.js');
const moment = require('moment');

module.exports.createSession = asyncHandler(async(req, res, next) => {
  let err;

  const { type } = req.body;

  let priceID;

  switch(type) {
    case 'test_sub':
      priceID = 'price_1Im5HVEw1JWClEbEAm0ifthr';
      break;
    case 'cube_month_1':
      priceID = 'price_1LKSkgF16zTTfX72gu7wHG5Z';
      break;
    case 'cube_month_2':
      priceID = 'price_1LKSkgF16zTTfX723M034ysc';
      break;
    case 'cube_year_9':
      priceID = 'price_1LKSkgF16zTTfX72hb4PnlNb';
      break;
    case 'cube_year_12':
      priceID = 'price_1LKSkgF16zTTfX72WaI51Bn9';
      break;
    default:
      break;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      client_reference_id: req.user.UserID,
      customer_email: req.user.Email,
      line_items: [
        {
          price: priceID,
          quantity: 1,
        },
      ],
      success_url: 'https://www.prioritycube.com/account/subscribed',
      cancel_url: 'https://www.prioritycube.com/account/canceled',
    });

    req.result = {
      sessionId: session.id
    }
  } catch (e) {
    err = new Error(e.message);
    err.status = 400;
  }

  next(err);
});

module.exports.handleEvent = asyncHandler(async(req, res, next) => {
  let err;

  let event = req.body;

  if (stripeSigningSecret) {
    let signature = req.headers["stripe-signature"];

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeSigningSecret
      );
    } catch (err) {
      msg = `⚠️ Webhook signature verification failed. ${err.message}`;
      console.log(msg);
      err = new Error(msg);
      err.status = 400;
      return next(err);
    }
  }

  const eventData = event.data || {};
  const eventObject = eventData.object || {};
  const previousAttributes = eventData.previous_attributes || {};
  const stripeCustomerID = eventObject.customer;

  let periodEndTimestamp, periodEnd, stripePurchaseID;

  switch (event.type) {
    case 'checkout.session.completed':
      stripePurchaseID = eventObject.subscription;
      const userID = eventObject.client_reference_id;

      if (userID) {
        const product = 'cube';
        const tier = 'month_2';
        let purchaseID = utility.randomAlphaNumericString(10);
        await db.createPurchase(purchaseID, stripePurchaseID, stripeCustomerID, userID, product, tier, 'Active');
      }

      break;

    case 'customer.subscription.created':
      stripePurchaseID = eventObject.id;
      periodEndTimestamp = eventObject.current_period_end;
      periodEnd = moment.unix(periodEndTimestamp).utc().format('YYYY-MM-DD HH:mm:ss');

      await db.updatePurchaseStatus(stripePurchaseID, stripeCustomerID, 'Active', periodEnd);
      break;

    case 'customer.subscription.updated':
      stripePurchaseID = eventObject.id;
      periodEndTimestamp = eventObject.current_period_end;
      periodEnd = moment.unix(periodEndTimestamp).utc().format('YYYY-MM-DD HH:mm:ss');

      let previousCancellation = previousAttributes.cancel_at_period_end;
      let currentCancellation = eventObject.cancel_at_period_end;
      let status = eventObject.status;

      if (['unpaid', 'canceled', 'incomplete_expired'].includes(status)) {
        // terminate subscription
        console.log('terminate subscription: ', stripePurchaseID);
        await db.updatePurchaseStatus(stripePurchaseID, stripeCustomerID, 'Inactive', null);
      } else if (status === 'active') {

        if (previousCancellation === false && currentCancellation === true) {
          // cancel subscription
          console.log('cancel subscription: ', stripePurchaseID);
          await db.updatePurchaseStatus(stripePurchaseID, stripeCustomerID, 'Canceled', periodEnd);
        }

        if (previousCancellation === true && currentCancellation === false) {
          // renew subscription
          console.log('renew subscription: ', stripePurchaseID);
          await db.updatePurchaseStatus(stripePurchaseID, stripeCustomerID, 'Active', periodEnd);
        }

      }

      break;

    default:
    // Unhandled event type
  }

  next(err);
});

module.exports.handleTestEvent = asyncHandler(async(req, res, next) => {
  let err;

  let event = req.body;

  if (stripeSigningSecret) {
    let signature = req.headers["stripe-signature"];

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeSigningSecret
      );
    } catch (err) {
      msg = `⚠️ Webhook signature verification failed. ${err.message}`;
      console.log(msg);
      err = new Error(msg);
      err.status = 400;
      return next(err);
    }
  }

  const eventData = event.data || {};
  const eventObject = eventData.object || {};
  const previousAttributes = eventData.previous_attributes || {};
  const stripeCustomerID = eventObject.customer;

  let periodEndTimestamp, periodEnd, stripePurchaseID;

  switch (event.type) {
    case 'checkout.session.completed':
      stripePurchaseID = eventObject.subscription;
      const userID = eventObject.client_reference_id;

      if (userID) {
        const product = 'cube';
        const tier = 'month_2';
        let purchaseID = utility.randomAlphaNumericString(10);
        await db.createPurchase(purchaseID, stripePurchaseID, stripeCustomerID, userID, product, tier, 'Active');
      }

      break;

    case 'customer.subscription.created':
      stripePurchaseID = eventObject.id;
      periodEndTimestamp = eventObject.current_period_end;
      periodEnd = moment.unix(periodEndTimestamp).utc().format('YYYY-MM-DD HH:mm:ss');

      await db.updatePurchaseStatus(stripePurchaseID, stripeCustomerID, 'Active', periodEnd);
      break;

    case 'customer.subscription.updated':
      stripePurchaseID = eventObject.id;
      periodEndTimestamp = eventObject.current_period_end;
      periodEnd = moment.unix(periodEndTimestamp).utc().format('YYYY-MM-DD HH:mm:ss');

      let previousCancellation = previousAttributes.cancel_at_period_end;
      let currentCancellation = eventObject.cancel_at_period_end;
      let status = eventObject.status;

      if (['unpaid', 'canceled', 'incomplete_expired'].includes(status)) {
        // terminate subscription
        console.log('terminate subscription: ', stripePurchaseID);
        await db.updatePurchaseStatus(stripePurchaseID, stripeCustomerID, 'Inactive', null);
      } else if (status === 'active') {

        if (previousCancellation === false && currentCancellation === true) {
          // cancel subscription
          console.log('cancel subscription: ', stripePurchaseID);
          await db.updatePurchaseStatus(stripePurchaseID, stripeCustomerID, 'Canceled', periodEnd);
        }

        if (previousCancellation === true && currentCancellation === false) {
          // renew subscription
          console.log('renew subscription: ', stripePurchaseID);
          await db.updatePurchaseStatus(stripePurchaseID, stripeCustomerID, 'Active', periodEnd);
        }

      }

      break;

    default:
    // Unhandled event type
  }

  next(err);
});

module.exports.manageBilling = asyncHandler(async(req, res, next) => {
  let err;

  const customerID = req.body.customerID;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerID,
    return_url: 'https://www.prioritycube.com/account',
  });

  req.result = {
    portalURL: portalSession.url
  }

  next(err);
});
