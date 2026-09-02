import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { NodeSelection } from 'prosemirror-state';
import { useRef, useState, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, LinkIcon, ImageIcon, Undo, Redo, Trash2 } from 'lucide-react';
import { uploadImage } from '../../api/admin.api';
import { resolveImageUrl } from '../../../../utils/imageUrl';
import toast from 'react-hot-toast';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [floatingActionPos, setFloatingActionPos] = useState<{ top: number; right: number } | null>(null);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const serverOrigin = baseUrl.replace(/\/api\/?$/, '');

  const updateFloatingPosFromEl = (imgEl: HTMLElement) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const imgRect = imgEl.getBoundingClientRect();
    setFloatingActionPos({
      top: imgRect.top - containerRect.top + 16,
      right: containerRect.right - imgRect.right + 16,
    });
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'w-full max-h-[400px] object-cover rounded-2xl my-6 shadow-md border border-slate-200 cursor-pointer transition-all hover:opacity-95',
        },
      }),
      Placeholder.configure({ placeholder: 'Soạn nội dung bài viết ở đây...' })
    ],
    content: value ? value.replace(/src="\/uploads\//g, `src="${serverOrigin}/uploads/`) : '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const cleanHtml = html.replace(new RegExp(serverOrigin, 'g'), '');
      onChange(cleanHtml);
    },
    onSelectionUpdate: ({ editor }) => {
      const selection = editor.state.selection;
      const isImg = selection instanceof NodeSelection && selection.node.type.name === 'image';
      setIsImageSelected(isImg);
      if (!isImg) {
        setFloatingActionPos(null);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[360px] px-6 py-5 font-jakarta text-slate-700 text-sm leading-relaxed'
      },
      handleClickOn(view, _pos, node, nodePos, event) {
        if (node.type.name === 'image') {
          const selection = NodeSelection.create(view.state.doc, nodePos);
          view.dispatch(view.state.tr.setSelection(selection));
          setIsImageSelected(true);
          const target = event.target as HTMLElement;
          if (target) {
            updateFloatingPosFromEl(target);
          }
          return true;
        }
        setIsImageSelected(false);
        setFloatingActionPos(null);
        return false;
      },
      handleKeyDown(view, event) {
        if ((event.key === 'Backspace' || event.key === 'Delete') && view.state.selection instanceof NodeSelection) {
          const node = view.state.selection.node;
          if (node.type.name === 'image') {
            view.dispatch(view.state.tr.deleteSelection());
            setIsImageSelected(false);
            setFloatingActionPos(null);
            toast.success('Đã xóa ảnh khỏi bài viết');
            return true;
          }
        }
        return false;
      }
    }
  });

  // Sync external value changes if needed
  useEffect(() => {
    if (editor && value) {
      const formatted = value.replace(/src="\/uploads\//g, `src="${serverOrigin}/uploads/`);
      if (editor.getHTML() !== formatted) {
        editor.commands.setContent(formatted);
      }
    }
  }, [value, editor, serverOrigin]);

  if (!editor) return null;

  const handleInsertImage = async (file: File) => {
    try {
      const res = await uploadImage(file, 'blog');
      const imgUrl = resolveImageUrl(res.data.url);
      editor.chain().focus().setImage({ src: imgUrl, alt: 'Hình ảnh bài viết' }).run();
      toast.success('Đã chèn ảnh vào bài viết');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải ảnh lên');
    }
  };

  const handleDeleteSelectedImage = () => {
    if (editor) {
      editor.chain().focus().deleteSelection().run();
      setIsImageSelected(false);
      setFloatingActionPos(null);
      toast.success('Đã xóa ảnh khỏi bài viết!');
    }
  };

  const handleInsertLink = () => {
    const url = window.prompt('Nhập đường dẫn liên kết:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
    }
  };

  const ToolbarButton = ({ active, onClick, children, title, danger }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string; danger?: boolean }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
        danger 
          ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200' 
          : active 
            ? 'bg-[#0D9488] text-white shadow-xs font-bold' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div ref={containerRef} className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-sm relative">
      <style>{`
        .ProseMirror img {
          transition: all 0.2s ease-in-out;
          cursor: pointer;
        }
        .ProseMirror img.ProseMirror-selectednode {
          outline: 4px solid #0D9488;
          box-shadow: 0 0 0 6px rgba(13, 148, 136, 0.2);
          transform: scale(0.99);
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #94a3b8;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>

      {/* STICKY FLOATING TOOLBAR */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-1.5 px-3 py-2.5 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex-wrap shadow-2xs">
        <div className="flex items-center gap-1 flex-wrap">
          <ToolbarButton title="Đậm" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={15} />
          </ToolbarButton>
          <ToolbarButton title="Nghiêng" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={15} />
          </ToolbarButton>
          <ToolbarButton title="Tiêu đề H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={15} />
          </ToolbarButton>
          <ToolbarButton title="Tiêu đề H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 size={15} />
          </ToolbarButton>
          
          <div className="w-px h-5 bg-slate-200 mx-1" />

          <ToolbarButton title="Danh sách gạch đầu dòng" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={15} />
          </ToolbarButton>
          <ToolbarButton title="Danh sách đánh số" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={15} />
          </ToolbarButton>
          
          <div className="w-px h-5 bg-slate-200 mx-1" />

          <ToolbarButton title="Chèn liên kết" active={editor.isActive('link')} onClick={handleInsertLink}>
            <LinkIcon size={15} />
          </ToolbarButton>
          <ToolbarButton title="Chèn ảnh" onClick={() => imageInputRef.current?.click()}>
            <ImageIcon size={15} />
          </ToolbarButton>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleInsertImage(e.target.files[0]); e.target.value = ''; }}
          />

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <ToolbarButton title="Hoàn tác (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>
            <Undo size={15} />
          </ToolbarButton>
          <ToolbarButton title="Làm lại (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}>
            <Redo size={15} />
          </ToolbarButton>
        </div>

        {/* Optional delete button on toolbar when image is active */}
        {isImageSelected && (
          <button
            type="button"
            onClick={handleDeleteSelectedImage}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer animate-in fade-in"
            title="Xóa hình ảnh đang chọn"
          >
            <Trash2 size={13} />
            <span>Xóa ảnh</span>
          </button>
        )}
      </div>

      {/* FLOATING ACTION OVERLAY DIRECTLY ATTACHED TO THE SELECTED IMAGE */}
      {isImageSelected && floatingActionPos && (
        <div
          style={{
            position: 'absolute',
            top: `${floatingActionPos.top}px`,
            right: `${floatingActionPos.right}px`,
            zIndex: 30
          }}
          className="flex items-center gap-1.5 bg-slate-900/90 text-white px-2.5 py-1.5 rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md animate-in fade-in zoom-in-95"
        >
          <span className="text-[11px] font-bold text-slate-300 px-1 flex items-center gap-1">
            <ImageIcon size={13} className="text-teal-400" />
            Ảnh bài viết
          </span>
          <div className="w-px h-3.5 bg-slate-700" />
          <button
            type="button"
            onClick={handleDeleteSelectedImage}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            title="Xóa hình ảnh này khỏi bài viết (hoặc nhấn Delete / Backspace)"
          >
            <Trash2 size={13} />
            <span>Xóa ảnh này</span>
          </button>
        </div>
      )}

      {/* MAIN EDITOR CONTENT AREA */}
      <EditorContent editor={editor} />
    </div>
  );
}
