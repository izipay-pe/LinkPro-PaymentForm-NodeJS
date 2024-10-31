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

controller.paidUrl = async (req, res) => {
    const amount = parseFloat(req.body.amount) * 100;
    const orderId = req.body.orderId;
    const email = req.body.email;
    const date = req.body.date;
    const time = req.body.time;
    
    const [year, month, day] = date.split("-");
    const [hours, minutes] = time.split(":");
    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}:00-05:00`;

    var channelType = "" 
    var check = req.body.enviarCorreo === 'on'

    if (check){
        channelType = "MAIL"
    }else{
        channelType = "URL"
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
        "cancelUrl": "http://localhost:3000/result",
        "successUrl": "http://localhost:3000/result",
        "returnMode": "POST",
        "currency": "PEN",
        "orderId":  orderId,
        "expirationDate": formattedDateTime,
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
        const url = response.data.answer.paymentURL;
        console.log(url);
        res.render('index', {  title: 'Demo NodeJS', metodo: 'POST' , orderId: orderId, amount: amount, email: email, date: date, time: time, check: check, url:url});
    }else{
        console.error(response.data);
        res.render('error', { status: response.data.status, message: response.data.answer.detailedErrorMessage});
    }
}

controller.paidResult = (req, res) => {
    const vadsResult = req.body.vads_result;
    const vadsTransStatus = req.body.vads_trans_status;
    const vadsAmount = req.body.vads_amount;
    const vadsOrder = req.body.vads_order_id;

    res.status(200).render("result", { 'result' : vadsResult, 'status': vadsTransStatus, 'monto': vadsAmount, 'order': vadsOrder});
}

controller.ipn = (req, res) => {
    console.log(req.body);
    const answer = JSON.parse(req.body["kr-answer"])
    const hash = req.body["kr-hash"]

    const answerHash = Hex.stringify(
        hmacSHA256(JSON.stringify(answer), keys.password)
    )

    if (hash === answerHash){
        res.status(200).send({'response' : answer.orderStatus })
    }
    else {
        res.status(500).send( {'response' : 'Es probable un intento de fraude'})
    }
}

module.exports = controller;
