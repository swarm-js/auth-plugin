import { ofetch as $fetch } from 'ofetch'

function getHeaders () {
  return {}
}

export const useApi = prefix => ({
  async get (url, query = {}, options = {}) {
    return $fetch(`${prefix}${url}`, {
      method: 'GET',
      query,
      headers: getHeaders(),
      ...options
    })
  },
  async delete (url, query = {}, options = {}) {
    return $fetch(`${prefix}${url}`, {
      method: 'DELETE',
      query,
      headers: getHeaders(),
      ...options
    })
  },
  async post (url, body = {}, options = {}) {
    return $fetch(`${prefix}${url}`, {
      method: 'POST',
      body,
      headers: getHeaders(),
      ...options
    })
  },
  async patch (url, body = {}, options = {}) {
    return $fetch(`${prefix}${url}`, {
      method: 'PATCH',
      body,
      headers: getHeaders(),
      ...options
    })
  },
  async put (url, body = {}, options = {}) {
    return $fetch(`${prefix}${url}`, {
      method: 'PUT',
      body,
      headers: getHeaders(),
      ...options
    })
  }
})
