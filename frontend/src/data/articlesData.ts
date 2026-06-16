export interface ArticleDetail {
  id: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  publishDate: string;
  coverImage: string;
  content: string; // Rich HTML format
  tags: string[];
}

export const MOCK_ARTICLES: ArticleDetail[] = [
  {
    id: 'a1',
    title: 'Tầm quan trọng của vận động chính xác trong điều trị đĩa đệm',
    category: 'Cột Sống',
    readTime: '5 phút đọc',
    summary: 'Khám phá cách các bài tập vi mô có thể tái định vị cấu trúc cột sống mà không cần can thiệp ngoại khoa xâm lấn.',
    authorId: '1',
    authorName: 'BS. Nguyễn Văn A',
    authorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&h=150&q=80',
    authorRole: 'Chuyên gia Phục hồi chức năng',
    publishDate: '12/06/2026',
    coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&h=600&q=80',
    tags: ['Cột sống', 'Thoát vị đĩa đệm', 'Giải cơ', 'Vật lý trị liệu'],
    content: `
      <p class="lead text-lg font-semibold text-slate-650 leading-relaxed mb-6">Thoát vị đĩa đệm không còn là bản án chung thân buộc người bệnh phải phụ thuộc vào bàn mổ. Y học phục hồi hiện đại chứng minh rằng các bài tập vận động chính xác (therapeutic precision movements) có khả năng kích hoạt cơ chế tự phục hồi của cơ thể.</p>
      
      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">1. Cơ chế tổn thương đĩa đệm dưới góc nhìn sinh cơ học</h2>
      <p class="text-slate-650 mb-4">Đĩa đệm cột sống hoạt động giống như một bộ giảm xóc thủy lực giữa các đốt sống. Khi tư thế làm việc sai lệch kéo dài (như cúi đầu gù lưng khi gõ máy tính), áp lực cơ học phân bổ không đều làm rách bao xơ bên ngoài, khiến nhân nhầy thoát ra ngoài chèn ép vào rễ thần kinh, gây nên những cơn đau buốt lan dọc xuống chân.</p>
      
      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">2. Tại sao vận động chính xác lại hiệu quả?</h2>
      <p class="text-slate-650 mb-4">Thay vì tập luyện tự do hoặc kéo giãn thô bạo, phương pháp vận động chính xác sử dụng các bài tập vi mô (micro-movements) được thiết kế riêng biệt cho từng bệnh nhân nhằm:</p>
      <ul class="list-disc pl-6 text-slate-650 mb-6 space-y-2">
        <li><strong>Tạo áp lực âm nội đĩa đệm:</strong> Nhờ các tư thế chuyên biệt, khoảng cách giữa các đốt sống được mở rộng nhẹ nhàng, tạo lực hút kéo nhân nhầy thoát vị trở lại vị trí trung tâm.</li>
        <li><strong>Tái lập cân bằng cơ lõi (Core stability):</strong> Kích hoạt nhóm cơ dựng gai (multifidus) và cơ bụng ngang (transversus abdominis) tạo thành một chiếc đai lưng tự nhiên bảo vệ cột sống vững chắc.</li>
        <li><strong>Giải phóng chèn ép rễ thần kinh:</strong> Các kỹ thuật trượt thần kinh (nerve gliding) giúp dây thần kinh di động tự do qua các khe hẹp xương, giảm thiểu tình trạng tê bì tức thì.</li>
      </ul>

      <div class="my-10 p-6 bg-[#E8F8F2] border border-[#2EC4B6]/20 rounded-3xl">
        <h4 class="text-xs font-black text-[#0F3327] uppercase tracking-wider mb-2">Lời khuyên y khoa chuẩn Office Care</h4>
        <p class="text-slate-700 text-xs leading-relaxed font-semibold">Tập luyện cột sống cần tuân thủ nguyên tắc "Không đau". Bất kỳ bài tập nào gây tăng cơn đau buốt lan truyền xuống mông hoặc chân cần được dừng lại ngay lập tức và tham khảo ý kiến bác sĩ chuyên khoa.</p>
      </div>

      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">3. Lộ trình tự phục hồi 3 bước cơ bản</h2>
      <p class="text-slate-650 mb-4">Tại Office Care, chúng tôi hướng dẫn người bệnh các bài tập tự phục hồi bao gồm:</p>
      <ol class="list-decimal pl-6 text-slate-650 mb-6 space-y-3">
        <li><strong>Giai đoạn Giảm tải (Decompression):</strong> Nằm sấp thư giãn hoặc tư thế rắn hổ mang nhẹ nhàng (McKenzie Extension) để đẩy nhân nhầy hướng về phía trước.</li>
        <li><strong>Giai đoạn Ổn định cơ học (Stabilization):</strong> Bài tập Bird-Dog và Plank nghiêng để củng cố sức bền cơ cốt lõi mà không gây vặn xoắn đĩa đệm.</li>
        <li><strong>Giai đoạn Tái hòa nhập vận động (Integration):</strong> Tập luyện nâng vật nặng đúng tư thế (Deadlift biến thể nhẹ) và điều chỉnh dáng đi đứng chuẩn y khoa.</li>
      </ol>
    `
  },
  {
    id: 'a2',
    title: 'Phục hồi chấn thương cổ tay cho dân văn phòng',
    category: 'Văn Phòng',
    readTime: '8 phút đọc',
    summary: 'Các phương pháp vật lý trị liệu tại chỗ dành riêng cho những người làm việc với máy tính cường độ cao.',
    authorId: '1',
    authorName: 'BS. Nguyễn Văn A',
    authorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&h=150&q=80',
    authorRole: 'Chuyên gia Phục hồi chức năng',
    publishDate: '10/06/2026',
    coverImage: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=1200&h=600&q=80',
    tags: ['Cổ tay', 'Hội chứng ống cổ tay', 'Dân văn phòng', 'Giải mỏi'],
    content: `
      <p class="lead text-lg font-semibold text-slate-650 leading-relaxed mb-6">Đau buốt cổ tay, tê bì ngón cái và ngón trỏ là những dấu hiệu cảnh báo điển hình của Hội chứng ống cổ tay (Carpal Tunnel Syndrome) - căn bệnh nghề nghiệp phổ biến nhất ở những người thường xuyên sử dụng chuột và bàn phím máy tính.</p>
      
      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">1. Hội chứng ống cổ tay hình thành như thế nào?</h2>
      <p class="text-slate-650 mb-4">Ống cổ tay là một khe hẹp nằm ở mặt lòng cổ tay, chứa dây thần kinh giữa và các gân gấp ngón tay. Khi chúng ta liên tục gập ngửa cổ tay quá mức hoặc tỳ đè tay lên cạnh bàn cứng khi gõ phím, áp lực bên trong ống cổ tay tăng lên, chèn ép trực tiếp lên dây thần kinh giữa, dẫn đến tình trạng tê rần, yếu lực bàn tay và đau nhức dữ dội về đêm.</p>
      
      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">2. Giải pháp phục hồi từ gốc</h2>
      <p class="text-slate-650 mb-4">Để điều trị dứt điểm chấn thương này, y học phục hồi Office Care tập trung vào 3 yếu tố cốt lõi:</p>
      <ul class="list-disc pl-6 text-slate-650 mb-6 space-y-2">
        <li><strong>Trị liệu giải phóng cơ sâu (Myofascial Release):</strong> Kỹ thuật viên sử dụng tay để nới lỏng cơ gấp cổ tay vùng cẳng tay, giảm căng thẳng co kéo lên gân vùng ống cổ tay.</li>
        <li><strong>Kéo dãn dây chằng ngang cổ tay (Transverse ligament stretch):</strong> Giúp mở rộng diện tích ống cổ tay một cách tự nhiên bằng tay, giải phóng không gian cho dây thần kinh giữa thở.</li>
        <li><strong>Trượt thần kinh giữa (Median nerve gliding):</strong> Bài tập di động dây thần kinh giúp tăng tưới máu nuôi dưỡng và loại bỏ tình trạng kết dính xơ hóa xung quanh dây thần kinh.</li>
      </ul>

      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">3. Các bước thiết lập lại bàn làm việc công thái học</h2>
      <p class="text-slate-650 mb-4">Thay đổi thói quen làm việc là chìa khóa then chốt ngăn ngừa tái phát:</p>
      <ol class="list-decimal pl-6 text-slate-650 mb-6 space-y-2">
        <li><strong>Độ cao bàn ghế:</strong> Điều chỉnh ghế sao cho khuỷu tay gập góc 90 độ và cẳng tay song song với mặt sàn khi gõ phím.</li>
        <li><strong>Bàn phím và chuột:</strong> Sử dụng chuột đứng công thái học (vertical mouse) và bàn phím chia đôi để giữ cổ tay luôn ở tư thế trung tính (không gập ngửa hay lệch sang bên).</li>
        <li><strong>Nghỉ ngơi định kỳ:</strong> Thực hiện quy tắc 50-5: Cứ gõ phím 50 phút thì dành 5 phút xoay nhẹ cổ tay và kéo giãn gân duỗi cẳng tay.</li>
      </ol>
    `
  },
  {
    id: 'b1',
    title: 'Bí quyết giãn cơ cổ vai gáy ngay tại bàn làm việc',
    category: 'Văn Phòng',
    readTime: '4 phút đọc',
    summary: 'Chỉ 3 phút mỗi ngày với các bài tập kéo giãn đơn giản giúp phòng ngừa thoái hóa đốt sống cổ hiệu quả.',
    authorId: '2',
    authorName: 'KTV. Lê Thị B',
    authorAvatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=150&h=150&q=80',
    authorRole: 'Điều trị Đau nhức văn phòng',
    publishDate: '08/06/2026',
    coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&h=600&q=80',
    tags: ['Giãn cơ', 'Cổ vai gáy', 'Giải mỏi', 'Căng cơ thắt lưng'],
    content: `
      <p class="lead text-lg font-semibold text-slate-650 leading-relaxed mb-6">Ngồi liên tục trước màn hình máy tính 8 tiếng mỗi ngày khiến nhóm cơ thang trên (upper trapezius) và cơ nâng vai (levator scapulae) luôn trong trạng thái gồng cứng thụ động. Đây là nguyên nhân trực tiếp dẫn tới hiện tượng mỏi nhức ê ẩm lan tỏa vùng cổ gáy, thỉnh thoảng kèm theo những cơn đau đầu vận mạch.</p>
      
      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">1. Ba động tác giải mỏi cơ thang trên trong 3 phút</h2>
      <p class="text-slate-650 mb-4">Bạn có thể tự thực hiện các động tác giãn cơ sâu này ngay tại ghế ngồi làm việc mà không cần bất kỳ dụng cụ hỗ trợ nào:</p>
      <ul class="list-disc pl-6 text-slate-650 mb-6 space-y-3">
        <li><strong>Động tác 1: Kéo giãn cơ thang trên (Upper Trapezius Stretch):</strong> Ngồi thẳng lưng, tay phải bám chặt vào cạnh ghế để cố định vai phải. Tay trái vòng qua đỉnh đầu nhẹ nhàng kéo đầu nghiêng sang bên trái cho đến khi cảm thấy vùng cơ bên phải được kéo căng. Giữ yên 20 giây, thở đều rồi đổi bên. Thực hiện 3 lần mỗi bên.</li>
        <li><strong>Động tác 2: Kéo giãn cơ nâng vai (Levator Scapulae Stretch):</strong> Giữ nguyên tư thế ngồi bám cạnh ghế. Xoay đầu một góc 45 độ sang bên trái (mắt nhìn về hướng nách trái), dùng tay trái nhẹ nhàng kéo đầu cúi xuống. Tư thế này tác động sâu vào điểm bám tận của cơ nâng vai gáy. Giữ 20 giây và đổi bên.</li>
        <li><strong>Động tác 3: Thu cằm (Chin Tuck):</strong> Ngồi thẳng lưng, hướng mắt nhìn thẳng về phía trước. Dùng một ngón tay đặt nhẹ lên cằm, nhẹ nhàng đẩy cằm ra sau (tạo cằm đôi) sao cho tai thẳng hàng với vai. Giữ 5 giây rồi thả lỏng. Thực hiện liên tục 10 lần để giải tỏa áp lực đè nén lên các đốt sống cổ C5-C6.</li>
      </ul>

      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">2. Tác động của nhiệt và thói quen sinh hoạt</h2>
      <p class="text-slate-650 mb-4">Bên cạnh việc giãn cơ, thay đổi nhiệt độ tại vùng cơ bị co thắt cũng mang lại hiệu quả giải tỏa tức thì:</p>
      <p class="text-slate-650 mb-4"><strong>Chườm nóng thảo dược:</strong> Sử dụng túi chườm thảo dược Office Care làm ấm bằng lò vi sóng, chườm lên vùng vai cổ gáy khoảng 15-20 phút vào cuối ngày. Nhiệt nóng kết hợp tinh chất thảo dược giúp tăng cường tuần hoàn máu, làm mềm mô xơ và thư giãn hệ thần kinh cảm giác.</p>
    `
  },
  {
    id: 'c1',
    title: 'Cơ chế tái tạo kết nối thần kinh vận động sau tai biến',
    category: 'Thần Kinh',
    readTime: '10 phút đọc',
    summary: 'Tìm hiểu tầm quan trọng của việc can thiệp phục hồi sớm trong khung giờ vàng đối với bệnh nhân đột quỵ.',
    authorId: '3',
    authorName: 'TS. BS. Trần Minh C',
    authorAvatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=150&h=150&q=80',
    authorRole: 'Phục hồi Thần kinh',
    publishDate: '05/06/2026',
    coverImage: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&h=600&q=80',
    tags: ['Thần kinh', 'Phục hồi sau tai biến', 'Đột quỵ', 'Tập vận động'],
    content: `
      <p class="lead text-lg font-semibold text-slate-650 leading-relaxed mb-6">Sau một cơn đột quỵ (tai biến mạch máu não), hàng triệu tế bào thần kinh tại vùng não bị tổn thương sẽ chết đi, khiến đường truyền tín hiệu chỉ huy vận động từ não bộ xuống cơ thể bị đứt gãy hoàn toàn. Tuy nhiên, nhờ vào cơ chế "Tính mềm dẻo của não bộ" (Neuroplasticity), hệ thần kinh trung ương có khả năng tự tái lập bản đồ kết nối để khôi phục khả năng vận động.</p>
      
      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">1. Tính mềm dẻo của não bộ (Neuroplasticity) là gì?</h2>
      <p class="text-slate-650 mb-4">Não bộ không phải là một cấu trúc tĩnh cứng nhắc. Khi một khu vực đảm nhận chức năng vận động bị tổn thương, các tế bào thần kinh lành lặn xung quanh có khả năng tự mọc ra các nhánh mới (sợi gai và sợi trục) để tạo nên những con đường truyền tin thay thế. Quá trình này không tự nhiên diễn ra hiệu quả mà đòi hỏi phải có sự kích thích liên tục, chính xác thông qua các bài tập phục hồi chức năng chuyên sâu.</p>
      
      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">2. Tầm quan trọng cực kỳ của "Khung giờ vàng"</h2>
      <p class="text-slate-650 mb-4">Nghiên cứu lâm sàng chứng minh rằng khả năng tái tạo thần kinh mạnh mẽ nhất diễn ra trong vòng <strong>3 đến 6 tháng đầu tiên</strong> sau tai biến. Đây được gọi là "khung giờ vàng" trong phục hồi chức năng:</p>
      <ul class="list-disc pl-6 text-slate-650 mb-6 space-y-2">
        <li><strong>Giai đoạn 0 - 3 tháng (Tái cấu trúc nhanh):</strong> Bộ não nhạy cảm nhất với các kích thích bên ngoài. Việc tập luyện vận động thụ động đến chủ động sớm tại giường giúp ngăn ngừa tình trạng xơ hóa cơ khớp và kích thích tế bào não tạo liên kết mới.</li>
        <li><strong>Giai đoạn 3 - 6 tháng (Định hình chức năng):</strong> Tập trung vào việc tập luyện các vận động tinh tế (cầm nắm, tập đi đứng thăng bằng) để tinh chỉnh các đường truyền thần kinh mới hình thành.</li>
        <li><strong>Sau 6 tháng (Duy trì và thích ứng):</strong> Quá trình phục hồi sẽ chậm dần lại nhưng vẫn tiếp tục phát triển nếu bệnh nhân kiên trì tập luyện đúng phác đồ.</li>
      </ul>

      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">3. Các phương pháp phục hồi thần kinh tiên tiến</h2>
      <p class="text-slate-650 mb-4">Tại Office Care, chúng tôi kết hợp nhiều phương pháp phục hồi thần kinh cơ hiện đại:</p>
      <ol class="list-decimal pl-6 text-slate-650 mb-6 space-y-2">
        <li><strong>Liệu pháp Gương (Mirror Therapy):</strong> Sử dụng hình ảnh phản chiếu của phần chi lành lặn qua gương để đánh lừa bộ não, kích hoạt vùng não tương ứng điều khiển phần chi bị liệt vận động trở lại.</li>
        <li><strong>Tập vận động cưỡng bức chi liệt (Constraint-Induced Movement Therapy - CIMT):</strong> Hạn chế sử dụng tay lành để bắt buộc bộ não phải nỗ lực gửi tín hiệu chỉ huy hoạt động sang tay bị liệt.</li>
        <li><strong>Tập luyện theo nhiệm vụ cụ thể (Task-Specific Training):</strong> Thiết lập các bài tập lặp đi lặp lại gắn liền với hành vi thực tế như cầm cốc nước, cài cúc áo để tái định hình đường dẫn truyền thần kinh vận động tự nhiên.</li>
      </ol>
    `
  },
  {
    id: 'd1',
    title: 'Quy trình 5 giai đoạn trở lại sân đấu sau phẫu thuật dây chằng chéo',
    category: 'Thể Thao',
    readTime: '7 phút đọc',
    summary: 'Các bài tập kiểm soát khớp gối và tăng tiến lực cơ đùi trước giúp bảo vệ dây chằng tái tạo.',
    authorId: '4',
    authorName: 'BS. Hoàng Phan D',
    authorAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=150&h=150&q=80',
    authorRole: 'Y học Thể thao',
    publishDate: '01/06/2026',
    coverImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&h=600&q=80',
    tags: ['Y học thể thao', 'Dây chằng chéo trước', 'Khớp gối', 'Chấn thương thể thao'],
    content: `
      <p class="lead text-lg font-semibold text-slate-650 leading-relaxed mb-6">Tái tạo dây chằng chéo trước (ACL reconstruction) chỉ là 50% chặng đường. 50% còn lại quyết định khả năng bạn có thể bứt tốc, xoay người hay sút bóng trở lại như xưa hay không hoàn toàn nằm ở quy trình tập luyện phục hồi sau phẫu thuật.</p>
      
      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">Giai đoạn 1: Kiểm soát sưng viêm và duỗi thẳng khớp gối (Tuần 1 - 2)</h2>
      <p class="text-slate-650 mb-4">Mục tiêu sống còn trong giai đoạn đầu tiên này là đưa biên độ duỗi thẳng của khớp gối đạt 0 độ (duỗi thẳng hoàn toàn) để tránh tình trạng đi khập khiễng sau này. Đồng thời, sử dụng phương pháp R.I.C.E (Nghỉ ngơi, Chườm lạnh, Băng ép, Kê cao chi) kết hợp di động xương bánh chè để giảm sưng nề nhanh chóng.</p>
      
      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">Giai đoạn 2: Khôi phục biên độ gập và kích hoạt cơ đùi trước (Tuần 3 - 6)</h2>
      <p class="text-slate-650 mb-4">Tập trung nâng tầm vận động gập khớp gối lên 120 độ. Tập luyện gồng cơ tĩnh đầu đùi (quadriceps isometric) kết hợp bài tập nâng thẳng chân (straight leg raise) để ngăn chặn hiện tượng teo cơ đùi trước cực kỳ nhanh sau mổ.</p>
      
      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">Giai đoạn 3: Tăng cường sức mạnh cơ học chuỗi đóng (Tuần 7 - 12)</h2>
      <p class="text-slate-650 mb-4">Khi gối đã hết sưng viêm hoàn toàn và biên độ đạt mức tối đa, bệnh nhân bắt đầu chuyển sang các bài tập chịu lực cơ thể (closed kinetic chain) như Squat góc hẹp, Lunge, tập thăng bằng trên bóng bosu để cải thiện cảm thụ bản thể (proprioception) - khả năng nhận diện vị trí khớp gối trong không gian.</p>

      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">Giai đoạn 4: Tập luyện phản xạ nhanh và chạy bộ (Tháng 4 - 6)</h2>
      <p class="text-slate-650 mb-4">Bắt đầu tập luyện chạy thẳng, chạy đa hướng biến đổi tốc độ chậm và các bài tập plyometric (nhảy lò cò, tiếp đất bằng một chân). Ở giai đoạn này, sức mạnh cơ đùi chân mổ phải đạt tối thiểu 80% so với chân lành.</p>

      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">Giai đoạn 5: Tập luyện chuyên môn thể thao và quay lại thi đấu (Tháng 7 - 9+)</h2>
      <p class="text-slate-650 mb-4">Mô phỏng lại các kỹ thuật chuyên môn của từng bộ môn (ví dụ: xoay hông sút bóng ở bóng đá, nhảy đập cầu ở cầu lông). Bệnh nhân chỉ được phép quay lại thi đấu đối kháng khi vượt qua bài kiểm tra "Return to Sport" chuẩn y khoa quốc tế bao gồm các test nhảy lò cò 1 chân (Hop test) đạt chỉ số đối xứng chi > 90%.</p>
    `
  },
  {
    id: 'e1',
    title: 'Cách nhận biết lệch vẹo khung chậu do thói quen vắt chéo chân',
    category: 'Tư Thế',
    readTime: '6 phút đọc',
    summary: 'Thói quen ngồi vắt chéo chân lâu ngày làm sai lệch trục cơ thể và cách tập phục hồi cơ thắt lưng chậu.',
    authorId: '5',
    authorName: 'KTV. Phạm Hương G',
    authorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&h=150&q=80',
    authorRole: 'Trị liệu bằng tay (Manual Therapy)',
    publishDate: '28/05/2026',
    coverImage: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&w=1200&h=600&q=80',
    tags: ['Nắn chỉnh khớp', 'Lệch xương chậu', 'Lệch vai', 'Đau hông'],
    content: `
      <p class="lead text-lg font-semibold text-slate-650 leading-relaxed mb-6">Ngồi vắt chéo chân là thói quen cực kỳ ưa thích của chị em phụ nữ và dân văn phòng. Tuy nhiên, đằng sau dáng ngồi có vẻ thời trang này là một thảm họa âm thầm đối với hệ thống xương chậu và cột sống thắt lưng của bạn.</p>
      
      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">1. Thói quen ngồi vắt chéo chân tàn phá cơ thể ra sao?</h2>
      <p class="text-slate-650 mb-4">Khi vắt một chân lên chân kia, toàn bộ xương chậu bị xoay vặn và nghiêng lệch sang một bên, làm phân bổ lực không đều lên hai đùi khớp hông. Để giữ thăng bằng cho cơ thể thẳng đứng hướng mắt về phía trước, cột sống bắt buộc phải cong vẹo sang hướng ngược lại, gây ra phản ứng co thắt bù trừ của nhóm cơ thắt lưng chậu (iliopsoas) và cơ vuông thắt lưng (quadratus lumborum).</p>
      
      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">2. Ba cách nhận biết nhanh lệch vẹo khung chậu tại nhà</h2>
      <p class="text-slate-650 mb-4">Bạn có thể tự kiểm tra xem hệ xương chậu của mình có bị mất cân bằng cấu trúc hay không thông qua các quan sát trực quan sau:</p>
      <ul class="list-disc pl-6 text-slate-650 mb-6 space-y-2">
        <li><strong>Chiều dài gấu quần không đều:</strong> Khi mặc quần ống đứng dài chạm gót chân, bạn nhận thấy một bên ống quần luôn bị kéo cao hoặc quét đất nhiều hơn bên còn lại.</li>
        <li><strong>Điểm tựa hông bất cân xứng:</strong> Đứng thẳng trước gương, đặt hai bàn tay lên đỉnh mào chậu (vùng xương hông nhô cao ở hai bên thắt lưng). Quan sát xem chiều cao của hai bàn tay có nằm trên một đường thẳng song song với mặt đất hay không.</li>
        <li><strong>Đau mỏi ê ẩm một bên mông:</strong> Xuất hiện cơn đau âm ỉ vùng mông sâu lan rộng, đặc biệt đau buốt khi chuyển từ tư thế ngồi sang đứng thẳng dậy.</li>
      </ul>

      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">3. Phác đồ nắn chỉnh và phục hồi chức năng</h2>
      <p class="text-slate-650 mb-4">Tại phòng khám Office Care, chúng tôi giải quyết vấn đề lệch vẹo khung chậu theo lộ trình khoa học:</p>
      <ol class="list-decimal pl-6 text-slate-650 mb-6 space-y-2">
        <li><strong>Nắn chỉnh khớp chậu (Joint Mobilization):</strong> Áp dụng các kỹ thuật nắn chỉnh nhẹ nhàng để đưa khớp cùng chậu (sacroiliac joint) bị kẹt trở lại vị trí cơ học tự nhiên.</li>
        <li><strong>Giải cơ co thắt:</strong> Trị liệu sâu vào nhóm cơ vuông thắt lưng một bên bị co rút ngắn lại do khung chậu nghiêng.</li>
        <li><strong>Tập luyện cân bằng cơ hông:</strong> Hướng dẫn các bài tập tăng sức mạnh cơ mông nhỡ (gluteus medius) và kéo giãn cơ thắt lưng chậu để cố định khung chậu vững chãi lâu dài.</li>
      </ol>
    `
  },
  {
    id: 'f1',
    title: 'Chống cứng khớp và teo cơ sau phẫu thuật kết hợp xương',
    category: 'Hậu Phẫu',
    readTime: '9 phút đọc',
    summary: 'Các bài tập gồng cơ tĩnh sớm và tầm vận động thụ động giúp bảo vệ sụn khớp và đẩy nhanh biên độ gập duỗi.',
    authorId: '6',
    authorName: 'BS. Vũ Hữu H',
    authorAvatar: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=150&h=150&q=80',
    authorRole: 'Phẫu thuật & Phục hồi',
    publishDate: '25/05/2026',
    coverImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&h=600&q=80',
    tags: ['Phục hồi sau mổ', 'Cứng khớp', 'Teo cơ', 'Khớp gối', 'Khớp háng'],
    content: `
      <p class="lead text-lg font-semibold text-slate-650 leading-relaxed mb-6">Sau phẫu thuật kết hợp xương (đóng đinh nội tủy, nẹp vít đùi hoặc cẳng chân), việc bất động chi lâu ngày là bắt buộc để xương có thời gian liền sinh học. Tuy nhiên, sự bất động này lại dẫn đến hai biến chứng nghiêm trọng khác: cứng khớp vĩnh viễn và teo cơ đùi trước cực kỳ nhanh chóng.</p>
      
      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">1. Tại sao khớp bị đông cứng và cơ bị teo biến sau mổ?</h2>
      <p class="text-slate-650 mb-4">Khi khớp không được chuyển động, bao khớp xung quanh sẽ co rút lại, chất dịch khớp bôi trơn ngừng tiết ra gây xơ dính sụn khớp. Bên cạnh đó, hệ cơ đùi trước nếu không được kích hoạt co duỗi chủ động sẽ mất đi 20% khối lượng cơ chỉ sau 1 tuần bất động. Quá trình này diễn ra âm thầm nhưng tốn rất nhiều thời gian để tập luyện phục hồi lại nếu không can thiệp sớm.</p>
      
      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">2. Phác đồ chống cứng khớp 3 pha vàng</h2>
      <p class="text-slate-650 mb-4">Y học phục hồi hiện đại khuyến nghị tiến hành can thiệp vận động sớm ngay từ những ngày đầu tiên sau phẫu thuật dưới sự hướng dẫn tỉ mỉ của bác sĩ chuyên khoa:</p>
      <ul class="list-disc pl-6 text-slate-650 mb-6 space-y-2">
        <li><strong>Pha 1: Kích hoạt gồng cơ tĩnh đầu đùi (Isometric contraction):</strong> Thực hiện ép nhượng chân xuống giường, giữ 5 giây rồi thả lỏng. Động tác gồng cơ tĩnh này giúp tăng lưu lượng máu nuôi dưỡng vùng xương gãy và ngăn chặn hiện tượng teo cơ mà hoàn toàn không làm di động trục xương đang liền.</li>
        <li><strong>Pha 2: Vận động thụ động biên độ sớm (CPM - Continuous Passive Motion):</strong> Sử dụng máy tập thụ động hoặc bàn tay kỹ thuật viên để đưa khớp gập duỗi nhẹ nhàng trong biên độ không đau, ngăn cản hình thành dải xơ viêm dính bao khớp.</li>
        <li><strong>Pha 3: Di động xương bánh chè (Patellar Mobilization):</strong> Xương bánh chè kẹt cứng là nguyên nhân hàng đầu cản trở gập gối sau phẫu thuật. Kỹ thuật viên thực hiện đẩy xương bánh chè lên-xuống, sang hai bên để duy trì tính linh hoạt.</li>
      </ul>

      <h2 class="text-2xl font-black text-secondary uppercase tracking-tight mt-10 mb-4">3. Nguyên tắc chịu lực tải trọng tăng dần</h2>
      <p class="text-slate-650 mb-4">Bệnh nhân cần được bác sĩ chụp X-quang kiểm tra độ cal xương trước khi tập đứng chịu lực. Quá trình chịu lực (weight bearing) bắt đầu từ 25% trọng lượng cơ thể (sử dụng nạng nách), tăng dần lên 50%, 75% cho đến khi có thể đi lại tự do hoàn toàn không cần công cụ hỗ trợ. Mỗi bước tăng chịu tải lực học đều kích thích tế bào xương tạo xương mới nhanh hơn.</p>
    `
  }
];
