import { getWeeklyInstallCount } from '../lib/getWeeklyInstallCount'

export const config = {
  runtime: 'edge',
}

// Helper: Convert the incoming Request to a CORS-friendly Response
function withCors(body: string, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...extraHeaders,
    },
  })
}

export default async function handler(request: Request): Promise<Response> {
  // Support CORS pre-flight
  if (request.method === 'OPTIONS') {
    return withCors('')
  }

  try {
    const count = await getWeeklyInstallCount()
    return withCors(JSON.stringify({ count }))
  } catch (error) {
    console.error('Error in /api/count:', error)
    return withCors(JSON.stringify({ error: 'internal_error' }), 500)
  }
} 