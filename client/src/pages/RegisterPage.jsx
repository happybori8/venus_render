import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerAPI } from '../api/auth'
import useCartStore from '../store/cartStore'
import './RegisterPage.css'

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  address: {
    zipCode: '',
    street: '',
    detail: '',
    city: '',
  },
}

export default function RegisterPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    if (['zipCode', 'street', 'detail', 'city'].includes(name)) {
      setForm((prev) => ({
        ...prev,
        address: { ...prev.address, [name]: value },
      }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}

    if (!form.name.trim()) newErrors.name = '이름을 입력해주세요'
    if (!form.email.trim()) newErrors.email = '이메일을 입력해주세요'
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      newErrors.email = '올바른 이메일 형식이 아닙니다'

    if (!form.password) newErrors.password = '비밀번호를 입력해주세요'
    else if (form.password.length < 6)
      newErrors.password = '비밀번호는 6자 이상이어야 합니다'

    if (!form.confirmPassword)
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요'
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다'

    if (!form.phone.trim()) newErrors.phone = '휴대폰 번호를 입력해주세요'
    else if (!/^01[016789]\d{7,8}$/.test(form.phone))
      newErrors.phone = '올바른 휴대폰 번호 형식이 아닙니다 (예: 01012345678)'

    return newErrors
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
      const submitData = { ...form }
      delete submitData.confirmPassword
      const { data } = await registerAPI(submitData)

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      useCartStore.getState().hydrateCartAfterAuth()

      setSuccessMsg(`${data.user.name}님, 회원가입이 완료되었습니다! 메인 페이지로 이동합니다.`)
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      const msg = err.response?.data?.message || '회원가입에 실패했습니다'
      setErrors({ server: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h2 className="register-title">회원가입</h2>

        {successMsg && <p className="msg-success">{successMsg}</p>}
        {errors.server && <p className="msg-error">{errors.server}</p>}

        <form onSubmit={handleSubmit} noValidate>

          {/* ── 필수 정보 ── */}
          <div className="section-label">필수 정보</div>

          <div className="form-group">
            <label>이름 <span className="required">*</span></label>
            <input
              type="text"
              name="name"
              placeholder="홍길동"
              value={form.name}
              onChange={handleChange}
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>이메일 <span className="required">*</span></label>
            <input
              type="email"
              name="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>비밀번호 <span className="required">*</span></label>
            <input
              type="password"
              name="password"
              placeholder="6자 이상 입력"
              value={form.password}
              onChange={handleChange}
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label>비밀번호 확인 <span className="required">*</span></label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="비밀번호를 다시 입력"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
          </div>

          <div className="form-group">
            <label>휴대폰 번호 <span className="required">*</span></label>
            <input
              type="tel"
              name="phone"
              placeholder="01012345678 (- 없이 입력)"
              value={form.phone}
              onChange={handleChange}
              maxLength={11}
            />
            {errors.phone && <span className="error">{errors.phone}</span>}
          </div>

          {/* ── 주소 (선택) ── */}
          <div className="section-label">
            주소 <span className="optional">(선택)</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>우편번호</label>
              <input
                type="text"
                name="zipCode"
                placeholder="12345"
                value={form.address.zipCode}
                onChange={handleChange}
                maxLength={5}
              />
            </div>
            <div className="form-group">
              <label>시 / 도</label>
              <input
                type="text"
                name="city"
                placeholder="서울특별시"
                value={form.address.city}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>도로명 주소</label>
            <input
              type="text"
              name="street"
              placeholder="강남대로 123"
              value={form.address.street}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>상세 주소</label>
            <input
              type="text"
              name="detail"
              placeholder="101동 202호"
              value={form.address.detail}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? '처리 중...' : '회원가입'}
          </button>
        </form>

        <p className="back-link">
          <button onClick={() => navigate('/')}>← 메인으로 돌아가기</button>
        </p>
      </div>
    </div>
  )
}
