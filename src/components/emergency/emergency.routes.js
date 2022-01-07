const express = require('express')

const router = express.Router({ mergeParams: true})
const validator = require('../../middlewares/validator')
const { emergencySchema } = require('./emergency.schema')
const { createEmergency, getEmergencies, getOwnEmergencies } = require('./emergency.controllers')
const { auth, authRole } = require ('../../middlewares/auth')

router.post('/', auth, validator(emergencySchema), createEmergency)
router.get('/', getEmergencies );
router.get('/mine', auth, getOwnEmergencies)


// router.get('/all', getAllProfiles)

module.exports = router