import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import './AuthPage.css'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' })
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card fade-up">
        <div className="auth-logo"><Zap size={22} fill="currentColor" />TaskFlow</div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Get started with TaskFlow for free</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label className="label">Full Name</label>
            <input className="input" placeholder="Jane Doe" value={form.fullName} onChange={set('fullName')} />
          </div>
          <div className="field">
            <label className="label">Username</label>
            <input className="input" placeholder="janedoe" value={form.username} onChange={set('username')} required />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required />
          </div>
          <button className="btn btn-primary" style={{ width:'100%', marginTop:4 }} type="submit" disabled={loading}>
            {loading ? <><span className="spinner" />Creating account…</> : 'Create account'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}