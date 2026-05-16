import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../services/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { saveAs } from 'file-saver';

export default function ExamStatistics() {
  const { examId } = useParams();
  const [overview, setOverview] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [questionStats, setQuestionStats] = useState([]);
  const [skillData, setSkillData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [examId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, distRes, quesRes, skillRes] = await Promise.all([
        axios.get(`/teacher/exams/${examId}/statistics/overview`),
        axios.get(`/teacher/exams/${examId}/statistics/distribution`),
        axios.get(`/teacher/exams/${examId}/statistics/questions`),
        axios.get(`/teacher/exams/${examId}/statistics/skill`),
      ]);
      setOverview(overviewRes.data);
      // Chuyển object distribution thành array cho biểu đồ
      const distArray = Object.entries(distRes.data).map(([range, count]) => ({ range, count }));
      setDistribution(distArray);
      setQuestionStats(quesRes.data);
      setSkillData(skillRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    window.open(`/api/teacher/exams/${examId}/export-pdf`, '_blank');
  };

  const exportExcel = async () => {
    window.open(`/api/teacher/exams/${examId}/export-excel`, '_blank');
  };

  if (loading) return <div className="p-6">Đang tải thống kê...</div>;

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Thống kê kỳ thi</h2>
        <div className="space-x-2">
          <button onClick={exportPDF} className="bg-red-600 text-white px-4 py-2 rounded">Xuất PDF</button>
          <button onClick={exportExcel} className="bg-green-600 text-white px-4 py-2 rounded">Xuất Excel</button>
        </div>
      </div>

      {/* Tổng quan */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded shadow"><div className="text-gray-500">Số sinh viên</div><div className="text-2xl font-bold">{overview.total_students}</div></div>
          <div className="bg-white p-4 rounded shadow"><div className="text-gray-500">Điểm TB</div><div className="text-2xl font-bold">{overview.avg_score}</div></div>
          <div className="bg-white p-4 rounded shadow"><div className="text-gray-500">Tỉ lệ đậu</div><div className="text-2xl font-bold">{overview.pass_rate}%</div></div>
          <div className="bg-white p-4 rounded shadow"><div className="text-gray-500">Điểm cao nhất</div><div className="text-2xl font-bold">{overview.max_score}</div></div>
          <div className="bg-white p-4 rounded shadow"><div className="text-gray-500">Điểm thấp nhất</div><div className="text-2xl font-bold">{overview.min_score}</div></div>
        </div>
      )}

      {/* Biểu đồ phổ điểm */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Phổ điểm</h3>
        <BarChart width={600} height={300} data={distribution}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="range" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#d97706" />
        </BarChart>
      </div>

      {/* Biểu đồ năng lực theo chủ đề (Radar) */}
      {skillData.length > 0 && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-xl font-semibold mb-2">Năng lực theo chủ đề</h3>
          <RadarChart outerRadius={150} width={500} height={300} data={skillData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="topic" />
            <PolarRadiusAxis angle={30} domain={[0, 10]} />
            <Radar name="Điểm" dataKey="score" stroke="#d97706" fill="#d97706" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        </div>
      )}

      {/* Bảng thống kê câu hỏi */}
      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        <h3 className="text-xl font-semibold mb-2">Chi tiết câu hỏi</h3>
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Câu hỏi</th>
              <th className="border p-2">Tỉ lệ đúng (%)</th>
              <th className="border p-2">Đúng</th>
              <th className="border p-2">Sai</th>
              <th className="border p-2">Chưa trả lời</th>
            </tr>
          </thead>
          <tbody>
            {questionStats.map(q => (
              <tr key={q.question_id}>
                <td className="border p-2" dangerouslySetInnerHTML={{ __html: q.content }} />
                <td className="border p-2 text-center">{q.correct_rate}%</td>
                <td className="border p-2 text-center">{q.correct_count}</td>
                <td className="border p-2 text-center">{q.wrong_count}</td>
                <td className="border p-2 text-center">{q.not_answered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}