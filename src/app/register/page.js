'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
const router = useRouter()
const [name, setName] = useState('')
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [confirm, setConfirm] = useState('')
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)
const [isFirstUser, setIsFirstUser] = useState(false)

useEffect(() => {
// if already logged in, redirect away — dont let a new registration stomp the session
const existingToken = localStorage.getItem('token')
if (existingToken) {
fetch('/api/auth/me', { headers: { Authorization: `Bearer ${existingToken}` } })
.then(r => r.json())
.then(d => {
if (d.success) {
if (d.user.role === 'admin') {
router.push('/admin')
} else {
router.push('/dashboard')
}
}
})
.catch(() => {})
}

fetch('/api/auth/first-user-check')
.then(r => r.json())
.then(d => { if (d.isFirst) setIsFirstUser(true) })
.catch(() => {})
}, [])

async function handleRegister(e) {
e.preventDefault()
setError('')

if (!name || !email || !password || !confirm) {
setError('fill all fields')
return
}

if (password !== confirm) {
setError('passwords dont match')
return
}

if (password.length < 6) {
setError('password needs to be at least 6 chars')
return
}

setLoading(true)
try {
const res = await fetch('/api/auth/register', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ name, email, password })
})

const data = await res.json()

if (!data.success) {
setError(data.message)
return
}

// only store token/user if there is no existing admin session
// this prevents a new user registration from overwriting the logged-in admin's session
const existingToken = localStorage.getItem('token')
if (existingToken) {
// an admin created this account — dont overwrite their session, just show success
setError('')
// redirect admin back to admin panel since they're managing users
router.push('/admin')
return
}

localStorage.setItem('token', data.token)

const meRes = await fetch('/api/auth/me', {
headers: { Authorization: `Bearer ${data.token}` }
})
const meData = await meRes.json()

if (!meData.success) {
setError('account created but login failed, try logging in')
return
}

localStorage.setItem('user', JSON.stringify(meData.user))

if (meData.user.role === 'admin') {
router.push('/admin')
} else {
router.push('/dashboard')
}

} catch (err) {
setError('something went wrong')
} finally {
setLoading(false)
}
}

return (
<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
<div className="card" style={{ width: '100%', maxWidth: '400px' }}>
<div style={{ textAlign: 'center', marginBottom: '28px' }}>
<div style={{ fontSize: '24px', fontWeight: '700', color: '#4ade80', marginBottom: '4px' }}>PrimeTrade</div>
<p style={{ color: '#666', fontSize: '14px' }}>create your account</p>
</div>

{isFirstUser && (
<div style={{ background: '#0d1f0d', border: '1px solid #1a3a1a', borderRadius: '8px', padding: '10px 14px', marginBottom: '18px', fontSize: '12px', color: '#6aae6a', textAlign: 'center' }}>
👑 You're the first user — your account will be <strong>admin</strong>
</div>
)}

<form onSubmit={handleRegister}>
<div className="form-group">
<label>Name</label>
<input type="text" placeholder="your name" value={name} onChange={e => setName(e.target.value)} />
</div>

<div className="form-group">
<label>Email</label>
<input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
</div>

<div className="form-group">
<label>Password</label>
<input type="password" placeholder="min 6 chars" value={password} onChange={e => setPassword(e.target.value)} />
</div>

<div className="form-group">
<label>Confirm Password</label>
<input type="password" placeholder="same again" value={confirm} onChange={e => setConfirm(e.target.value)} />
</div>

{error && <p className="error-msg">{error}</p>}

<button type="submit" className="btn-green" style={{ width: '100%', marginTop: '18px', padding: '12px' }} disabled={loading}>
{loading ? 'creating account...' : 'Register'}
</button>
</form>

<p style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: '#666' }}>
have an account? <Link href="/login">login</Link>
</p>
</div>
</div>
)
}
