import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Award, Calendar } from 'lucide-react';
import { getPublicSpecialistById } from '../api/public.api';
import LoadingScreen from '../../../components/LoadingScreen';

interface Specialist {
  id: number;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  anh_dai_dien: string | null;
  vai_tro: string;
  so_nam_kinh_nghiem: number | null;
  bang_cap_chung_chi: string | null;
  mo_ta: string | null;
}

export default function SpecialistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCert, setActiveCert] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        if (id) {
          const response = await getPublicSpecialistById(id);
          setSpecialist(response.data);
        }
      } catch (err) {
        console.error('Lỗi khi lấy chi tiết chuyên gia:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!specialist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-jakarta bg-slate-50">
        <p className="text-slate-500 font-extrabold text-lg mb-4">Không tìm thấy chuyên gia y khoa.</p>
        <Link to="/specialists" className="bg-[#14B8A6] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider">
          Trở lại danh sách
        </Link>
      </div>
    );
  }

  const isDoctor = specialist.vai_tro.toLowerCase().includes('bác sĩ') || specialist.vai_tro.toLowerCase().includes('doctor');
  const certificates = specialist.bang_cap_chung_chi ? specialist.bang_cap_chung_chi.split(',').filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-28 font-jakarta">
      {/* HUD High-tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-60 z-0"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Back Link */}
        <Link
          to="/specialists"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-black uppercase tracking-wider mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại danh sách chuyên gia
        </Link>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Portrait & Credentials */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Portrait Card */}
            <div className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.015)]">
              <div className="aspect-[4/5] w-full rounded-[24px] overflow-hidden bg-slate-100 relative mb-6">
                <img
                  src={specialist.anh_dai_dien || '/images/default_avatar.png'}
                  alt={specialist.ho_ten}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border inline-block mb-2.5 ${
                    isDoctor
                      ? 'bg-[#14B8A6]/10 text-[#0D9488] border-teal-200'
                      : 'bg-[#FF9F1C]/10 text-[#D97706] border-amber-200'
                  }`}>
                    {specialist.vai_tro}
                  </span>
                  <h1 className="font-heading font-black text-2xl md:text-3xl text-slate-900 leading-tight">
                    {specialist.ho_ten}
                  </h1>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <Award size={18} className="text-[#14B8A6]" />
                  <span>{specialist.so_nam_kinh_nghiem || 5} năm kinh nghiệm lâm sàng</span>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 pt-2 text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-2.5">
                    <Mail size={15} className="text-slate-400" />
                    <span>{specialist.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone size={15} className="text-slate-400" />
                    <span>{specialist.so_dien_thoai || '090 123 4567'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Credentials / Certificates Images Grid */}
            {certificates.length > 0 && (
              <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.015)]">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5">
                  📋 Bằng Cấp & Chứng Chỉ Hành Nghề
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {certificates.map((certPath, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveCert(certPath)}
                      className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 hover:border-[#14B8A6] cursor-pointer group relative shadow-xs"
                    >
                      <img
                        src={certPath}
                        alt={`Bằng cấp chứng chỉ ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 flex items-center justify-center transition-all">
                        <span className="opacity-0 group-hover:opacity-100 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-[#0D9488] shadow-md transition-all">
                          🔍 Phóng to
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Bio details & CTA */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Bio & Details */}
            <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.015)]">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#14B8A6] mb-4">
                🔬 Hồ Sơ Chuyên Môn
              </h2>
              <p className="text-slate-700 text-sm md:text-base font-semibold leading-relaxed mb-6 whitespace-pre-line">
                {specialist.mo_ta || 'Thông tin chi tiết đang được cập nhật...'}
              </p>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
                  ⭐ Thế Mạnh Chuyên Sâu
                </h3>
                <div className="flex flex-wrap gap-2">
                  {isDoctor ? (
                    <>
                      <span className="bg-[#14B8A6]/5 text-[#0D9488] border border-[#14B8A6]/10 px-3.5 py-2 rounded-xl text-xs font-bold">
                        Chẩn đoán lâm sàng & Khám chuyên sâu
                      </span>
                      <span className="bg-[#14B8A6]/5 text-[#0D9488] border border-[#14B8A6]/10 px-3.5 py-2 rounded-xl text-xs font-bold">
                        Thiết lập phác đồ phục hồi cột sống cổ & lưng
                      </span>
                      <span className="bg-[#14B8A6]/5 text-[#0D9488] border border-[#14B8A6]/10 px-3.5 py-2 rounded-xl text-xs font-bold">
                        Đánh giá chức năng vận động khớp
                      </span>
                      <span className="bg-[#14B8A6]/5 text-[#0D9488] border border-[#14B8A6]/10 px-3.5 py-2 rounded-xl text-xs font-bold">
                        Phục hồi chức năng sau chấn thương
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="bg-[#14B8A6]/5 text-[#0D9488] border border-[#14B8A6]/10 px-3.5 py-2 rounded-xl text-xs font-bold">
                        Trị liệu bằng tay (Manual Therapy)
                      </span>
                      <span className="bg-[#14B8A6]/5 text-[#0D9488] border border-[#14B8A6]/10 px-3.5 py-2 rounded-xl text-xs font-bold">
                        Giải phóng cơ sâu (Myofascial Release)
                      </span>
                      <span className="bg-[#14B8A6]/5 text-[#0D9488] border border-[#14B8A6]/10 px-3.5 py-2 rounded-xl text-xs font-bold">
                        Kéo giãn cơ thụ động (Stretching)
                      </span>
                      <span className="bg-[#14B8A6]/5 text-[#0D9488] border border-[#14B8A6]/10 px-3.5 py-2 rounded-xl text-xs font-bold">
                        Trị liệu công nghệ cao (Laser/Siêu âm)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Booking Widget */}
            <div className="bg-gradient-to-br from-[#0D9488] to-[#14B8A6] rounded-[32px] p-8 text-white shadow-xl shadow-teal-500/10 hover:shadow-[0_20px_50px_rgba(20,184,166,0.25)] transition-all">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-teal-100 mb-1">
                    🗓️ Đặt Lịch Trực Tiếp
                  </p>
                  <h3 className="text-xl md:text-2xl font-black font-heading leading-tight">
                    Đặt Lịch Hẹn Ngay Với {specialist.ho_ten}
                  </h3>
                </div>
                <Calendar size={32} className="text-teal-200 shrink-0" />
              </div>
              
              <p className="text-teal-50 text-xs font-semibold leading-relaxed mb-6">
                Chọn bác sĩ/KTV trị liệu trực tiếp giúp tối ưu hóa phác đồ điều trị và đẩy nhanh tốc độ phục hồi cơ xương khớp của bạn.
              </p>

              <Link
                to="/booking"
                state={{ selectedDoctorId: specialist.id, isKtv: !isDoctor }}
                className="w-full bg-white hover:bg-slate-50 text-[#0D9488] text-center font-extrabold py-4 rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 block shadow-md shadow-slate-900/10 cursor-pointer active:scale-99"
              >
                Đặt Lịch Khám / Trị Liệu Ngay
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Certificate Modal */}
      {activeCert && (
        <div
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveCert(null)}
        >
          <div className="max-w-4xl max-h-[85vh] relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex items-center justify-center">
            <img
              src={activeCert}
              alt="Bằng cấp phóng to"
              className="max-w-full max-h-[80vh] object-contain"
            />
            <button
              onClick={() => setActiveCert(null)}
              className="absolute top-4 right-4 bg-slate-950/60 hover:bg-slate-950 text-white rounded-full p-2 border border-slate-800 hover:scale-105 transition-all text-xs font-black uppercase"
            >
              Đóng ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
