'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
const router = useRouter()
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)

async function handleLogin(e) {
e.preventDefault()
setError('')

if (!email || !password) {
setError('please fill all fields')
return
}

setLoading(true)
try {
const res = await fetch('/api/auth/login', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ email, password })
})

const data = await res.json()

if (!data.success) {
setError(data.message)
return
}

localStorage.setItem('token', data.token)

const meRes = await fetch('/api/auth/me', {
headers: { Authorization: `Bearer ${data.token}` }
})
const meData = await meRes.json()

if (!meData.success) {
setError('login failed, try again')
return
}

localStorage.setItem('user', JSON.stringify(meData.user))

if (meData.user.role === 'admin') {
router.push('/admin')
} else {
router.push('/dashboard')
}

} catch (err) {
setError('something went wrong, try again')
} finally {
setLoading(false)
}
}

return (
<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
<div className="card" style={{ width: '100%', maxWidth: '400px' }}>
<div style={{ textAlign: 'center', marginBottom: '28px' }}>
<div style={{ fontSize: '24px', fontWeight: '700', color: '#4ade80', marginBottom: '4px' }}>PrimeTrade</div>
<p style={{ color: '#666', fontSize: '14px' }}>sign in to your account</p>
</div>

<form onSubmit={handleLogin}>
<div className="form-group">
<label>Email</label>
<input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
</div>

<div className="form-group">
<label>Password</label>
<input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
</div>

{error && <p className="error-msg">{error}</p>}

<button type="submit" className="btn-green" style={{ width: '100%', marginTop: '18px', padding: '12px' }} disabled={loading}>
{loading ? 'logging in...' : 'Login'}
</button>
</form>

<p style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: '#666' }}>
no account? <Link href="/register">register here</Link>
</p>
</div>
</div>
)
}
