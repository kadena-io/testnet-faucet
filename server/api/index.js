'use strict'

const router = require('express').Router()
const fingerprint = require("../db")

//Query Date of Last request of this fingerprint
router.get('/fingerprint/:fingerprint', async (req, res, next) => {
  fingerprint.queryFP(req.params.fingerprint, (result)=>{
    res.send(result)
  })
})

//Insert or Update the date of request from this fingerprint
router.post('/fingerprint' ,async (req, res, next) => {
  fingerprint.insertFP(req.body.fingerprint, req.body.date);
  return {}
})

router.use((req, res, next) => {
  const err = new Error('API route not found!')
  err.status = 404
  next(err)
})


module.exports = router
