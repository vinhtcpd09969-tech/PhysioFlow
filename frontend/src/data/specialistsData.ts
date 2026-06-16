export interface SpecialistArticle {
  id: string;
  title: string;
  readTime: string;
  category: string;
  summary: string;
}

export interface SpecialistReview {
  name: string;
  rating: number;
  comment: string;
  disease: string;
}

export interface SpecialistEducation {
  degree: string;
  school: string;
  year: string;
}

export interface SpecialistSchedule {
  day: string;
  time: string;
}

export interface Specialist {
  id: string;
  name: string;
  role: string;
  rating: number;
  experience: number;
  status: 'available' | 'today' | 'busy';
  statusLabel: string;
  category: 'giam-dau' | 'phuc-hoi-van-dong' | 'y-hoc-the-thao';
  description: string;
  avatar: string;
  tags: string[]; // For homepage and list tags display
  
  // Detailed fields for SpecialistDetailPage
  biography: string;
  certifications: string[];
  diseases: string[];
  education: SpecialistEducation[];
  articles: SpecialistArticle[];
  reviews: SpecialistReview[];
  schedule: SpecialistSchedule[];
  price: number;
  duration: number;
}

export const MOCK_SPECIALISTS: Specialist[] = [
  {
    id: '1',
    name: 'BS. Nguyễn Văn A',
    role: 'Chuyên gia Phục hồi chức năng',
    rating: 5.0,
    experience: 10,
    status: 'available',
    statusLabel: 'Còn trống',
    category: 'phuc-hoi-van-dong',
    description: 'Chuyên sâu về các bài tập trị liệu cột sống và phục hồi sau chấn thương thể thao cho nhân viên và vận động viên.',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=350&h=350&q=80',
    tags: ['Vật lý trị liệu', 'Cơ xương khớp'],
    price: 500000,
    duration: 45,
    certifications: ['Thạc sĩ Y khoa', 'Chứng chỉ OMT toàn cầu'],
    diseases: ['Thoát vị đĩa đệm', 'Đau cổ vai gáy', 'Hội chứng ống cổ tay', 'Phục hồi sau phẫu thuật', 'Chấn thương thể thao'],
    biography: 'Bác sĩ Nguyễn Văn A là một trong những chuyên gia hàng đầu trong lĩnh vực phục hồi chức năng xương khớp tại Office Care. Với cách tiếp cận "Therapeutic Precision", ông không chỉ tập trung vào việc giảm đau tạm thời mà còn đi sâu vào việc điều chỉnh cơ chế vận động của cơ thể để ngăn ngừa tái phát. Ông tin rằng sự kết hợp giữa liệu pháp vận động chính xác và công nghệ hiện đại là chìa khóa để khôi phục chất lượng cuộc sống cho bệnh nhân.',
    education: [
      {
        degree: 'Thạc sĩ Y khoa',
        school: 'Đại học Y Dược TP.HCM',
        year: '2012 - 2018'
      },
      {
        degree: 'Chứng chỉ OMT (Orthopedic Manual Therapy)',
        school: 'Cấp bởi IOMT, Australia',
        year: '2020'
      }
    ],
    articles: [
      {
        id: 'a1',
        title: 'Tầm quan trọng của vận động chính xác trong điều trị đĩa đệm',
        readTime: '5 phút đọc',
        category: '#CộtSống',
        summary: 'Khám phá cách các bài tập vi mô có thể tái định vị cấu trúc cột sống mà không cần can thiệp ngoại khoa xâm lấn.'
      },
      {
        id: 'a2',
        title: 'Phục hồi chấn thương cổ tay cho dân văn phòng',
        readTime: '8 phút đọc',
        category: '#OfficeWellness',
        summary: 'Các phương pháp vật lý trị liệu tại chỗ dành riêng cho những người làm việc với máy tính cường độ cao.'
      }
    ],
    reviews: [
      {
        name: 'Trần Minh H.',
        rating: 5,
        disease: 'Điều trị Thoát vị đĩa đệm',
        comment: 'Tôi đã từng đi nhiều nơi nhưng chỉ đến khi gặp BS. A, tình trạng đau lưng của tôi mới thực sự cải thiện rõ rệt. Bác sĩ rất tận tâm và giải thích cặn kẽ từng bước trong liệu trình.'
      },
      {
        name: 'Lê Kim O.',
        rating: 5,
        disease: 'Đau cổ vai gáy',
        comment: 'Dịch vụ chuyên nghiệp, không gian thoáng đãng. Bác sĩ A thao tác cực kỳ chuẩn xác và nhẹ nhàng. Tôi không còn cảm thấy mỏi vai sau 3 buổi trị liệu.'
      }
    ],
    schedule: [
      { day: 'Thứ 2', time: '08:00 - 17:00' },
      { day: 'Thứ 3', time: '08:00 - 17:00' },
      { day: 'Thứ 4', time: 'Nghỉ' },
      { day: 'Thứ 5', time: '08:00 - 17:00' },
      { day: 'Thứ 6', time: '08:00 - 17:00' }
    ]
  },
  {
    id: '2',
    name: 'KTV. Lê Thị B',
    role: 'Điều trị Đau nhức văn phòng',
    rating: 4.9,
    experience: 5,
    status: 'available',
    statusLabel: 'Còn trống',
    category: 'giam-dau',
    description: 'Hỗ trợ điều trị chuyên sâu các vấn đề cổ vai gáy, đau nhức cơ xương khớp và hội chứng ống cổ tay cho người làm việc văn phòng.',
    avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=350&h=350&q=80',
    tags: ['Cơ xương khớp', 'Mất ngủ'],
    price: 350000,
    duration: 45,
    certifications: ['Cử nhân Vật lý trị liệu', 'Chứng chỉ myofascial release'],
    diseases: ['Đau cổ vai gáy', 'Căng cơ thắt lưng', 'Tê bì ngón tay', 'Đau cơ xơ hóa'],
    biography: 'Kỹ thuật viên Lê Thị B chuyên sâu về giải phóng cơ sâu (Myofascial Release) và trị liệu giảm áp lực cột sống. Cô có kỹ thuật tay cực kỳ khéo léo, thấu hiểu áp lực cơ của nhân viên văn phòng phải ngồi liên tục trước máy tính, giúp khách hàng lấy lại sự cân bằng cơ thể tức thì.',
    education: [
      {
        degree: 'Cử nhân Kỹ thuật Phục hồi chức năng',
        school: 'Đại học Y Khoa Phạm Ngọc Thạch',
        year: '2016 - 2020'
      },
      {
        degree: 'Chứng chỉ giải phóng mạc cơ chuyên sâu',
        school: 'Hiệp hội Trị liệu Thể chất Việt Nam',
        year: '2021'
      }
    ],
    articles: [
      {
        id: 'b1',
        title: 'Bí quyết giãn cơ cổ vai gáy ngay tại bàn làm việc',
        readTime: '4 phút đọc',
        category: '#NhanVienVanPhong',
        summary: 'Chỉ 3 phút mỗi ngày với các bài tập kéo giãn đơn giản giúp phòng ngừa thoái hóa đốt sống cổ hiệu quả.'
      }
    ],
    reviews: [
      {
        name: 'Hoàng Quốc V.',
        rating: 5,
        disease: 'Đau mỏi vai gáy',
        comment: 'KTV Lê Thị B giải cơ rất tốt, lực tay vừa vặn và biết chính xác các điểm đau nút thắt cơ để xử lý. Sau buổi làm việc tôi thấy nhẹ nhõm hẳn.'
      }
    ],
    schedule: [
      { day: 'Thứ 2', time: '08:00 - 17:00' },
      { day: 'Thứ 3', time: 'Nghỉ' },
      { day: 'Thứ 4', time: '08:00 - 17:00' },
      { day: 'Thứ 5', time: '08:00 - 17:00' },
      { day: 'Thứ 7', time: '08:00 - 12:00' }
    ]
  },
  {
    id: '3',
    name: 'TS. BS. Trần Minh C',
    role: 'Phục hồi Thần kinh',
    rating: 4.8,
    experience: 12,
    status: 'today',
    statusLabel: 'Hôm nay',
    category: 'phuc-hoi-van-dong',
    description: 'Nhiều năm kinh nghiệm trong trị liệu thần kinh cơ và phục hồi vận động sau tai biến mạch máu não hoặc các tổn thương tuỷ sống.',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=350&h=350&q=80',
    tags: ['Đau thắt lưng', 'Trị liệu'],
    price: 600000,
    duration: 60,
    certifications: ['Tiến sĩ Y khoa chuyên ngành Phục hồi chức năng', 'Tu nghiệp tại CHLB Đức'],
    diseases: ['Phục hồi sau tai biến', 'Tổn thương tuỷ sống', 'Đau dây thần kinh ngoại biên', 'Liệt dây thần kinh số 7'],
    biography: 'Tiến sĩ, Bác sĩ Trần Minh C là chuyên gia đầu ngành trong điều trị các bệnh lý thần kinh cơ. Với hơn 12 năm kinh nghiệm lâm sàng và nhiều năm nghiên cứu tại Đức, ông đã áp dụng thành công các phác đồ kích thích thần kinh và tập vận động phản xạ điều trị cho hàng ngàn ca chấn thương phức tạp.',
    education: [
      {
        degree: 'Bác sĩ Đa khoa & Chuyên khoa 1',
        school: 'Đại học Y Hà Nội',
        year: '2008 - 2014'
      },
      {
        degree: 'Tiến sĩ Y khoa (PhD in Rehabilitation)',
        school: 'Đại học Munich, Đức',
        year: '2016 - 2020'
      }
    ],
    articles: [
      {
        id: 'c1',
        title: 'Cơ chế tái tạo kết nối thần kinh vận động sau tai biến',
        readTime: '10 phút đọc',
        category: '#ThầnKinh',
        summary: 'Tìm hiểu tầm quan trọng của việc can thiệp phục hồi sớm trong khung giờ vàng đối với bệnh nhân đột quỵ.'
      }
    ],
    reviews: [
      {
        name: 'Nguyễn Thanh T.',
        rating: 5,
        disease: 'Phục hồi sau tai biến',
        comment: 'Bác sĩ C cực kỳ giỏi chuyên môn và chu đáo. Nhờ phác đồ tập trung phản xạ thần kinh của bác sĩ mà bố tôi đã có thể tự đi lại nhẹ nhàng sau tai biến.'
      }
    ],
    schedule: [
      { day: 'Thứ 3', time: '08:00 - 17:00' },
      { day: 'Thứ 4', time: '08:00 - 17:00' },
      { day: 'Thứ 5', time: 'Nghỉ' },
      { day: 'Thứ 6', time: '08:00 - 17:00' },
      { day: 'Chủ Nhật', time: '08:00 - 12:00' }
    ]
  },
  {
    id: '4',
    name: 'BS. Hoàng Phan D',
    role: 'Y học Thể thao',
    rating: 4.9,
    experience: 6,
    status: 'available',
    statusLabel: 'Còn trống',
    category: 'y-hoc-the-thao',
    description: 'Đồng hành cùng nhiều đội tuyển thể thao quốc gia trong việc tối ưu hóa hiệu suất vận động và đẩy nhanh tiến trình phục hồi cơ bắp.',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=350&h=350&q=80',
    tags: ['Y học thể thao', 'Phục hồi'],
    price: 450000,
    duration: 45,
    certifications: ['Bác sĩ chuyên khoa Y học thể thao', 'Chứng chỉ siêu âm cơ xương khớp'],
    diseases: ['Đứt dây chằng chéo trước', 'Rách sụn chêm', 'Viêm gân gót Achilles', 'Căng đau cơ hamstring', 'Trật khớp vai tái hồi'],
    biography: 'Bác sĩ Hoàng Phan D là chuyên gia tư vấn y tế cho nhiều vận động viên bán chuyên và chuyên nghiệp. Chuyên ngành sâu của ông là thiết lập các bài tập phục hồi chức năng thể thao (Sports Rehabilitation) giúp đẩy nhanh tiến trình đưa vận động viên trở lại sân đấu một cách an toàn nhất.',
    education: [
      {
        degree: 'Bác sĩ Y khoa',
        school: 'Đại học Y Dược Huế',
        year: '2014 - 2020'
      },
      {
        degree: 'Chứng chỉ Y học Thể thao & Chấn thương học',
        school: 'Cấp bởi Bệnh viện Thể thao Việt Nam',
        year: '2022'
      }
    ],
    articles: [
      {
        id: 'd1',
        title: 'Quy trình 5 giai đoạn trở lại sân đấu sau phẫu thuật dây chằng chéo',
        readTime: '7 phút đọc',
        category: '#YHọcThểThao',
        summary: 'Các bài tập kiểm soát khớp gối và tăng tiến lực cơ đùi trước giúp bảo vệ dây chằng tái tạo.'
      }
    ],
    reviews: [
      {
        name: 'Trần Vũ Phong (VĐV cầu lông)',
        rating: 5,
        disease: 'Trị liệu chấn thương vai',
        comment: 'Bác sĩ D kiểm tra khớp gối và vai rất kỹ, phác đồ rõ ràng từng tuần. Sau 2 tháng đồng hành, khớp vai của tôi đã linh hoạt hoàn toàn, đập cầu không còn đau.'
      }
    ],
    schedule: [
      { day: 'Thứ 2', time: '08:00 - 17:00' },
      { day: 'Thứ 4', time: '08:00 - 17:00' },
      { day: 'Thứ 5', time: '08:00 - 17:00' },
      { day: 'Thứ 6', time: 'Nghỉ' },
      { day: 'Thứ 7', time: '08:00 - 17:00' }
    ]
  },
  {
    id: '5',
    name: 'KTV. Phạm Hương G',
    role: 'Trị liệu bằng tay (Manual Therapy)',
    rating: 4.7,
    experience: 4,
    status: 'today',
    statusLabel: 'Hôm nay',
    category: 'giam-dau',
    description: 'Kỹ thuật nắn chỉnh cột sống cột sống và mô mềm hiện đại, giúp giải toả áp lực cơ bắp tức thì và phục hồi biên độ khớp.',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=350&h=350&q=80',
    tags: ['Nắn chỉnh khớp', 'Trị liệu tay'],
    price: 300000,
    duration: 45,
    certifications: ['Cử nhân Vật lý trị liệu', 'Chứng chỉ nắn chỉnh khớp cột sống'],
    diseases: ['Lệch vẹo khung chậu', 'Đau khớp cùng chậu', 'Mất đường cong sinh lý cổ', 'Đau dây thần kinh toạ'],
    biography: 'Kỹ thuật viên Phạm Hương G là người có nhiều đam mê với các kỹ thuật nắn chỉnh xương khớp bằng tay (Chiropractic & Osteopathy). Cô áp dụng các động lực kéo giãn cột sống an toàn kết hợp giải cơ sâu giúp giải nén dây thần kinh cột sống thắt lưng bị chèn ép.',
    education: [
      {
        degree: 'Cử nhân Kỹ thuật Phục hồi chức năng',
        school: 'Đại học Y Dược Hải Phòng',
        year: '2018 - 2022'
      },
      {
        degree: 'Chứng chỉ Chiropractic Cơ bản & Nâng cao',
        school: 'Trung tâm đào tạo Việt - Mỹ',
        year: '2023'
      }
    ],
    articles: [
      {
        id: 'e1',
        title: 'Cách nhận biết lệch vẹo khung chậu do thói quen vắt chéo chân',
        readTime: '6 phút đọc',
        category: '#TưThế',
        summary: 'Thói quen ngồi vắt chéo chân lâu ngày làm sai lệch trục cơ thể và cách tập phục hồi cơ thắt lưng chậu.'
      }
    ],
    reviews: [
      {
        name: 'Đặng Quốc K.',
        rating: 5,
        disease: 'Lệch xương chậu',
        comment: 'Cô G tư vấn rất nhiệt tình, nắn chỉnh khớp hông và lưng rất êm. Cảm giác đau ê ẩm mông khi ngồi làm việc lâu đã giảm đi rất nhiều.'
      }
    ],
    schedule: [
      { day: 'Thứ 2', time: 'Nghỉ' },
      { day: 'Thứ 3', time: '08:00 - 17:00' },
      { day: 'Thứ 4', time: '08:00 - 17:00' },
      { day: 'Thứ 5', time: '08:00 - 17:00' },
      { day: 'Thứ 6', time: '08:00 - 17:00' }
    ]
  },
  {
    id: '6',
    name: 'BS. Vũ Hữu H',
    role: 'Phẫu thuật & Phục hồi',
    rating: 5.0,
    experience: 15,
    status: 'available',
    statusLabel: 'Còn trống',
    category: 'phuc-hoi-van-dong',
    description: 'Chuyên gia tư vấn và thiết lập liệu trình phục hồi sau phẫu thuật thay khớp, chấn thương dây chằng chéo và các can thiệp ngoại khoa.',
    avatar: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=350&h=350&q=80',
    tags: ['Phục hồi sau mổ', 'Khớp gối'],
    price: 550000,
    duration: 45,
    certifications: ['Bác sĩ chuyên khoa Phục hồi chức năng', 'Nguyên trưởng khoa PHCN Bệnh viện Chấn thương chỉnh hình'],
    diseases: ['Phục hồi sau thay khớp háng', 'Phục hồi sau phẫu thuật nội soi khớp gối', 'Cứng khớp sau chấn thương xương', 'Teo cơ do bất động lâu ngày'],
    biography: 'Bác sĩ Vũ Hữu H là một trong những cây đại thụ trong ngành Phục hồi chức năng. Với hơn 15 năm lãnh đạo khoa PHCN tại bệnh viện lớn, bác sĩ có kinh nghiệm dày dặn trong việc kiểm soát viêm sưng cơ học và thiết kế các bài tập thụ động đến chủ động giúp phục hồi tầm vận động tối đa cho bệnh nhân sau đại phẫu.',
    education: [
      {
        degree: 'Bác sĩ Đa khoa',
        school: 'Đại học Y Dược TP.HCM',
        year: '2000 - 2006'
      },
      {
        degree: 'Bác sĩ Chuyên khoa II Phục hồi chức năng',
        school: 'Đại học Y Dược TP.HCM',
        year: '2012 - 2014'
      }
    ],
    articles: [
      {
        id: 'f1',
        title: 'Chống cứng khớp và teo cơ sau phẫu thuật kết hợp xương',
        readTime: '9 phút đọc',
        category: '#HậuPhẫu',
        summary: 'Các bài tập gồng cơ tĩnh sớm và tầm vận động thụ động giúp bảo vệ sụn khớp và đẩy nhanh biên độ gập duỗi.'
      }
    ],
    reviews: [
      {
        name: 'Trần Bích T.',
        rating: 5,
        disease: 'Phục hồi sau thay khớp gối',
        comment: 'Tôi được bác sĩ H trực tiếp khám và hướng dẫn sau phẫu thuật thay khớp gối. Bác sĩ hướng dẫn cẩn thận, chi tiết. Lớp sưng nề gối giảm nhanh và giờ tôi đã đi lại bình thường.'
      }
    ],
    schedule: [
      { day: 'Thứ 2', time: '08:00 - 17:00' },
      { day: 'Thứ 3', time: '08:00 - 17:00' },
      { day: 'Thứ 4', time: 'Nghỉ' },
      { day: 'Thứ 5', time: '08:00 - 17:00' },
      { day: 'Thứ 6', time: '08:00 - 17:00' }
    ]
  }
];
