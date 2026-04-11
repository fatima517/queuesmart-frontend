const Service = require('../models/serviceModel');

// List all services
const listServices = (req, res) => {
  Service.getAll((err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching services' });
    }
    res.status(200).json(results);
  });
};

// Create a new service
const createService = (req, res) => {
  const { business_id = 1, name, description, expectedDuration, priorityLevel } = req.body;

  if (!name || !description || !expectedDuration || !priorityLevel) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (typeof name !== 'string' || name.length > 50) {
    return res.status(400).json({ message: 'Name must be under 50 characters' });
  }

  if (typeof description !== 'string' || description.length > 200) {
    return res.status(400).json({ message: 'Description must be under 200 characters' });
  }

  if (typeof expectedDuration !== 'number') {
    return res.status(400).json({ message: 'Expected duration must be a number' });
  }

  Service.create(
    business_id,
    name,
    description,
    expectedDuration,
    priorityLevel,
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error creating service' });
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
      });
    }
  );
};

// Update an existing service
const updateService = (req, res) => {
  const { id } = req.params;
  const { name, description, expectedDuration, priorityLevel } = req.body;

  Service.getById(id, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching service' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const existing = results[0];

    Service.updateById(
      id,
      name || existing.service_name,
      description || existing.description,
      expectedDuration || existing.expected_duration,
      priorityLevel || existing.priority_level,
      (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error updating service' });
        }

        res.status(200).json({
          message: 'Service updated',
          service: {
            id,
            name: name || existing.service_name,
            description: description || existing.description,
            expectedDuration: expectedDuration || existing.expected_duration,
            priorityLevel: priorityLevel || existing.priority_level
          }
        });
      }
    );
  });
};

module.exports = { listServices, createService, updateService };
