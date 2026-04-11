function validateJoinQueueBody(body) {
  if (!body || typeof body !== 'object') {
    return { message: 'user_id and service_id are required' }
  }
  const user_id = body.user_id !== undefined && body.user_id !== null ? body.user_id : body.userId
  const service_id = body.service_id !== undefined && body.service_id !== null ? body.service_id : body.serviceId

  if (user_id === undefined || user_id === null || user_id === '' || service_id === undefined || service_id === null || service_id === '') {
    return { message: 'user_id and service_id are required' }
  }
  if (typeof user_id !== 'number' && isNaN(parseInt(user_id, 10))) {
    return { message: 'user_id must be a number' }
  }
  if (typeof service_id !== 'number' && isNaN(parseInt(service_id, 10))) {
    return { message: 'service_id must be a number' }
  }
  return null
}

function validateUserIdParam(raw) {
  const user_id = parseInt(raw, 10)
  if (isNaN(user_id)) {
    return { message: 'userId is required' }
  }
  return null
}

function parseOptionalServiceFilter(body) {
  if (!body || typeof body !== 'object') return null
  const raw = body.service_id !== undefined && body.service_id !== null ? body.service_id : body.serviceId
  if (raw === undefined || raw === null || raw === '') return null
  const n = parseInt(String(raw), 10)
  return isNaN(n) ? null : n
}

module.exports = {
  validateJoinQueueBody,
  validateUserIdParam,
  parseOptionalServiceFilter
}
