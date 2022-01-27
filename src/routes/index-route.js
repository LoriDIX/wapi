'use strict'

const express = require('express'); /* criar app mvc */
const router = express.Router();

/* criar nova rota */
router.get('/',(req,res,next) => {

    res.status(200).send({

        title: "WP Store API",
        version: "0.0.0.1"

    });

});

module.exports = router;
