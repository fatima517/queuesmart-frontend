/**
 * Shared API helpers for QueueSmart static pages.
 * Expects JSON from the Express backend (MySQL field names on the wire).
 */
;(function (global) {
  'use strict'

  var STORAGE_KEY = 'qs_api_base'

  function getApiBase() {
    try {
      var fromStorage = global.sessionStorage && global.sessionStorage.getItem(STORAGE_KEY)
      if (fromStorage) return String(fromStorage).replace(/\/$/, '')
    } catch (_) {}
    if (global.QS_API_BASE) return String(global.QS_API_BASE).replace(/\/$/, '')
    return 'http://localhost:3000/api'
  }

  function setApiBase(url) {
    try {
      if (global.sessionStorage && url) global.sessionStorage.setItem(STORAGE_KEY, String(url).replace(/\/$/, ''))
    } catch (_) {}
  }

  function mapService(row) {
    if (!row) return null
    return {
      id: row.service_id,
      service_id: row.service_id,
      name: row.service_name,
      service_name: row.service_name,
      description: row.description,
      expectedDuration: row.expected_duration,
      expected_duration: row.expected_duration,
      priorityLevel: row.priority_level,
      priority_level: row.priority_level
    }
  }

  function mapServices(rows) {
    if (!Array.isArray(rows)) return []
    return rows.map(mapService)
  }

  function inferNotificationType(message) {
    if (!message) return 'welcome'
    if (message.indexOf("It's your turn") !== -1) return 'served'
    if (message.indexOf('almost up') !== -1) return 'almost'
    if (message.indexOf('joined the queue') !== -1) return 'joined'
    return 'welcome'
  }

  function mapNotification(row) {
    if (!row) return null
    var id = row.notification_id
    return {
      id: id,
      notification_id: id,
      message: row.message,
      timestamp: row.timestamp,
      read: row.status === 'viewed',
      status: row.status,
      type: inferNotificationType(row.message)
    }
  }

  function mapNotifications(rows) {
    if (!Array.isArray(rows)) return []
    return rows.map(mapNotification)
  }

  function joinQueuePayload(userId, serviceId) {
    return { user_id: userId, service_id: serviceId }
  }

  function mapQueueEntryForUi(entry, serviceRow) {
    if (!entry) return null
    var sid = entry.service_id != null ? entry.service_id : serviceRow && serviceRow.service_id
    return {
      entry_id: entry.entry_id,
      queue_id: entry.queue_id,
      user_id: entry.user_id,
      service_id: sid,
      position: entry.position,
      waitTime: entry.waitTime,
      status: entry.status,
      serviceName: entry.serviceName || (serviceRow && serviceRow.service_name)
    }
  }

  function mapHistoryRow(row) {
    var outcome = row.status === 'served' ? 'served' : row.status === 'canceled' ? 'left' : row.status
    return {
      serviceName: row.service_name,
      date: row.join_time ? new Date(row.join_time).toLocaleString() : '',
      outcome: outcome,
      status: row.status
    }
  }

  function getCurrentUser() {
    try {
      return JSON.parse(global.sessionStorage.getItem('qs_user') || '{}')
    } catch (_) {
      return {}
    }
  }

  function isAdminRole(role) {
    return role === 'admin' || role === 'administrator'
  }

  global.QS = global.QS || {}
  global.QS.api = {
    getApiBase: getApiBase,
    setApiBase: setApiBase,
    mapService: mapService,
    mapServices: mapServices,
    mapNotification: mapNotification,
    mapNotifications: mapNotifications,
    joinQueuePayload: joinQueuePayload,
    mapQueueEntryForUi: mapQueueEntryForUi,
    mapHistoryRow: mapHistoryRow,
    getCurrentUser: getCurrentUser,
    isAdminRole: isAdminRole
  }
})(typeof window !== 'undefined' ? window : globalThis)
