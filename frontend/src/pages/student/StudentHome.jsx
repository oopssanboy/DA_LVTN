import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaClock, FaBook, FaPlay } from 'react-icons/fa'
import axios from 'axios'

export default function StudentHome() {
  const [exams, setExams] = useState([])
  const [history, setHistory] = useState([])
  const navigate = useNavigate()
  const API = import.meta.env.VITE_API_URL

  useEffect(() => {
    axios.get(`${API}/student/exams`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => setExams(r.data))
    axios.get(`${API}/student/exams/history`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => setHistory(r.data))
  }, [])

  return (
    <div>
      <h4 className="fw-bold mb-4">Kỳ thi đang diễn ra</h4>
      <div className="row g-4">
        {exams.map(exam => (
          <div className="col-md-6 col-lg-4" key={exam.id}>
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
              <div className="card-body d-flex flex-column">
                <h5 className="card-title fw-bold">{exam.title}</h5>
                <div className="d-flex align-items-center gap-2 text-muted mb-1"><FaBook className="text-primary" /> {exam.subject}</div>
                <div className="d-flex align-items-center gap-2 text-muted mb-3"><FaClock className="text-warning" /> {exam.duration} phút</div>
                <button className="btn btn-primary mt-auto" onClick={() => navigate(`/student/exam/${exam.id}/do`)}>
                  <FaPlay className="me-2" /> Vào thi
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {history.length > 0 && (
        <>
          <h4 className="fw-bold mt-5 mb-4">Lịch sử làm bài</h4>
          <div className="table-responsive">
            <table className="table table-hover bg-white rounded-3 overflow-hidden shadow-sm">
              <thead className="table-light">
                <tr>
                  <th>Kỳ thi</th>
                  <th className="text-center">Điểm</th>
                  <th className="text-center">Số câu đúng</th>
                  <th className="text-end">Ngày thi</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td className="fw-medium">{h.exam_title}</td>
                    <td className="text-center fw-bold text-primary">{h.score}/10</td>
                    <td className="text-center">{h.correct_answers}/{h.total_questions}</td>
                    <td className="text-end text-muted small">{new Date(h.completed_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}