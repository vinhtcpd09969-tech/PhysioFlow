import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Phone, Loader2, Info } from 'lucide-react';
import { getPublicServices, getPublicPackages } from '../../../api/client.api';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  danh_muc_id: string;
  ten_dich_vu: string;
  mo_ta_ngan: string;
  mo_ta_chi_tiet: string;
  thoi_luong_phut: number;
  don_gia: number | string;
  hinh_anh_url: string;
  loai_dich_vu: string;
  loai_dich_vu_ho_tro: string[] | string;
}

interface Package {
  id: string;
  ten_goi: string;
  ma_goi: string;
  mo_ta: string;
  tong_so_buoi: number;
  gia_tien: number | string;
  gia_goc?: number | string;
  han_dung_thang: number;
  chi_tiet_dich_vu: any;
  danh_muc_id?: string | number;
  ten_danh_muc?: string;
}

interface GroupedPackage {
  baseName: string;
  mo_ta: string;
  danh_muc_id?: string | number;
  levels: {
    [levelName: string]: Package;
  };
}

interface RichPackageMetadata {
  specialty: string;
  title: string;
  description: string;
  heroImage: string;
  statText: string;
  symptoms: {
    title: string;
    desc: string;
    icon: string;
  }[];
  causes: {
    title: string;
    desc: string;
  }[];
  therapies: {
    title: string;
    desc: string;
    image: string;
  }[];
}

