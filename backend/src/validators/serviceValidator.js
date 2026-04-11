const PRIORITY_LEVELS = new Set(['low', 'medium', 'high'])

function toFiniteNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : NaN
  }
  return NaN
}

function validateServiceCreateBody(body) {
  if (!body || typeof body !== 'object') {
    return 'All fields are required'
  }
  const { name, description, expectedDuration, priorityLevel } = body

  if (!name || !description || expectedDuration === undefined || expectedDuration === null || !priorityLevel) {
    return 'All fields are required'
  }
  if (typeof name !== 'string' || name.length > 50) {
    return 'Name must be under 50 characters'
  }
  if (typeof description !== 'string' || description.length > 200) {
    return 'Description must be under 200 characters'
  }
  const dur = toFiniteNumber(expectedDuration)
  if (typeof dur !== 'number' || !Number.isFinite(dur)) {
    return 'Expected duration must be a number'
  }
  if (typeof priorityLevel !== 'string') {
    return 'Priority level must be a string'
  }
  if (!PRIORITY_LEVELS.has(priorityLevel)) {
    return 'Priority level must be low, medium, or high'
  }
  return null
}

function validateServiceUpdateBody(body) {
  if (!body || typeof body !== 'object') {
    return null
  }
  const { name, description, expectedDuration, priorityLevel } = body

  if (name !== undefined && name !== null && (typeof name !== 'string' || name.length > 50)) {
    return 'Name must be under 50 characters'
  }
  if (description !== undefined && description !== null && (typeof description !== 'string' || description.length > 200)) {
    return 'Description must be under 200 characters'
  }
  if (expectedDuration !== undefined && expectedDuration !== null) {
    const dur = toFiniteNumber(expectedDuration)
    if (typeof dur !== 'number' || !Number.isFinite(dur)) {
      return 'Expected duration must be a number'
    }
  }
  if (priorityLevel !== undefined && priorityLevel !== null && priorityLevel !== '' && typeof priorityLevel !== 'string') {
    return 'Priority level must be a string'
  }
  return null
}

function parseServiceIdParam(raw) {
  const id = parseInt(String(raw), 10)
  return isNaN(id) ? null : id
}

module.exports = {
  validateServiceCreateBody,
  validateServiceUpdateBody,
  parseServiceIdParam,
  toFiniteNumber
}
