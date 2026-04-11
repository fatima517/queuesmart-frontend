// src/controllers/serviceController.js
const Service = require('../models/serviceModel')
const {
  validateServiceCreateBody,
  validateServiceUpdateBody,
  parseServiceIdParam,
  toFiniteNumber
} = require('../validators/serviceValidator')

const listServices = (req, res) => {
  Service.getAll((err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching services' })
    }
    res.status(200).json(results)
  })
}

const createService = (req, res) => {
  const validationError = validateServiceCreateBody(req.body)
  if (validationError) {
    return res.status(400).json({ message: validationError })
  }

  const { business_id = 1, name, description, expectedDuration, priorityLevel } = req.body
  const durationValue = toFiniteNumber(expectedDuration)

  Service.create(
    business_id,
    name,
    description,
    durationValue,
    priorityLevel,
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error creating service' })
      }
      res.status(201).json({
        message: 'Service created',
        service: {
          id: result.insertId,
          name,
          description,
          expectedDuration,
          priorityLevel
        }
      })
    }
  )
}

const updateService = (req, res) => {
  const id = parseServiceIdParam(req.params.id)
  if (id === null) {
    return res.status(400).json({ message: 'Invalid service id' })
  }

  const { name, description, expectedDuration, priorityLevel } = req.body

  Service.getById(id, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching service' })
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Service not found' })
    }

    const existing = results[0]

    const updateErr = validateServiceUpdateBody(req.body)
    if (updateErr) {
      return res.status(400).json({ message: updateErr })
    }

    const nextDuration =
      expectedDuration !== undefined && expectedDuration !== null
        ? toFiniteNumber(expectedDuration)
        : existing.expected_duration

    Service.updateById(
      id,
      name || existing.service_name,
      description || existing.description,
      nextDuration,
      priorityLevel || existing.priority_level,
      (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error updating service' })
        }
        res.status(200).json({
          message: 'Service updated',
          service: {
            id,
            name: name || existing.service_name,
            description: description || existing.description,
            expectedDuration: expectedDuration ?? existing.expected_duration,
            priorityLevel: priorityLevel || existing.priority_level
          }
        })
      }
    )
  })
}

module.exports = { listServices, createService, updateService }
