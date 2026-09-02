import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Command {
  id: string;
  name: string;
  icon: React.ReactNode;
  shortcut: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  appointments: any[];
  onOpenDetailModal: (apt: any) => void;
}

export function CommandPalette({ isOpen, onClose, commands, appointments, onOpenDetailModal }: CommandPaletteProps) {
  const [commandSearch, setCommandSearch] = useState('');

  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(commandSearch.toLowerCase())
  );

  const filteredApts = appointments.filter(apt =>
    (apt.ten_khach_hang?.toLowerCase().includes(commandSearch.toLowerCase()) || '') ||
    (apt.ten_dich_vu?.toLowerCase().includes(commandSearch.toLowerCase()) || '') ||
    (apt.ma_lich_dat?.toLowerCase().includes(commandSearch.toLowerCase()) || '')
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-955/40 dark:bg-zinc-955/65 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[500px]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-slate-400 dark:text-zinc-550 font-mono text-xs bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200/50">
                Ctrl K
              </span>
              <input
                type="text"
                placeholder="Tìm bệnh nhân, tác vụ hoặc gõ lệnh..."
                value={commandSearch}
                onChange={e => setCommandSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-zinc-150 text-sm placeholder-slate-400 dark:placeholder-zinc-500"
                autoFocus
              />
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded border border-slate-200/50 dark:border-zinc-700">
                ESC
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredCommands.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-3 py-1.5">
                    Tác vụ & Phím tắt
                  </p>
                  {filteredCommands.map(cmd => (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-55/60 dark:hover:bg-zinc-800/60 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-slate-400 group-hover:text-[#0D9488] transition-colors">
                          {cmd.icon}
                        </span>
                        <span>{cmd.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                        {cmd.shortcut}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {commandSearch.trim() !== '' && filteredApts.length > 0 && (
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-3 py-1.5 border-t border-slate-50 dark:border-zinc-800/50">
                    Lịch hẹn khớp tìm kiếm
                  </p>
                  {filteredApts.map(apt => (
                    <button
                      key={apt.id}
                      onClick={() => {
                        onOpenDetailModal(apt);
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-55/60 dark:hover:bg-zinc-800/60 flex items-center justify-between text-xs text-slate-755 dark:text-zinc-355 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-800 dark:text-zinc-100">
                          {apt.ten_khach_hang}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          {apt.ten_dich_vu}
                        </span>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="font-mono text-[9px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-zinc-400">
                          {apt.ma_lich_dat}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
