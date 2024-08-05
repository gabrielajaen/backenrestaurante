const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const paypal = require('paypal-rest-sdk')


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'ATvx6H4p1u__U-CWTl1krOutlVy_Xqd-V2khkeJJDWkDUpX7N6K12WeJjtqmNNCC77vFpFVdez0fcXa1',
    'client_secret': 'EKbdoH8UJJiFt1caFfeODNOcqhXwtWLDfASJov6clwIikRBHi4yNqIniKjNLvlk7IBkFN1OnzqA7rnhR'
});

app.globalAmount = 0;
app.post('/createPayment', function(req, res) {
    app.globalAmount = req.body.amount;
    var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/executePayment",
            "cancel_url": "http://localhost:3000/cancelPayment"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "item",
                    "sku": "item",
                    "price": req.body.amount,
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": req.body.amount
            },
            "description": "This is the payment description."
        }]
    };

    paypal.payment.create(create_payment_json, function(error, payment) {
        if (error) {
            res.status(500).send({ error: error });
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    // Enviar la URL de aprobación en formato JSON
                    return res.json({ url: payment.links[i].href });
                }
            }
            res.status(400).send({ error: 'No approval_url found in PayPal response' });
        }
    });
});



app.get('/executePayment', function(req, res) {
    var payerId = req.query.PayerID;
    var paymentId = req.query.paymentId;

    var execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": app.globalAmount
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function(error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log(JSON.stringify(payment));
            res.redirect(`http://localhost:8100/pagoexito?paymentId=${paymentId}`);
        }
    });
});



app.get('/cancelPayment', function(req, res) {
    res.redirect('http://localhost:8100/carrito');
})
app.listen(3000, function() {
    console.log('Server is running on port 3000');
});