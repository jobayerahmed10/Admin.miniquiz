import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Indent,
  Outdent,
  Quote,
  Code,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  RemoveFormatting,
  Code2,
  Eye,
  Type,
  Palette,
  Highlighter,
  ExternalLink,
  Plus,
  Trash2,
  X,
  Maximize2,
  Minimize2,
  FileCode,
} from 'lucide-react';
import { uploadBlogThumbnail } from '../../lib/supabase';

interface RichTextEditorProps {
  value?: string;
  content?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const COLOR_PALETTE = [
  '#000000',
  '#1e293b',
  '#475569',
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#16a34a',
  '#059669',
  '#0284c7',
  '#2563eb',
  '#7c3aed',
  '#db2777',
];

const HIGHLIGHT_PALETTE = [
  'transparent',
  '#fef08a',
  '#fed7aa',
  '#fecaca',
  '#bbf7d0',
  '#a7f3d0',
  '#bae6fd',
  '#ddd6fe',
  '#fbcfe8',
  '#f1f5f9',
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  content,
  onChange,
  placeholder = 'এখানে আপনার ব্লগের সম্পূর্ণ লেখা, ছবি, টেবিল এবং লিংক সাজিয়ে লিখুন...',
}) => {
  const actualContent = value !== undefined ? value : content !== undefined ? content : '';
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [htmlSource, setHtmlSource] = useState(actualContent);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false);

  // Sync incoming content with editor div if not focused
  useEffect(() => {
    const nextContent = value !== undefined ? value : content !== undefined ? content : '';
    if (editorRef.current && !isSourceMode) {
      if (editorRef.current.innerHTML !== nextContent) {
        editorRef.current.innerHTML = nextContent;
      }
    }
    setHtmlSource(nextContent);
  }, [value, content, isSourceMode]);

  // Execute standard editor commands
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (isSourceMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlSource(html);
      onChange(html);
    }
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setHtmlSource(val);
    onChange(val);
  };

  const toggleSourceMode = () => {
    if (isSourceMode) {
      // Switching from HTML source to visual editor
      setIsSourceMode(false);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = htmlSource;
        }
      }, 0);
    } else {
      // Switching to HTML source
      if (editorRef.current) {
        setHtmlSource(editorRef.current.innerHTML);
      }
      setIsSourceMode(true);
    }
  };

  // Format block (Headings, Paragraph, Blockquote)
  const formatBlock = (tag: string) => {
    execCmd('formatBlock', `<${tag}>`);
  };

  // Link Insertion
  const openLinkModal = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setLinkText(selection.toString());
    } else {
      setLinkText('');
    }
    setLinkUrl('');
    setLinkNewTab(true);
    setLinkModalOpen(true);
  };

  const handleInsertLink = () => {
    if (!linkUrl) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }

    const formattedUrl = linkUrl.startsWith('http://') || linkUrl.startsWith('https://')
      ? linkUrl
      : `https://${linkUrl}`;

    if (linkText && (!window.getSelection()?.toString() || window.getSelection()?.toString() !== linkText)) {
      const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
      const linkHtml = `<a href="${formattedUrl}"${targetAttr} class="text-emerald-600 dark:text-emerald-400 font-semibold underline hover:text-emerald-700">${linkText}</a>`;
      execCmd('insertHTML', linkHtml);
    } else {
      execCmd('createLink', formattedUrl);
    }

    setLinkModalOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Image Insertion
  const handleInsertImage = () => {
    if (!imageUrl) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const imgHtml = `<figure class="my-4 text-center">
      <img src="${imageUrl}" alt="${imageAlt || 'Blog Image'}" class="max-w-full h-auto rounded-2xl mx-auto border border-slate-200 dark:border-slate-800 shadow-md inline-block" />
      ${imageAlt ? `<figcaption class="text-xs text-slate-500 mt-1.5">${imageAlt}</figcaption>` : ''}
    </figure><p><br/></p>`;
    execCmd('insertHTML', imgHtml);
    setImageModalOpen(false);
    setImageUrl('');
    setImageAlt('');
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    const { url, error } = await uploadBlogThumbnail(file);
    setImageUploading(false);

    if (url) {
      setImageUrl(url);
    } else {
      alert(`ইমেজ আপলোডে সমস্যা: ${error || 'দয়া করে সরাসরি ইমেজ লিঙ্ক ব্যবহার করুন'}`);
    }
  };

  // Table Insertion
  const handleInsertTable = () => {
    const rows = Math.max(1, tableRows);
    const cols = Math.max(1, tableCols);

    let tableHtml = `<div class="overflow-x-auto my-4"><table class="w-full text-left border-collapse border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden text-sm"><thead><tr class="bg-slate-100 dark:bg-slate-800/80">`;
    for (let c = 0; c < cols; c++) {
      tableHtml += `<th class="border border-slate-300 dark:border-slate-700 p-2.5 font-bold text-slate-800 dark:text-slate-200">হেডার ${c + 1}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;

    for (let r = 0; r < rows; r++) {
      tableHtml += `<tr class="border-b border-slate-200 dark:border-slate-800">`;
      for (let c = 0; c < cols; c++) {
        tableHtml += `<td class="border border-slate-300 dark:border-slate-700 p-2.5 text-slate-700 dark:text-slate-300">ডাটা ${r + 1}-${c + 1}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table></div><p><br/></p>`;

    execCmd('insertHTML', tableHtml);
    setTableModalOpen(false);
  };

  // Insert Custom Callout Box
  const insertCallout = () => {
    const calloutHtml = `<div class="p-4 my-4 bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 rounded-r-xl text-slate-800 dark:text-slate-200 shadow-sm">
      <p class="font-bold text-emerald-700 dark:text-emerald-400 mb-1">গুরুত্বপূর্ণ তথ্য / নোটিশ:</p>
      <p>এখানে আপনার বিশেষ সতর্কবার্তা বা গুরুত্বপূর্ণ বুলেট পয়েন্ট লিখুন...</p>
    </div><p><br/></p>`;
    execCmd('insertHTML', calloutHtml);
  };

  // Word & Character count calculation
  const getStats = () => {
    const text = (htmlSource || '').replace(/<[^>]*>?/gm, '').trim();
    const chars = text.length;
    const words = text ? text.split(/\s+/).length : 0;
    const readMinutes = Math.max(1, Math.ceil(words / 150));
    return { chars, words, readMinutes };
  };

  const { chars, words, readMinutes } = getStats();

  return (
    <div
      className={`border border-slate-300 dark:border-slate-700/80 rounded-2xl bg-white dark:bg-[#0c1424] overflow-hidden flex flex-col shadow-sm transition-all duration-200 ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl bg-white dark:bg-[#0c1424]' : ''
      }`}
    >
      {/* Editor Header / Toolbars */}
      <div className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 p-2 flex flex-wrap items-center justify-between gap-1.5 select-none">
        {/* Main Toolbar Buttons Group */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings / Style Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              onChange={(e) => formatBlock(e.target.value)}
              defaultValue="p"
              disabled={isSourceMode}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            >
              <option value="p">অনুচ্ছেদ (Paragraph)</option>
              <option value="h1">প্রধান শিরোনাম (H1)</option>
              <option value="h2">উপ-শিরোনাম (H2)</option>
              <option value="h3">ছোট শিরোনাম (H3)</option>
              <option value="h4">সাব-হেডিং (H4)</option>
              <option value="blockquote">উদ্ধৃতি (Blockquote)</option>
              <option value="pre">কোড ব্লক (Code Block)</option>
            </select>
          </div>

          <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Text Formatting */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => execCmd('bold')}
              disabled={isSourceMode}
              title="বোল্ড (Bold Ctrl+B)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('italic')}
              disabled={isSourceMode}
              title="ইটালিক (Italic Ctrl+I)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('underline')}
              disabled={isSourceMode}
              title="আন্ডারলাইন (Underline Ctrl+U)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('strikeThrough')}
              disabled={isSourceMode}
              title="স্ট্রাইকথ্রু (Strikethrough)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('subscript')}
              disabled={isSourceMode}
              title="সাবস্ক্রিপ্ট (Subscript)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40 hidden sm:inline-flex"
            >
              <Subscript className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('superscript')}
              disabled={isSourceMode}
              title="সুপারস্ক্রিপ্ট (Superscript)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40 hidden sm:inline-flex"
            >
              <Superscript className="w-4 h-4" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => execCmd('justifyLeft')}
              disabled={isSourceMode}
              title="বামে সারিবদ্ধ (Align Left)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('justifyCenter')}
              disabled={isSourceMode}
              title="মাঝখানে সারিবদ্ধ (Align Center)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('justifyRight')}
              disabled={isSourceMode}
              title="ডানে সারিবদ্ধ (Align Right)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40"
            >
              <AlignRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('justifyFull')}
              disabled={isSourceMode}
              title="জাস্টিফাই (Justify)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40 hidden sm:inline-flex"
            >
              <AlignJustify className="w-4 h-4" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Color & Highlight */}
          <div className="relative flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => {
                setColorPickerOpen(!colorPickerOpen);
                setHighlightPickerOpen(false);
              }}
              disabled={isSourceMode}
              title="টেক্সট কালার (Text Color)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              <Palette className="w-4 h-4 text-rose-500" />
            </button>

            {colorPickerOpen && (
              <div className="absolute top-8 left-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl shadow-xl grid grid-cols-6 gap-1 w-40">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      execCmd('foreColor', c);
                      setColorPickerOpen(false);
                    }}
                    style={{ backgroundColor: c }}
                    className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition-transform"
                  />
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setHighlightPickerOpen(!highlightPickerOpen);
                setColorPickerOpen(false);
              }}
              disabled={isSourceMode}
              title="হাইলাইট কালার (Background Highlight)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              <Highlighter className="w-4 h-4 text-amber-500" />
            </button>

            {highlightPickerOpen && (
              <div className="absolute top-8 left-6 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl shadow-xl grid grid-cols-5 gap-1.5 w-44">
                {HIGHLIGHT_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      execCmd('hiliteColor', c);
                      setHighlightPickerOpen(false);
                    }}
                    style={{ backgroundColor: c }}
                    className="w-6 h-5 rounded border border-slate-300 hover:scale-105 transition-transform text-[9px] font-bold"
                  >
                    {c === 'transparent' ? '✕' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Lists & Indents */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => execCmd('insertUnorderedList')}
              disabled={isSourceMode}
              title="বুলেট লিস্ট (Bullet List)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('insertOrderedList')}
              disabled={isSourceMode}
              title="নম্বর লিস্ট (Numbered List)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('indent')}
              disabled={isSourceMode}
              title="ইনডেন্ট (Indent Right)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40 hidden md:inline-flex"
            >
              <Indent className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('outdent')}
              disabled={isSourceMode}
              title="আউটডেন্ট (Outdent Left)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40 hidden md:inline-flex"
            >
              <Outdent className="w-4 h-4" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Media & Embed Elements */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={openLinkModal}
              disabled={isSourceMode}
              title="হাইপারলিংক যুক্ত করুন (Insert Link)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40"
            >
              <LinkIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
            <button
              type="button"
              onClick={() => setImageModalOpen(true)}
              disabled={isSourceMode}
              title="ছবি যুক্ত করুন (Insert Image)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40"
            >
              <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              type="button"
              onClick={() => setTableModalOpen(true)}
              disabled={isSourceMode}
              title="টেবিল তৈরি করুন (Create Table)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40"
            >
              <TableIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('insertHorizontalRule')}
              disabled={isSourceMode}
              title="ডিভাইডার লাইন (Horizontal Divider)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40 hidden sm:inline-flex"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={insertCallout}
              disabled={isSourceMode}
              title="নোটিশ / কলআউট বক্স যুক্ত করুন"
              className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-md transition-colors disabled:opacity-40 text-xs font-bold hidden md:inline-flex"
            >
              + কলআউট
            </button>
          </div>

          <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Undo / Redo & Clear */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => execCmd('undo')}
              disabled={isSourceMode}
              title="আগের অবস্থায় ফিরুন (Undo Ctrl+Z)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('redo')}
              disabled={isSourceMode}
              title="পুনরায় করুন (Redo Ctrl+Y)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-40"
            >
              <Redo className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('removeFormat')}
              disabled={isSourceMode}
              title="ফরমেটিং মুছুন (Clear Formatting)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 rounded-md transition-colors disabled:opacity-40"
            >
              <RemoveFormatting className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Action: HTML Mode & Fullscreen */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={toggleSourceMode}
            className={`px-2.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 border transition-all ${
              isSourceMode
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="HTML Source Code Mode"
          >
            {isSourceMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Visual Editor</span>
              </>
            ) : (
              <>
                <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                <span>HTML Code</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
            title={isFullscreen ? 'মিনিমাইজ' : 'ফুলস্ক্রিন'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 relative flex flex-col min-h-[360px] max-h-[700px] overflow-y-auto">
        {isSourceMode ? (
          <textarea
            value={htmlSource}
            onChange={handleSourceChange}
            placeholder="<p>Write your raw HTML content here...</p>"
            className="w-full h-full min-h-[360px] p-4 font-mono text-xs text-emerald-600 dark:text-emerald-400 bg-slate-950 border-none outline-none resize-none leading-relaxed"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onBlur={handleEditorInput}
            data-placeholder={placeholder}
            className="prose dark:prose-invert max-w-none w-full flex-1 p-5 outline-none text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-relaxed overflow-y-auto min-h-[360px] focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
            style={{ minHeight: '360px' }}
          />
        )}
      </div>

      {/* Footer Word & Character Counter */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div className="flex items-center gap-4 font-medium">
          <span>শব্দ সংখ্যা: <strong className="text-slate-800 dark:text-slate-200">{words}</strong></span>
          <span>অক্ষর: <strong className="text-slate-800 dark:text-slate-200">{chars}</strong></span>
          <span>আনুমানিক পড়ার সময়: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{readMinutes} মিনিট</strong></span>
        </div>

        <div className="text-[11px] text-slate-400">
          {isSourceMode ? 'HTML Source Mode' : 'WYSIWYG Visual Editor'}
        </div>
      </div>

      {/* ---------------- MODALS ---------------- */}

      {/* Link Modal */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                <LinkIcon className="w-4 h-4 text-emerald-500" />
                হাইপারলিংক যুক্ত করুন
              </h3>
              <button
                onClick={() => setLinkModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ডিসপ্লে টেক্সট (Text to display)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="যেমন: অফিসিয়াল সার্কুলার দেখুন"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ওয়েব লিংক বা URL *
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com বা www.ntrca.gov.bd"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newTabCheck"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded border-slate-700 focus:ring-emerald-500"
                />
                <label htmlFor="newTabCheck" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  নতুন ট্যাবে ওপেন হবে (Open in new tab)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                disabled={!linkUrl}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                লিংক যুক্ত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                <ImageIcon className="w-4 h-4 text-blue-500" />
                ব্লগের ভেতরে ছবি যুক্ত করুন
              </h3>
              <button
                onClick={() => setImageModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  সুপাবেজ স্টোরেজ থেকে আপলোড করুন
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 text-slate-400"
                />
                {imageUploading && (
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1.5 animate-pulse">
                    ছবি আপলোড হচ্ছে...
                  </p>
                )}
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-300 dark:border-slate-700" />
                <span className="flex-shrink mx-2 text-[10px] text-slate-400 uppercase font-bold">অথবা লিংক পেস্ট করুন</span>
                <div className="flex-grow border-t border-slate-300 dark:border-slate-700" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  অনলাইন ইমেজ URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ছবির বিবরণ / ক্যাপশন (Alt Text)
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="যেমন: ১৮তম শিক্ষক নিবন্ধন সার্কুলার তালিকা"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {imageUrl && (
                <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl flex items-center justify-center max-h-32 overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={imageUrl} alt="Preview" className="max-h-28 object-contain rounded-lg" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                disabled={!imageUrl || imageUploading}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
              >
                ছবি পোস্ট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {tableModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <TableIcon className="w-4 h-4 text-purple-500" />
                টেবিল সাইজ নির্বাচন করুন
              </h3>
              <button
                onClick={() => setTableModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  রো সংখ্যা (Rows)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  কলাম সংখ্যা (Cols)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTableModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleInsertTable}
                className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-md shadow-purple-600/20"
              >
                টেবিল তৈরি করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
