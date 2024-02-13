const express = require ('express');
const axios = require('axios');
const router = express.Router();
const keys = require("../keys/keys");
const hmacSHA256 = require('crypto-js/hmac-sha256');
const Hex = require('crypto-js/enc-hex');
const controller = {};

const username = keys.username;
const password = keys.password;
const publickey = keys.publickey;

controller.home = (req, res) => {
    res.render("index", { title: 'Demo NodeJS', metodo: 'GET' })
}

controller.openLink = (req, res) => {
    const url = req.body.urlLink;
    res.redirect(url);
}

controller.paidResult = (req, res) => {
    console.log(req.body);
    const vadsResult = req.body.vads_result;
    const vadsTransStatus = req.body.vads_trans_status;
    const vadsAmount = req.body.vads_amount;
    const vadsOrder = req.body.vads_order_id;

    res.status(200).render("result", { 'result' : vadsResult, 'status': vadsTransStatus, 'monto': vadsAmount, 'order': vadsOrder});
}

controller.ipn = (req, res) => {
    const answer = JSON.parse(req.body["kr-answer"])
    const hash = req.body["kr-hash"]

    const answerHash = Hex.stringify(
        hmacSHA256(JSON.stringify(answer), keys.password)
    )
    console.log('IPN');
    console.log(answer);
    console.log('Codigo Hash: ' + answerHash);

    if (hash === answerHash){
        res.status(200).send({'response' : answer.orderStatus })
    }
    else {
        res.status(500).send( {'response' : 'Es probable un intento de fraude'})
    }
}

controller.paidUrl = async (req, res) => {
    const amount = parseFloat(req.body.amount) * 100;
    const orderId = req.body.orderId;
    const email = req.body.email;
    
    var channelType = "" 
    var check = req.body.enviarCorreo === 'on'
    if (check){
        channelType = "MAIL"
        console.log("mail");
    }else{
        channelType = "URL"
        console.log("url");
    }

    url = 'https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePaymentOrder';
    const auth = 'Basic ' + btoa(username + ':' + password); 

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': auth,
    };

    // Datos de la compra
    const data = {
        "amount":   amount,
        "cancelUrl": "https://mlxmn83f-3000.brs.devtunnels.ms/result",
        "successUrl": "https://mlxmn83f-3000.brs.devtunnels.ms/result",
        "returnMode": "POST",
        "currency": "PEN",
        "orderId":  orderId,
        "channelOptions": {
            "mailOptions": {
              "subject": "Pago",
              "recipient": email
            },
            "channelType": channelType
        },
        "customer": {
            "email": email
        }
    };

    // Realizar la solicitud POST utilizando Axios
    const response = await axios.post(url, data, {
        headers: headers,
      });

    if (response.data.status == 'SUCCESS'){
        console.log(response.data.status);
        const url = response.data.answer.paymentURL;
        console.log(url);
        res.render('index', {  title: 'Demo NodeJS', metodo: 'POST' , orderId: orderId, amount: amount, email: email, check: check, url:url});
    }else{
        console.error(response.data);
        res.status(500).send('error');
    }
}

module.exports = controller;