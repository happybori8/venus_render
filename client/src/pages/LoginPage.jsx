import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAPI } from '../api/auth'
import useCartStore from '../store/cartStore'
import './LoginPage.css'

const INITIAL_FORM = {
  email: '',
  password: '',
}

/** 서버·네트워크 오류에서 사용자에게 보여줄 메시지 */
function resolveLoginErrorMessage(err) {
  const data = err.response?.data
  if (data && typeof data.message === 'string' && data.message.trim()) {
    return data.message
  }
  if (!err.response) {
    return '서버에 연결할 수 없습니다. 네트워크와 서버 실행 여부를 확인해 주세요.'
  }
  const status = err.response.status
  if (status === 400) {
    return data?.message || '이메일과 비밀번호 입력 형식을 확인해 주세요.'
  }
  if (status === 401) {
    return data?.message || '이메일 또는 비밀번호가 올바르지 않습니다.'
  }
  if (status >= 500) {
    return '일시적으로 로그인할 수 없습니다. 잠시 후 다시 시도해 주세요.'
  }
  return '로그인에 실패했습니다. 다시 시도해 주세요.'
}

export default function LoginPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      if (prev[name]) delete next[name]
      if (prev.server) delete next.server
      return next
    })
  }

  const validate = () => {
    const errs = {}
    if (!form.email.trim()) errs.email = '이메일을 입력해주세요'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = '올바른 이메일 형식이 아닙니다'
    if (!form.password) errs.password = '비밀번호를 입력해주세요'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
      }
      const { data } = await loginAPI(payload)

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      useCartStore.getState().hydrateCartAfterAuth()

      navigate('/')
    } catch (err) {
      const msg = resolveLoginErrorMessage(err)
      setErrors({ server: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">로그인</h1>

        {errors.server && <div className="msg-error">{errors.server}</div>}

        <form onSubmit={handleSubmit} noValidate autoComplete="off">
          <div className="form-group">
            <label htmlFor="email">
              이메일 <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              autoComplete="off"
              data-lpignore="true"
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              비밀번호 <span className="required">*</span>
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              autoComplete="new-password"
              data-lpignore="true"
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="login-footer">
          <span>계정이 없으신가요?</span>
          <button onClick={() => navigate('/register')}>회원가입</button>
        </div>

        <div className="back-link">
          <button onClick={() => navigate('/')}>← 메인으로 돌아가기</button>
        </div>
      </div>
    </div>
  )
}
