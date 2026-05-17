import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import api from '../../services/axios'

export default function ExamRoom() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const [examData, setExamData] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    fetchExamData()
    attachAntiCheat()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      detachAntiCheat()
    }
  }, [])

  const fetchExamData = async () => {
    try {
      const res = await api.get(`/student/exams/attempts/${attemptId}`)
      const data = res.data
      setExamData(data.exam)
      setQuestions(data.questions)
      const initialAnswers = {}
      data.questions.forEach(q => { if (q.saved_answer) initialAnswers[q.id] = q.saved_answer })
      setAnswers(initialAnswers)
      setTimeLeft(data.exam.remaining_seconds)
      startTimer(data.exam.remaining_seconds)
    } catch (err) {
      alert('Không thể tải bài thi')
      navigate('/student/home')
    }
  }

  const startTimer = (seconds) => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    api.post(`/student/exams/attempts/${attemptId}/save-answer`, {
      question_id: questionId,
      answer_text: value
    }).catch(err => console.error('Auto-save failed'))
  }

  const handleSubmit = async (auto = false) => {
    if (submitting) return
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      const res = await api.post(`/student/exams/attempts/${attemptId}/submit`)
      alert(`Nộp bài thành công! Điểm: ${res.data.score}`)
      navigate(`/student/exam-result/${attemptId}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi nộp bài')
      setSubmitting(false)
    }
  }

  const attachAntiCheat = () => {
    const prevent = (e) => { e.preventDefault(); logViolation('copy_paste') }
    document.addEventListener('contextmenu', prevent)
    document.addEventListener('copy', prevent)
    document.addEventListener('paste', prevent)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault(); logViolation('devtools')
      }
    })
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) logViolation('tab_switch')
    })
    window.__handlers = { prevent }
  }

  const detachAntiCheat = () => {
    if (window.__handlers) {
      document.removeEventListener('contextmenu', window.__handlers.prevent)
      document.removeEventListener('copy', window.__handlers.prevent)
      document.removeEventListener('paste', window.__handlers.prevent)
    }
  }

  const logViolation = async (type) => {
    await api.post(`/student/exams/attempts/${attemptId}/log-violation`, { type })
  }

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' + s : s}`
  }

  if (!examData) return <div className="p-6 text-center">Đang tải bài thi...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-4 mb-6 flex justify-between items-center border">
          <h2 className="text-xl font-bold text-gray-800">{examData.title}</h2>
          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full">
            <ClockIcon className="h-5 w-5 text-red-500" />
            <span className="font-mono text-lg font-bold text-red-600">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="card p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                  {idx + 1}
                </span>
                <div className="flex-1" dangerouslySetInnerHTML={{ __html: q.content }} />
              </div>
              {q.type === 'single' && q.choices && (
                <div className="space-y-2 mt-3">
                  {q.choices.map(choice => (
                    <label key={choice.key} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 cursor-pointer transition">
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        value={choice.key}
                        checked={answers[q.id] === choice.key}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="h-4 w-4 text-primary-600"
                      />
                      <span className="text-gray-700"><span className="font-medium">{choice.key}.</span> {choice.text}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === 'multiple' && q.choices && (
                <div className="space-y-2 mt-3">
                  {q.choices.map(choice => {
                    const selected = answers[q.id] ? answers[q.id].split(',') : []
                    return (
                      <label key={choice.key} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          value={choice.key}
                          checked={selected.includes(choice.key)}
                          onChange={(e) => {
                            let newVal = [...selected]
                            if (e.target.checked) newVal.push(choice.key)
                            else newVal = newVal.filter(k => k !== choice.key)
                            handleAnswerChange(q.id, newVal.join(','))
                          }}
                          className="h-4 w-4 text-primary-600 rounded"
                        />
                        <span className="text-gray-700"><span className="font-medium">{choice.key}.</span> {choice.text}</span>
                      </label>
                    )
                  })}
                </div>
              )}
              {q.type === 'fill_blank' && (
                <input
                  type="text"
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="input mt-3"
                  placeholder="Nhập câu trả lời..."
                />
              )}
            </div>
          ))}
          <button
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="btn-primary w-full py-3 text-lg flex justify-center gap-2"
          >
            {submitting ? 'Đang nộp...' : 'Nộp bài thi'}
          </button>
        </div>
      </div>
    </div>
  )
}