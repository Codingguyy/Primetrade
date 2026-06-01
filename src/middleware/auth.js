import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { connectDB } from '@/lib/db'
import User from '@/models/User'

export async function requireAuth(request) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ success: false, message: 'no token provided' }, { status: 401 }) }
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = verifyToken(token)
    await connectDB()
    const user = await User.findById(decoded.id)

    if (!user) {
      return { error: NextResponse.json({ success: false, message: 'user not found' }, { status: 401 }) }
    }

    return { user }
  } catch {
    return { error: NextResponse.json({ success: false, message: 'invalid or expired token' }, { status: 401 }) }
  }
}

export async function requireAdmin(request) {
  const result = await requireAuth(request)
  if (result.error) return result

  if (result.user.role !== 'admin') {
    return { error: NextResponse.json({ success: false, message: 'admins only' }, { status: 403 }) }
  }

  return result
}
