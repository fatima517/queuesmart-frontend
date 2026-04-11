const { validateRegisterBody, validateLoginBody } = require('../src/validators/authValidator')
const {
  validateJoinQueueBody,
  validateUserIdParam,
  parseOptionalServiceFilter
} = require('../src/validators/queueValidator')
const {
  validateServiceCreateBody,
  validateServiceUpdateBody,
  parseServiceIdParam,
  toFiniteNumber
} = require('../src/validators/serviceValidator')

describe('authValidator', () => {
  test('register rejects non-object body', () => {
    expect(validateRegisterBody(null)).toBe('All fields are required')
    expect(validateRegisterBody(undefined)).toBe('All fields are required')
  })

  test('register rejects missing fields', () => {
    expect(validateRegisterBody({})).toBe('All fields are required')
    expect(validateRegisterBody({ name: 'A', email: 'a@b.com' })).toBe('All fields are required')
  })

  test('register rejects bad name length', () => {
    expect(validateRegisterBody({ name: 'X', email: 'a@b.com', password: '12345678' })).toMatch(/Name/)
    expect(validateRegisterBody({ name: 'A'.repeat(101), email: 'a@b.com', password: '12345678' })).toMatch(/Name/)
  })

  test('register rejects invalid email types and format', () => {
    expect(validateRegisterBody({ name: 'Ab', email: 'a'.repeat(255), password: '12345678' })).toBe('Invalid email')
    expect(validateRegisterBody({ name: 'Ab', email: 'not-email', password: '12345678' })).toBe('Invalid email format')
  })

  test('register rejects bad password length', () => {
    expect(validateRegisterBody({ name: 'Ab', email: 'a@b.com', password: 'short' })).toMatch(/Password/)
  })

  test('register accepts valid body', () => {
    expect(validateRegisterBody({ name: 'Ab', email: 'a@b.com', password: '12345678' })).toBeNull()
  })

  test('login rejects non-object and missing fields', () => {
    expect(validateLoginBody(null)).toBe('Email and password are required')
    expect(validateLoginBody({ email: 'a@b.com' })).toBe('Email and password are required')
  })

  test('login rejects non-string fields', () => {
    expect(validateLoginBody({ email: 1, password: 'x' })).toBe('Email and password must be strings')
  })

  test('login accepts valid', () => {
    expect(validateLoginBody({ email: 'a@b.com', password: 'secret' })).toBeNull()
  })
})

describe('queueValidator', () => {
  test('join rejects invalid body', () => {
    expect(validateJoinQueueBody(null).message).toBeDefined()
    expect(validateJoinQueueBody({}).message).toBe('user_id and service_id are required')
  })

  test('join rejects non-numeric ids', () => {
    expect(validateJoinQueueBody({ user_id: 'x', service_id: 1 }).message).toContain('user_id')
    expect(validateJoinQueueBody({ user_id: 1, service_id: 'y' }).message).toContain('service_id')
  })

  test('join accepts snake and camel case', () => {
    expect(validateJoinQueueBody({ user_id: 1, service_id: 2 })).toBeNull()
    expect(validateJoinQueueBody({ userId: 1, serviceId: 2 })).toBeNull()
  })

  test('validateUserIdParam', () => {
    expect(validateUserIdParam('abc').message).toBe('userId is required')
    expect(validateUserIdParam('5')).toBeNull()
  })

  test('parseOptionalServiceFilter', () => {
    expect(parseOptionalServiceFilter(null)).toBeNull()
    expect(parseOptionalServiceFilter({})).toBeNull()
    expect(parseOptionalServiceFilter({ service_id: 3 })).toBe(3)
    expect(parseOptionalServiceFilter({ serviceId: '4' })).toBe(4)
    expect(parseOptionalServiceFilter({ service_id: 'bad' })).toBeNull()
  })
})

describe('serviceValidator', () => {
  test('toFiniteNumber', () => {
    expect(toFiniteNumber(5)).toBe(5)
    expect(toFiniteNumber('12')).toBe(12)
    expect(Number.isNaN(toFiniteNumber('x'))).toBe(true)
    expect(Number.isNaN(toFiniteNumber(''))).toBe(true)
  })

  test('validateServiceCreateBody', () => {
    expect(validateServiceCreateBody(null)).toBe('All fields are required')
    expect(validateServiceCreateBody({ name: 'x', description: 'd' })).toBe('All fields are required')
    expect(validateServiceCreateBody({
      name: 'A'.repeat(51), description: 'd', expectedDuration: 1, priorityLevel: 'low'
    })).toMatch(/Name/)
    expect(validateServiceCreateBody({
      name: 'ok', description: 'B'.repeat(201), expectedDuration: 1, priorityLevel: 'low'
    })).toMatch(/Description/)
    expect(validateServiceCreateBody({
      name: 'ok', description: 'd', expectedDuration: 'nope', priorityLevel: 'low'
    })).toMatch(/Expected duration/)
    expect(validateServiceCreateBody({
      name: 'ok', description: 'd', expectedDuration: 5, priorityLevel: 5
    })).toMatch(/Priority level must be a string/)
    expect(validateServiceCreateBody({
      name: 'ok', description: 'd', expectedDuration: 5, priorityLevel: 'urgent'
    })).toMatch(/low, medium, or high/)
    expect(validateServiceCreateBody({
      name: 'ok', description: 'd', expectedDuration: 5, priorityLevel: 'medium'
    })).toBeNull()
  })

  test('validateServiceUpdateBody', () => {
    expect(validateServiceUpdateBody(null)).toBeNull()
    expect(validateServiceUpdateBody({ name: 'A'.repeat(51) })).toMatch(/Name/)
    expect(validateServiceUpdateBody({ description: 'B'.repeat(201) })).toMatch(/Description/)
    expect(validateServiceUpdateBody({ expectedDuration: 'x' })).toMatch(/Expected duration/)
    expect(validateServiceUpdateBody({ priorityLevel: 9 })).toMatch(/Priority level must be a string/)
    expect(validateServiceUpdateBody({ name: 'ok' })).toBeNull()
  })

  test('parseServiceIdParam', () => {
    expect(parseServiceIdParam('12')).toBe(12)
    expect(parseServiceIdParam('x')).toBeNull()
  })
})
