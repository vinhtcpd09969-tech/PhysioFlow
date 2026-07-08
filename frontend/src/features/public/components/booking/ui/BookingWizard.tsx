interface BookingWizardProps {
  activeStep: number;
}

export function BookingWizard({ activeStep }: BookingWizardProps) {
  const steps = [
    'Chọn Hình Thức',
    'Chọn Ngày Hẹn',
    'Chọn Giờ Hẹn',
    'Thông Tin Liên Hệ',
    'Xác Nhận Đăng Ký'
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-xs font-jakarta">
        <span className="text-[#2EC4B6] font-extrabold uppercase tracking-wider">
          Bước {activeStep} / 5
        </span>
        <span className="text-slate-400 font-bold">
          {steps[activeStep - 1]}
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
        {[1, 2, 3, 4, 5].map((stepNum) => (
          <div
            key={stepNum}
            className={`h-full flex-1 transition-all duration-300 border-r border-white last:border-0 ${
              activeStep >= stepNum ? 'bg-[#2EC4B6]' : 'bg-slate-100'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
