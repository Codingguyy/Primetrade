import { NextResponse } from 'next/server'
import { requireAuth } from '@/middleware/auth'

export async function GET(request) {
  const { user, error } = await requireAuth(request)
  if (error) return error

  return NextResponse.json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }
  })
}