const PACKAGE_METADATA_MAPPING: { [key: string]: RichPackageMetadata } = {
  'co-vai-gay': {
    specialty: 'Chuyên khoa Cột sống cổ',
    title: 'Phục hồi Cột sống cổ & Vai Gáy',
    description: 'Liệu trình phục hồi cột sống cổ chuyên sâu, giúp giải tỏa co thắt các bó cơ thang, cơ nâng vai, cơ ức đòn chũm và khôi phục biên độ vận động tự nhiên cho vùng cổ vai gáy.',
    heroImage: '/images/packages/cervical_spine_hero.png',
    statText: 'Phục hồi 95% biên độ cổ',
    symptoms: [
      {
        title: 'Đau nhức cơ học',
        desc: 'Cảm giác đau mỏi ê ẩm vùng cổ vai gáy và vùng lưng trên, tăng khi ngồi lâu gõ máy tính.',
        icon: '⚡'
      },
      {
        title: 'Co cứng khớp cổ',
        desc: 'Khó khăn khi xoay, nghiêng cổ hoặc ngửa cổ, đặc biệt là căng cứng vùng cơ nâng vai vào buổi sáng.',
        icon: '⚠️'
      },
      {
        title: 'Tê mỏi tỏa lan',
        desc: 'Đau nhức lan từ vai xuống cánh tay, ngón tay hoặc đi kèm những cơn đau đầu do chèn ép mạch máu.',
        icon: '🌊'
      }
    ],
    causes: [
      {
        title: 'Cúi đầu làm việc sai tư thế',
        desc: 'Rướn đầu về phía trước (Cổ rùa) hoặc cúi nhìn điện thoại quá thấp tạo tải trọng cơ học gấp 3 lần bình thường.'
      },
      {
        title: 'Bó cứng điểm bám cơ',
        desc: 'Sự co rút liên tục của cơ thang và cơ nâng vai do không có thời gian nghỉ, hình thành các Trigger Points.'
      },
      {
        title: 'Suy giảm cấp máu ngoại vi',
        desc: 'Ngồi tĩnh quá lâu làm giảm lưu thông máu mang oxy và dinh dưỡng nuôi cơ vùng vai gáy.'
      }
    ],
    therapies: [
      {
        title: 'Kéo giãn cột sống cổ bằng tay',
        desc: 'Kỹ thuật di động nhẹ nhàng dọc trục khớp cổ giúp giải phóng cơ nâng vai và đĩa đệm.',
        image: '/images/packages/therapy_manual.png'
      },
      {
        title: 'Điện xung y khoa giảm đau',
        desc: 'Sử dụng dòng điện xung TENS cắt dẫn truyền cảm giác đau nhức tức thời, kích thích tiết Endorphin.',
        image: '/images/packages/therapy_electrical.png'
      },
      {
        title: 'Bài tập giãn cơ chủ động',
        desc: 'Các bài tập chuyên biệt điều chỉnh tư thế cổ rùa, phục hồi cân bằng cơ nâng vai khớp cổ.',
        image: '/images/packages/therapy_stretch.png'
      }
    ]
  },
  'that-lung': {
    specialty: 'Chuyên khoa Cột sống thắt lưng',
    title: 'Phục hồi Cột sống thắt lưng',
    description: 'Giải pháp giải áp cột sống thắt lưng y khoa, làm mềm dải cơ dựng gai lưng và cơ vuông thắt lưng, ngăn ngừa đau thắt lưng mãn tính và thoát vị đĩa đệm.',
    heroImage: '/images/packages/back_pain_hero.png',
    statText: 'Giải áp 88% áp lực cột sống',
    symptoms: [
      {
        title: 'Đau buốt lưng dưới',
        desc: 'Đau mỏi thắt lưng đột ngột hoặc âm ỉ, nặng hơn khi cúi gập người hoặc nâng đỡ vật nặng.',
        icon: '⚡'
      },
      {
        title: 'Tê bì xuống chân',
        desc: 'Cảm giác tê rần hoặc yếu cơ đùi, bắp chân do rễ dây thần kinh thắt lưng bị chèn ép.',
        icon: '⚠️'
      },
      {
        title: 'Co cứng dải cơ hông',
        desc: 'Căng thắt cơ dựng gai lưng và cơ hông chậu, làm hạn chế xoay vặn người.',
        icon: '🌊'
      }
    ],
    causes: [
      {
        title: 'Tư thế ngồi làm việc thụ động',
        desc: 'Ngồi ghế không tựa lưng, ngả người quá nhiều làm mất đường cong sinh lý tự nhiên của cột sống thắt lưng.'
      },
      {
        title: 'Áp lực đĩa đệm liên tục',
        desc: 'Ngồi tĩnh quá lâu làm đĩa đệm thắt lưng bị chèn ép liên tục, giảm hấp thụ dinh dưỡng dẫn đến thoái hóa sớm.'
      },
      {
        title: 'Mất cân bằng cơ cốt lõi',
        desc: 'Các cơ bụng và cơ lưng yếu không đủ nâng đỡ cột sống, khiến áp lực cơ học dồn trực tiếp vào các đốt sống.'
      }
    ],
    therapies: [
      {
        title: 'Kỹ thuật di động cột sống thắt lưng',
        desc: 'Kỹ thuật di động cột sống và giải cơ sâu giúp giảm áp lực đĩa đệm và phục hồi tầm vận động.',
        image: '/images/packages/therapy_manual.png'
      },
      {
        title: 'Điện xung trị liệu giảm đau',
        desc: 'Kích thích dòng điện xung giúp ức chế dẫn truyền cảm giác đau, giảm co thắt cơ lưng tức thì.',
        image: '/images/packages/therapy_electrical.png'
      },
      {
        title: 'Bài tập giãn cơ vùng lưng',
        desc: 'Các bài tập kéo giãn cơ đùi sau, cơ hông và cơ lưng giúp giải tỏa áp lực và duy trì tư thế thẳng.',
        image: '/images/packages/therapy_stretch.png'
      }
    ]
  },
  'chinh-tu-the': {
    specialty: 'Chỉnh hình & Tư thế học',
    title: 'Chỉnh tư thế dân văn phòng',
    description: 'Tái lập cân bằng hệ cơ xương khớp toàn thân, nắn chỉnh các sai lệch tư thế cơ học phổ biến như gù lưng, cổ rùa, lệch vai, lệch chậu do ngồi sai tư thế nhiều năm.',
    heroImage: '/images/packages/posture_hero.png',
    statText: 'Cân chỉnh trục cơ thể 100%',
    symptoms: [
      {
        title: 'Tư thế cổ nhô trước',
        desc: 'Phần đầu bị rướn ra trước quá mức so với trục vai (hội chứng cổ rùa), cơ cổ phía sau căng cứng liên tục.',
        icon: '⚡'
      },
      {
        title: 'Gù lưng trên',
        desc: 'Đốt sống ngực nhô cong ra sau làm hai bả vai khum lại, co rút nhóm cơ ngực lớn gây mỏi mệt.',
        icon: '⚠️'
      },
      {
        title: 'Lệch xương chậu & vai',
        desc: 'Một bên vai cao bên vai thấp, chậu bị nghiêng trước hoặc xoay lệch gây mất thăng bằng khi đi đứng.',
        icon: '🌊'
      }
    ],
    causes: [
      {
        title: 'Tư thế ngồi máy tính sai lệch',
        desc: 'Tựa tay quá cao, cúi nhìn màn hình quá thấp, vắt chéo chân liên tục làm biến dạng cấu trúc xương chậu và vai.'
      },
      {
        title: 'Mất cân bằng cơ chéo',
        desc: 'Một bên cơ bị co thắt quá mức trong khi bên cơ đối diện bị kéo giãn và suy yếu không thể giữ trục thẳng.'
      },
      {
        title: 'Cứng khớp đốt sống ngực',
        desc: 'Ít vận động vặn xoay lưng làm các diện khớp đốt sống ngực bị đông cứng, hạn chế khả năng vươn thẳng người.'
      }
    ],
    therapies: [
      {
        title: 'Nắn chỉnh cơ sinh học khớp',
        desc: 'Tác động kéo nắn chỉnh xương chậu, bả vai và đốt sống ngực đưa về trục sinh lý cân bằng.',
        image: '/images/packages/therapy_manual.png'
      },
      {
        title: 'Giải cơ sâu Myofascial Release',
        desc: 'Giải phóng màng cân cơ bị xoắn rút gây méo lệch tư thế bằng kỹ thuật dùng tay chuyên sâu.',
        image: '/images/packages/therapy_electrical.png'
      },
      {
        title: 'Bài tập sửa tư thế Schroth',
        desc: 'Bài tập chuyên sâu định hình tư thế ba chiều giúp ghi nhớ tư thế thẳng đúng cho não bộ.',
        image: '/images/packages/therapy_stretch.png'
      }
    ]
  },
  'vai-lung-tren': {
    specialty: 'Chuyên khoa Khớp vai & Lưng ngực',
    title: 'Giảm đau vai & Lưng trên',
    description: 'Đặc trị các cơn đau mỏi vùng cơ bả vai, đông cứng khớp vai và căng thắt cơ lưng trên, khôi phục tầm vận động của tay và khớp vai.',
    heroImage: '/images/packages/shoulder_back_hero.png',
    statText: 'Giải tỏa bó cơ vai 90%',
    symptoms: [
      {
        title: 'Đau bả vai sâu',
        desc: 'Cơn đau nhức nhối xuất hiện sâu bên trong bả vai, lan lên gáy hoặc lan ra vùng lưng ngực trên.',
        icon: '⚡'
      },
      {
        title: 'Hạn chế xoay khớp vai',
        desc: 'Khó khăn khi thực hiện các động tác giơ tay cao, vươn tay ra sau lưng hoặc xoay vai bưng bê vật nặng.',
        icon: '⚠️'
      },
      {
        title: 'Căng nghẹt cơ trám',
        desc: 'Nhóm cơ giữa hai bả vai bị căng nghẹt cứng, cảm giác khó chịu liên tục kể cả khi đang nghỉ ngơi.',
        icon: '🌊'
      }
    ],
    causes: [
      {
        title: 'Di chuột và gõ phím liên tục',
        desc: 'Duy trì tư thế nhấc vai nâng tay để gõ bàn phím và di chuột nhiều giờ làm cơ thang trên bị co thắt liên tục.'
      },
      {
        title: 'Viêm dính bao khớp vai vi mô',
        desc: 'Sự thiếu vận động khớp vai toàn diện làm các bao khớp bị xơ dính, giảm khả năng tiết dịch bôi trơn khớp.'
      },
      {
        title: 'Sai lệch khớp bả vai lồng ngực',
        desc: 'Xương bả vai bị trượt ra ngoài vị trí chuẩn do cơ răng trước bị suy yếu không thể neo giữ.'
      }
    ],
    therapies: [
      {
        title: 'Di động khớp vai cơ học',
        desc: 'Kỹ thuật kéo giãn di động bao khớp vai thụ động giúp phá vỡ tổ chức viêm dính quanh khớp.',
        image: '/images/packages/therapy_manual.png'
      },
      {
        title: 'Sóng siêu âm trị liệu giảm đau',
        desc: 'Sóng siêu âm làm tăng tuần hoàn nuôi dưỡng mô sâu và tăng tiết dịch ổ khớp vai lồng ngực.',
        image: '/images/packages/therapy_electrical.png'
      },
      {
        title: 'Tập phục hồi khớp vai',
        desc: 'Bài tập tăng sức mạnh nhóm cơ chóp xoay vai giúp củng cố tính vững vàng của khớp vai.',
        image: '/images/packages/therapy_stretch.png'
      }
    ]
  }
};

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [services, setServices] = useState<Service[]>([]);
  const [groupedPackage, setGroupedPackage] = useState<GroupedPackage | null>(null);

  // Sync data on page load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resSvcs, resPkgs] = await Promise.all([
          getPublicServices(),
          getPublicPackages()
        ]);
        
        const fetchedServices = resSvcs.data || [];
        const fetchedPackages = resPkgs.data || [];
        setServices(fetchedServices);

        // Find package group based on id (slug or database id)
        // Helper to extract base name and level
        const getBaseNameAndLevel = (name: string) => {
          const upperName = name.toUpperCase();
          let level = 'BASIC';
          let baseName = name;
          
          if (upperName.includes(' - BASIC')) {
            level = 'BASIC';
            baseName = name.substring(0, upperName.indexOf(' - BASIC'));
          } else if (upperName.includes(' - STANDARD')) {
            level = 'STANDARD';
            baseName = name.substring(0, upperName.indexOf(' - STANDARD'));
          } else if (upperName.includes(' - INTENSIVE')) {
            level = 'INTENSIVE';
            baseName = name.substring(0, upperName.indexOf(' - INTENSIVE'));
          } else {
            const parts = name.split(' - ');
            if (parts.length > 1) {
              level = parts[parts.length - 1].toUpperCase();
              baseName = parts.slice(0, -1).join(' - ');
            }
          }
          return { baseName, level };
        };

        // Group packages
        const grouped: { [key: string]: GroupedPackage } = {};
        fetchedPackages.forEach((pkg: Package) => {
          const { baseName, level } = getBaseNameAndLevel(pkg.ten_goi);
          if (!grouped[baseName]) {
            grouped[baseName] = {
              baseName,
              mo_ta: pkg.mo_ta,
              danh_muc_id: pkg.danh_muc_id,
              levels: {}
            };
          }
          grouped[baseName].levels[level] = pkg;
        });

        // Match the requested package
        let matchedGroup: GroupedPackage | null = null;
        const targetId = id || '';
        
        // Match by slug mapping
        if (targetId === 'co-vai-gay' || targetId === 'cervical-spine') {
          // Look for neck packages
          const foundKey = Object.keys(grouped).find(k => (k.toLowerCase().includes('cổ') || k.toLowerCase().includes('cervical') || k.toLowerCase().includes('gáy')) && !k.toLowerCase().includes('cổ tay') && !k.toLowerCase().includes('lưng trên'));
          if (foundKey) matchedGroup = grouped[foundKey];
        } else if (targetId === 'that-lung' || targetId === 'lumbar') {
          // Look for back/lumbar packages
          const foundKey = Object.keys(grouped).find(k => k.toLowerCase().includes('thắt lưng') || (k.toLowerCase().includes('lưng') && !k.toLowerCase().includes('lưng trên')));
          if (foundKey) matchedGroup = grouped[foundKey];
        } else if (targetId === 'vai-lung-tren') {
          // Look for shoulder/upper back packages
          const foundKey = Object.keys(grouped).find(k => k.toLowerCase().includes('vai và lưng trên') || k.toLowerCase().includes('khớp vai'));
          if (foundKey) matchedGroup = grouped[foundKey];
        } else if (targetId === 'chinh-tu-the') {
          // Look for posture packages
          const foundKey = Object.keys(grouped).find(k => k.toLowerCase().includes('tư thế') || k.toLowerCase().includes('chỉnh dáng'));
          if (foundKey) matchedGroup = grouped[foundKey];
        }

        // If not matched by slug, search directly by package base name or package ID
        if (!matchedGroup) {
          const foundKey = Object.keys(grouped).find(k => {
            const hasPkgId = Object.values(grouped[k].levels).some(p => p.id === targetId || p.ma_goi === targetId);
            
            // Clean slug matching
            const cleanKeySlug = k
              .toLowerCase()
              .replace(/[^a-z0-9\sđáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]/g, '')
              .trim()
              .replace(/\s+/g, '-');

            return hasPkgId || cleanKeySlug === targetId || k.toLowerCase().replace(/\s+/g, '-') === targetId;
          });
          if (foundKey) {
            matchedGroup = grouped[foundKey];
          } else {
            // fallback: grab first package group
            const firstKey = Object.keys(grouped)[0];
            if (firstKey) matchedGroup = grouped[firstKey];
          }
        }

        if (matchedGroup) {
          setGroupedPackage(matchedGroup);
        } else {
          toast.error('Không tìm thấy phác đồ điều trị này.');
          navigate('/services');
        }

      } catch (error) {
        console.error('Error fetching package details:', error);
        toast.error('Lỗi khi tải thông tin gói.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // Determine rich metadata based on slug or name
  const getRichMetadata = (baseName: string): RichPackageMetadata => {
    const nameLower = baseName.toLowerCase();
    
    if (nameLower.includes('đốt sống cổ') || (nameLower.includes('cổ') && !nameLower.includes('cổ tay') && !nameLower.includes('vai và lưng trên')) || id === 'co-vai-gay') {
      return PACKAGE_METADATA_MAPPING['co-vai-gay'];
    }
    if (nameLower.includes('vai và lưng trên') || nameLower.includes('khớp vai') || id === 'vai-lung-tren') {
      return PACKAGE_METADATA_MAPPING['vai-lung-tren'];
    }
    if (nameLower.includes('thắt lưng') || (nameLower.includes('lưng') && !nameLower.includes('lưng trên')) || id === 'that-lung') {
      return PACKAGE_METADATA_MAPPING['that-lung'];
    }
    if (nameLower.includes('tư thế') || nameLower.includes('chỉnh dáng') || id === 'chinh-tu-the') {
      return PACKAGE_METADATA_MAPPING['chinh-tu-the'];
    }
    
    // Fallback template
    return {
      specialty: 'Chuyên khoa Phục hồi',
      title: baseName,
      description: groupedPackage?.mo_ta || 'Phác đồ phục hồi chức năng cơ xương khớp chuyên sâu, kết hợp công nghệ cao và kỹ thuật y khoa hiện đại.',
      heroImage: '/images/packages/wellness_hero.png',
      statText: 'Đạt chuẩn y khoa quốc tế',
      symptoms: [
        {
          title: 'Đau mỏi cơ khớp',
          desc: 'Cảm giác đau mỏi, căng cứng khó chịu tại vùng cơ bị tổn thương khi duy trì tư thế.',
          icon: '⚡'
        },
        {
          title: 'Hạn chế tầm vận động',
          desc: 'Khó khăn trong các động tác xoay, cúi, gập hoặc vươn người trong sinh hoạt.',
          icon: '⚠️'
        },
        {
          title: 'Giảm năng suất',
          desc: 'Cơn đau gây mất tập trung, mệt mỏi và suy giảm hiệu quả làm việc hàng ngày.',
          icon: '🌊'
        }
      ],
      causes: [
        {
          title: 'Sai tư thế làm việc',
          desc: 'Ngồi làm việc sai tư thế, cúi đầu quá thấp hoặc khom lưng kéo dài tạo áp lực cơ học lớn.'
        },
        {
          title: 'Thiếu vận động định kỳ',
          desc: 'Ngồi tĩnh một chỗ quá lâu, ít vận động khiến cơ khớp bị xơ cứng và suy giảm tuần hoàn.'
        },
        {
          title: 'Căng thẳng cơ bắp tích tụ',
          desc: 'Áp lực cuộc sống và làm việc tạo áp lực cơ học làm co rút cơ, giảm cấp máu nuôi dưỡng.'
        }
      ],
      therapies: [
        {
          title: 'Trị liệu bằng tay (Manual)',
          desc: 'Kỹ thuật xoa bóp mô sâu, di động khớp giúp giải phóng co thắt cơ và khớp bị kẹt.',
          image: '/images/packages/therapy_manual.png'
        },
        {
          title: 'Vật lý trị liệu máy',
          desc: 'Sử dụng sóng âm, điện xung, xung kích để kích thích phục hồi tế bào sâu.',
          image: '/images/packages/therapy_electrical.png'
        },
        {
          title: 'Tập phục hồi chức năng',
          desc: 'Các bài tập tăng sức mạnh cơ lõi và kéo giãn để khôi phục cân bằng cơ thể lâu dài.',
          image: '/images/packages/therapy_stretch.png'
        }
      ]
    };
  };

  const meta = groupedPackage ? getRichMetadata(groupedPackage.baseName) : null;

  const [showStickyCTA, setShowStickyCTA] = useState(false);

  // Set Document Title for SEO
  useEffect(() => {
    if (meta) {
      document.title = `${meta.title} - Chi tiết phác đồ phục hồi | RehabFlow`;
    }
  }, [meta]);

  // Scroll listener for sticky CTA
  useEffect(() => {
    const handleScroll = () => {
      const isPastThreshold = window.scrollY > 450;
      
      // Hide sticky CTA when reaching the footer to avoid overlapping
      const footer = document.querySelector('footer');
      let isFooterVisible = false;
      
      if (footer) {
        const rect = footer.getBoundingClientRect();
        // If the top of the footer has entered the viewport
        isFooterVisible = rect.top < window.innerHeight;
      } else {
        // Fallback calculation using scroll height
        isFooterVisible = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 320;
      }

      if (isPastThreshold && !isFooterVisible) {
        setShowStickyCTA(true);
      } else {
        setShowStickyCTA(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll-reveal Intersection Observer
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active-reveal');
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [loading, groupedPackage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pt-24">
        <Loader2 className="animate-spin w-10 h-10 text-primary mb-3" />
        <p className="font-bold text-slate-400 text-sm">Đang tải phác đồ chi tiết...</p>
      </div>
    );
  }

  if (!groupedPackage || !meta) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pt-24 text-center px-4">
        <div className="size-16 rounded-2xl bg-teal-50 flex items-center justify-center text-[#2EC4B6] border border-teal-100 mb-4">
          <Info size={30} />
        </div>
        <h2 className="text-[#0B1222] font-bold text-lg">Không tìm thấy phác đồ chi tiết</h2>
        <p className="text-slate-400 text-xs mt-1 max-w-sm">Liên kết không tồn tại hoặc đã bị gỡ bỏ.</p>
        <Link to="/services" className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-[#25A89C]">
          Quay lại danh mục
        </Link>
      </div>
    );
  }

  const availableLevels = Object.keys(groupedPackage.levels).sort((a, b) => {
    const order = ['BASIC', 'STANDARD', 'INTENSIVE'];
    return order.indexOf(a) - order.indexOf(b);
  });

  const getPackageServicesList = (pkg: Package) => {
    try {
      const detail = typeof pkg.chi_tiet_dich_vu === 'string' ? JSON.parse(pkg.chi_tiet_dich_vu) : pkg.chi_tiet_dich_vu;
      if (Array.isArray(detail)) {
        return detail.map((d: any) => {
          const svc = services.find(s => s.id.toString() === d.dich_vu_id.toString());
          return {
            name: svc ? svc.ten_dich_vu : 'Liệu pháp trị liệu y khoa',
            so_buoi: d.so_buoi || d.so_lan_toi_da_trong_goi,
            desc: svc ? svc.mo_ta_ngan : 'Trị liệu phục hồi chuyên sâu.'
          };
        });
      }
    } catch (e) {
      // ignore
    }
    return [];
  };

  const formatPrice = (price: number | string | undefined): string => {
    if (price === undefined || price === null) return '';
    const numPrice = typeof price === 'string' ? parseInt(price, 10) : price;
    if (isNaN(numPrice)) return price.toString();
    if (numPrice === 0) return 'Liên hệ';
    return numPrice.toLocaleString('vi-VN') + ' đ';
  };

  const handleBooking = () => {
    navigate('/booking');
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pt-28 pb-24 font-body relative overflow-hidden">
      {/* Scroll Reveal Styles */}
      <style>{`
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }
        .reveal-on-scroll.slide-left {
          transform: translateX(-50px) translateY(0);
        }
        .reveal-on-scroll.slide-right {
          transform: translateX(50px) translateY(0);
        }
        .reveal-on-scroll.scale-in {
          transform: scale(0.95) translateY(20px);
        }
        .reveal-on-scroll.active-reveal {
          opacity: 1;
          transform: translate(0) scale(1);
        }
        
        /* Custom stagger delays */
        .delay-100 { transition-delay: 100ms; }
        .delay-200 { transition-delay: 200ms; }
        .delay-300 { transition-delay: 300ms; }
      `}</style>

      {/* Visual background gradient */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-teal-50/20 via-transparent to-transparent pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Navigation Breadcrumb & Back Action */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <span>/</span>
            <Link to="/services" className="hover:text-primary transition-colors">Danh mục dịch vụ</Link>
            <span>/</span>
            <span className="text-primary font-extrabold">{meta.title}</span>
          </div>

          <Link
            to="/services"
            className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-500 hover:text-slate-800 tracking-wider transition-colors bg-white border border-slate-200/60 px-5 py-2.5 rounded-xl shadow-xs"
          >
            ← Danh mục phác đồ
          </Link>
        </div>

        {/* Section 1: Hero Banner */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_15px_50px_rgba(15,23,42,0.015)] p-6 md:p-12 lg:p-16 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap gap-2.5 items-center">
                <span className="bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-primary/20">
                  {meta.specialty}
                </span>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xs animate-pulse">
                  <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                  {meta.statText}
                </div>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-heading font-black text-secondary tracking-tight leading-tight uppercase">
                {meta.title}
              </h1>
              
              <p className="text-slate-500 text-sm md:text-base font-semibold leading-relaxed max-w-2xl">
                {meta.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => scrollToSection('rec-plans')}
                  className="bg-primary hover:bg-[#25A89C] text-white font-extrabold px-8 py-4 rounded-full text-xs uppercase tracking-widest transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 shadow-[0_10px_25px_-5px_rgba(46,196,182,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(46,196,182,0.5)] flex items-center gap-2 group"
                >
                  Khám phá lộ trình <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                
                <button
                  onClick={handleBooking}
                  className="bg-white border border-slate-200/80 hover:border-primary text-secondary hover:text-primary font-extrabold px-8 py-4 rounded-full text-xs uppercase tracking-widest transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 shadow-xs flex items-center gap-2"
                >
                  <Phone size={13} /> Đặt lịch khám ngay
                </button>
              </div>
            </div>

            {/* Hero Photo */}
            <div className="lg:col-span-5 relative">
              <div className="aspect-4/3 md:aspect-video lg:aspect-square rounded-[36px] overflow-hidden shadow-xl border border-white relative group">
                <img
                  src={meta.heroImage}
                  alt={meta.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 via-transparent to-transparent pointer-events-none"></div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Section 2: Dấu hiệu nhận biết */}
        <div className="mb-16 animate-fade-in">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-heading font-black text-secondary uppercase tracking-tight">
              Dấu hiệu nhận biết
            </h2>
            <p className="text-xs md:text-sm text-slate-400 font-semibold mt-2">
              Hãy theo dõi kỹ cơ thể để nhận diện các phản ứng cảnh báo nguy cơ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {meta.symptoms.map((sym, idx) => {
              const revealClass = idx === 0 
                ? 'reveal-on-scroll slide-left' 
                : idx === 2 
                  ? 'reveal-on-scroll slide-right delay-200' 
                  : 'reveal-on-scroll delay-100';

              return (
                <div
                  key={idx}
                  className={`bg-white rounded-[28px] p-8 border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.01)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.03)] hover:-translate-y-1 transition-all duration-300 group ${revealClass}`}
                >
                  <div className="size-12 bg-slate-50 border border-slate-100 group-hover:border-primary/25 rounded-2xl flex items-center justify-center text-xl mb-5 transition-colors group-hover:bg-primary/10 group-hover:text-primary duration-300">
                    {sym.icon}
                  </div>
                  <h3 className="font-heading font-extrabold text-secondary text-base leading-snug mb-3">
                    {sym.title}
                  </h3>
                  <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                    {sym.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Tại sau gặp tình trạng này */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_15px_50px_rgba(15,23,42,0.015)] p-6 md:p-12 lg:p-16 mb-16 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            
            {/* Left Side: Visual Illustration */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4 reveal-on-scroll slide-left">
              <div className="aspect-square bg-slate-50 border border-slate-100 rounded-[28px] overflow-hidden flex items-center justify-center p-3 relative group">
                <img 
                  src="/images/packages/back_pain_hero.png" 
                  alt="Spine anatomy" 
                  className="w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute top-3 left-3 bg-secondary/5 text-secondary text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                  Cấu trúc xương
                </div>
              </div>
              <div className="aspect-square bg-slate-50 border border-slate-100 rounded-[28px] overflow-hidden flex items-center justify-center p-3 relative group translate-y-6">
                <img 
                  src="/images/packages/cervical_spine_hero.png" 
                  alt="Posture strain" 
                  className="w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute top-3 left-3 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                  Áp lực tư thế
                </div>
              </div>
            </div>

            {/* Right Side: Cause list */}
            <div className="lg:col-span-7 space-y-6 reveal-on-scroll slide-right">
              <h2 className="text-2xl md:text-3xl font-heading font-black text-secondary uppercase tracking-tight mb-2">
                Tại sao bạn gặp tình trạng này?
              </h2>
              
              <div className="space-y-5">
                {meta.causes.map((cause, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-5 bg-slate-50/70 rounded-2xl border border-slate-100/50 hover:border-primary/25 transition-all">
                    <div className="size-9 rounded-full bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0 text-sm font-bold mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-heading font-extrabold text-secondary text-sm md:text-base leading-snug">
                        {cause.title}
                      </h3>
                      <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed mt-1.5">
                        {cause.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Section 4: Liệu pháp tại RehabFlow */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1.5 rounded-full">
              Phương pháp RehabFlow
            </span>
            <h2 className="text-2xl md:text-3xl font-heading font-black text-secondary uppercase tracking-tight mt-4">
              Liệu pháp chuyên sâu đi kèm
            </h2>
            <p className="text-xs md:text-sm text-slate-400 font-semibold mt-2">
              Không chỉ điều trị triệu chứng, chúng tôi tái tạo cơ sinh học cột sống bằng y học chứng cứ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {meta.therapies.map((ther, idx) => {
              const revealClass = idx === 0 
                ? 'reveal-on-scroll slide-left' 
                : idx === 2 
                  ? 'reveal-on-scroll slide-right delay-200' 
                  : 'reveal-on-scroll delay-100';

              return (
                <div
                  key={idx}
                  className={`bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-[0_12px_40px_rgba(15,23,42,0.01)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.03)] hover:-translate-y-1 transition-all duration-300 group ${revealClass}`}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={ther.image}
                      alt={ther.title}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/35 via-transparent to-transparent pointer-events-none"></div>
                  </div>
                  
                  <div className="p-8 space-y-4">
                    <h3 className="font-heading font-extrabold text-secondary text-base leading-snug">
                      {ther.title}
                    </h3>
                    <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                      {ther.desc}
                    </p>
                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[9px] bg-slate-100 text-slate-400 font-black uppercase tracking-wider px-2 py-0.5 rounded">
                        Liệu pháp chính
                      </span>
                      <span className="text-primary text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5">
                        Đạt chuẩn y khoa
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 5: Bảng chọn lộ trình */}
        <div id="rec-plans" className="bg-white rounded-[40px] border border-slate-100 shadow-[0_15px_50px_rgba(15,23,42,0.015)] p-6 md:p-12 lg:p-16 mb-16 relative overflow-hidden">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20">
                Lộ trình phục hồi
              </span>
              <h2 className="text-2xl md:text-3xl font-heading font-black text-secondary uppercase tracking-tight mt-4">
                Chọn Lộ Trình Phù Hợp Với Bạn
              </h2>
              <p className="text-xs md:text-sm text-slate-400 font-semibold mt-2">
                Lựa chọn liệu trình tương thích với tình trạng bệnh lý thực tế sau khi được chuyên gia khám
              </p>
            </div>

            {/* Plans Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-${availableLevels.length > 2 ? 3 : 2} gap-6 items-stretch`}>
              {availableLevels.map((lvl, idx) => {
                const pkg = groupedPackage.levels[lvl];
                const isIntensive = lvl === 'INTENSIVE';
                const servicesList = getPackageServicesList(pkg);

                const revealClass = idx === 0 
                  ? 'reveal-on-scroll slide-left' 
                  : idx === 2 
                    ? 'reveal-on-scroll slide-right delay-200' 
                    : 'reveal-on-scroll delay-100';

                return (
                  <div
                    key={lvl}
                    className={`rounded-[32px] p-6 md:p-8 flex flex-col justify-between relative transition-all duration-300 border ${revealClass} ${
                      isIntensive
                        ? 'bg-secondary text-white border-transparent shadow-[0_20px_50px_rgba(11,18,34,0.15)] ring-2 ring-primary/25 md:scale-[1.03]'
                        : 'bg-slate-50 text-slate-800 border-slate-100 shadow-xs hover:shadow-sm'
                    }`}
                  >
                    {/* Popular badge for Intensive */}
                    {isIntensive && (
                      <span className="absolute -top-3 right-6 bg-accent text-slate-950 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                        Đề xuất tốt nhất
                      </span>
                    )}

                    <div className="space-y-6">
                      {/* Header card */}
                      <div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          isIntensive 
                            ? 'bg-white/10 text-primary border border-primary/25' 
                            : 'bg-white border border-slate-200 text-slate-400'
                        }`}>
                          Lộ trình {lvl}
                        </span>
                        
                        <h3 className={`font-heading font-black text-lg md:text-xl uppercase tracking-tight mt-2 ${
                          isIntensive ? 'text-white' : 'text-secondary'
                        }`}>
                          {lvl === 'BASIC' ? 'Cơ bản' : lvl === 'STANDARD' ? 'Tiêu chuẩn' : 'Chuyên sâu'}
                        </h3>
                      </div>

                      {/* Price */}
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl md:text-3xl font-black">
                            {formatPrice(pkg.gia_tien)}
                          </span>
                          <span className={`text-xs ${isIntensive ? 'text-primary/75' : 'text-slate-400'}`}>
                            /{pkg.tong_so_buoi} buổi
                          </span>
                        </div>
                        {pkg.gia_goc && (
                          <span className={`text-xs line-through ${isIntensive ? 'text-white/40' : 'text-slate-400'}`}>
                            {formatPrice(pkg.gia_goc)}
                          </span>
                        )}
                      </div>

                      <p className={`text-xs leading-relaxed ${
                        isIntensive ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        {pkg.mo_ta}
                      </p>

                      <div className="w-full h-px bg-slate-200/50 dark:bg-white/10" />

                      {/* Service list included */}
                      <div className="space-y-4">
                        <p className={`text-[10px] font-black uppercase tracking-wider ${
                          isIntensive ? 'text-primary' : 'text-slate-400'
                        }`}>
                          Phác đồ gồm {servicesList.length} dịch vụ:
                        </p>
                        
                        <ul className="space-y-3">
                          {servicesList.map((svc, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-2.5">
                              <span className={`size-4 rounded-full flex items-center justify-center shrink-0 text-[10px] mt-0.5 ${
                                isIntensive ? 'bg-primary/20 text-primary' : 'bg-white border border-slate-200 text-slate-500'
                              }`}>
                                ✓
                              </span>
                              <div>
                                <p className="text-xs font-bold leading-none">{svc.name}</p>
                                <p className={`text-[9px] mt-0.5 leading-snug ${
                                  isIntensive ? 'text-slate-400' : 'text-slate-400'
                                }`}>
                                  {svc.desc}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Action btn */}
                    <button
                      onClick={handleBooking}
                      type="button"
                      className={`w-full text-center font-black py-4 rounded-2xl text-xs uppercase tracking-widest mt-8 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] active:scale-[0.96] ${
                        isIntensive
                          ? 'bg-white hover:bg-primary text-secondary hover:text-white shadow-lg shadow-black/10 hover:shadow-primary/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                      }`}
                    >
                      Đăng ký điều trị
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom package information notice */}
            <div className="mt-8 flex gap-3 p-4 bg-amber-50/50 border border-amber-200/30 rounded-2xl text-xs text-amber-800 font-semibold leading-relaxed">
              <span className="shrink-0 mt-0.5">ℹ</span>
              <p>
                * Lưu ý: Tần suất buổi tập chuẩn y khoa khuyến nghị là 2 - 3 buổi/tuần. Trước khi đăng ký thanh toán, quý khách sẽ được bác sĩ chuyên khoa thăm khám lâm sàng trực tiếp để chẩn đoán nguyên nhân và xây dựng phác đồ cá nhân hóa phù hợp nhất.
              </p>
            </div>
          </div>
        </div>

        {/* Section 6: CTA Banner at bottom */}
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-secondary to-[#151f32] rounded-[40px] px-8 md:px-16 py-12 text-center text-white relative overflow-hidden shadow-xl border border-white/5 reveal-on-scroll scale-in">
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h3 className="text-xl md:text-3xl lg:text-4xl font-heading font-black tracking-tight leading-tight uppercase">
              Sẵn sàng để quay lại cuộc sống không đau đớn?
            </h3>
            
            <p className="text-slate-300 text-xs md:text-sm font-semibold max-w-lg mx-auto">
              Đặt lịch hẹn ngay hôm nay để được bác sĩ chuyên gia tại TheraPath thăm khám và đưa ra phác đồ điều trị tối ưu nhất cho bạn.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={handleBooking}
                type="button"
                className="w-full sm:w-auto bg-primary hover:bg-[#25A89C] text-white font-extrabold px-8 py-4 rounded-full text-xs uppercase tracking-widest transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 shadow-md shadow-primary/25 hover:shadow-primary/35"
              >
                Đặt lịch tư vấn ngay
              </button>
              
              <a
                href="tel:19001234"
                className="w-full sm:w-auto flex items-center justify-center gap-2 border border-white/20 hover:bg-white/10 text-white font-extrabold px-8 py-4 rounded-full text-xs uppercase tracking-widest transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95"
              >
                <Phone size={13} /> Gọi 1900 1234
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Sticky CTA capsule that slides up when scrolling down */}
      <div className={`fixed bottom-6 left-6 right-6 z-40 transition-all duration-550 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${
        showStickyCTA ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
      }`}>
        <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-full px-6 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.12)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="size-2.5 bg-primary rounded-full animate-pulse shrink-0"></span>
            <div>
              <p className="text-xs font-black text-secondary uppercase tracking-wider">{meta.title}</p>
              <p className="text-[10px] text-slate-400 font-semibold">{meta.statText}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="tel:19001234" 
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] font-extrabold text-secondary bg-slate-100 hover:bg-slate-200/60 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 border border-slate-200/40 hover:border-slate-300 shadow-xs"
            >
              <Phone size={12} /> <span className="hidden md:inline">1900 1234</span>
            </a>
            <button
              onClick={handleBooking}
              className="bg-primary hover:bg-[#25A89C] text-white text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 shadow-md shadow-primary/20 flex items-center gap-1.5 group"
            >
              Đặt lịch khám ngay <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
