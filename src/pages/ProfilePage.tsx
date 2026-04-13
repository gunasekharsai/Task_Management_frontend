import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { userApi, authApi } from '../server/services'
import { User2, Lock, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import './ProfilePage.css'

export default function ProfilePage() {
  const { user, setUser } = useAuth()

  const [profile, setProfile] = useState({
    fullName: user?.fullName ?? '',
    username: user?.username ?? '',
    bio:      user?.bio      ?? '',
  })
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  })
  const [savingProfile,  setSavingProfile]  = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const setP = (k: keyof typeof profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setProfile(f => ({ ...f, [k]: e.target.value }))

  const setPw = (k: keyof typeof passwords) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPasswords(f => ({ ...f, [k]: e.target.value }))

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const { data } = await userApi.updateMe({
        fullName: profile.fullName || undefined,
        username: profile.username,
        bio:      profile.bio || undefined,
      })
      setUser(data.data)
      toast.success('Profile updated!')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (passwords.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSavingPassword(true)
    try {
      await authApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword:     passwords.newPassword,
      })
      toast.success('Password changed!')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Profile card */}
        <div className="profile-left">
          <div className="card profile-hero-card">
            <div className="profile-avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <div className="profile-hero-info">
              <span className="profile-hero-name">{user?.fullName || user?.username}</span>
              <span className="profile-hero-email">{user?.email}</span>
              <span className="profile-hero-joined">
                Joined {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-right">
          {/* Edit profile */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="profile-section-header">
              <User2 size={16} /><h2 className="profile-section-title">Personal Info</h2>
            </div>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
              <div className="field">
                <label className="label">Full Name</label>
                <input className="input" placeholder="Jane Doe" value={profile.fullName} onChange={setP('fullName')} />
              </div>
              <div className="field">
                <label className="label">Username</label>
                <input className="input" placeholder="janedoe" value={profile.username} onChange={setP('username')} required />
              </div>
              <div className="field">
                <label className="label">Bio</label>
                <textarea className="input" placeholder="Tell your team a bit about yourself…" value={profile.bio} onChange={setP('bio')} rows={3} />
              </div>
              <div className="field">
                <label className="label">Email</label>
                <input className="input" value={user?.email ?? ''} disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                  {savingProfile ? <><span className="spinner" />Saving…</> : <><Save size={14} />Save Changes</>}
                </button>
              </div>
            </form>
          </div>

          {/* Change password */}
          <div className="card">
            <div className="profile-section-header">
              <Lock size={16} /><h2 className="profile-section-title">Change Password</h2>
            </div>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
              <div className="field">
                <label className="label">Current Password</label>
                <input className="input" type="password" placeholder="••••••••"
                  value={passwords.currentPassword} onChange={setPw('currentPassword')} required />
              </div>
              <div className="field">
                <label className="label">New Password</label>
                <input className="input" type="password" placeholder="Min. 8 characters"
                  value={passwords.newPassword} onChange={setPw('newPassword')} required />
              </div>
              <div className="field">
                <label className="label">Confirm New Password</label>
                <input className="input" type="password" placeholder="Repeat new password"
                  value={passwords.confirmPassword} onChange={setPw('confirmPassword')} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                  {savingPassword ? <><span className="spinner" />Changing…</> : <><Lock size={14} />Change Password</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}