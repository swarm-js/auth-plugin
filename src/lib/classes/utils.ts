import path from 'path'

export function joinUrl (baseUrl: string, ...paths: string[]): string | null {
  try {
    return new URL(path.join(...paths), baseUrl).href
  } catch {
    return null
  }
}
export function getHost (baseUrl: string): string | null {
  try {
    return new URL(baseUrl).host
  } catch {
    return null
  }
}
export function getHostname (baseUrl: string): string | null {
  try {
    return new URL(baseUrl).hostname
  } catch {
    return null
  }
}

export function getOrigin (baseUrl: string): string | null {
  try {
    return new URL(baseUrl).origin
  } catch {
    return null
  }
}
