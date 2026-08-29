import React, { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, 
  Code2, 
  Maximize2,
  Minimize2,
  Box,
  CheckCircle2,
  GitBranch,
  RotateCcw,
  FolderOpen as FolderOpenIcon,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

import { reviewCode, CodeReview } from '../services/aiService';
import { FileNode } from './FileTree';
import FileExplorer from './ide/FileExplorer';
import EditorTabs from './ide/EditorTabs';
import TerminalPanel from './ide/TerminalPanel';
import AIAssistant from './ide/AIAssistant';

export default function CodingSpace() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [openFileIds, setOpenFileIds] = useState<string[]>([]);
  const [output, setOutput] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState<CodeReview | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'explorer' | 'search' | 'git' | 'extensions'>('explorer');
  const [isLoading, setIsLoading] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState<'terminal' | 'output' | 'debug' | 'ai'>('terminal');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(data);
      if (!activeFileId) {
        const javaFile = data.find((f: any) => f.type === 'file' && f.name.endsWith('.java'));
        if (javaFile) {
          setActiveFileId(javaFile.id);
          setOpenFileIds([javaFile.id]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const activeFile = files.find(f => f.id === activeFileId);

  const handleFileSelect = (file: FileNode) => {
    setActiveFileId(file.id);
    if (!openFileIds.includes(file.id)) {
      setOpenFileIds(prev => [...prev, file.id]);
    }
  };

  const handleFileClose = (id: string) => {
    setOpenFileIds(prev => {
      const remaining = prev.filter(fid => fid !== id);
      if (activeFileId === id) {
        setActiveFileId(remaining.length > 0 ? remaining[remaining.length - 1] : null);
      }
      return remaining;
    });
  };

  const handleToggleFolder = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  };

  const handleAddFile = async (parentId: string | null) => {
    const name = prompt('Enter file name:');
    if (!name) return;
    
    try {
      const response = await fetch('/api/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type: 'file', parentId })
      });
      const data = await response.json();
      
      if (data.success) {
        const newFile: FileNode = {
          id: data.id,
          name,
          type: 'file',
          parentId,
          content: ''
        };
        setFiles(prev => [...prev, newFile]);
        handleFileSelect(newFile);
      }
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleAddFolder = async (parentId: string | null) => {
    const name = prompt('Enter folder name:');
    if (!name) return;
    
    try {
      const response = await fetch('/api/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type: 'folder', parentId })
      });
      const data = await response.json();
      
      if (data.success) {
        const newFolder: FileNode = {
          id: data.id,
          name,
          type: 'folder',
          parentId,
          isOpen: true
        };
        setFiles(prev => [...prev, newFolder]);
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this?')) {
      try {
        const response = await fetch('/api/files/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const data = await response.json();
        
        if (data.success) {
          setFiles(prev => prev.filter(f => f.id !== id && f.parentId !== id));
          handleFileClose(id);
        }
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const handleCodeChange = async (value: string | undefined) => {
    if (activeFileId) {
      const updatedContent = value || '';
      setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: updatedContent } : f));
      
      try {
        await fetch('/api/files/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: activeFileId, content: updatedContent })
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    setOutput('➜ Running command: npm run lint\n');
    setActiveBottomTab('terminal');
    setIsTerminalOpen(true);
    
    try {
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'npm run lint' })
      });
      const data = await response.json();
      
      if (data.stdout) setOutput(prev => prev + data.stdout);
      if (data.stderr) setOutput(prev => prev + '\nERRORS:\n' + data.stderr);
      if (data.error) setOutput(prev => prev + '\nSYSTEM ERROR:\n' + data.error);
      
    } catch (error) {
      setOutput(prev => prev + 'Error: Failed to connect to the terminal service.\n' + String(error));
    } finally {
      setIsCompiling(false);
    }
  };

  const handleReview = async () => {
    if (!activeFile?.content) return;
    setIsReviewing(true);
    setActiveBottomTab('ai');
    setIsTerminalOpen(true);
    try {
      const result = await reviewCode(activeFile.content);
      setReview(result);
    } catch (error) {
      console.error('Review error:', error);
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#1e1e1e] text-slate-300 ${isFullScreen ? 'fixed inset-0 z-[100]' : ''}`}>
      {/* Top Header */}
      <div className="h-10 bg-[#323233] flex items-center justify-between px-3 shrink-0 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-slate-600 rounded flex items-center justify-center text-white">
              <Code2 size={12} />
            </div>
            <span className="text-xs font-medium text-slate-400">Java Full Stack IDE</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <button className="hover:text-slate-300">File</button>
            <button className="hover:text-slate-300">Edit</button>
            <button className="hover:text-slate-300">Selection</button>
            <button className="hover:text-slate-300">View</button>
            <button className="hover:text-slate-300">Go</button>
            <button className="hover:text-slate-300">Run</button>
            <button className="hover:text-slate-300">Terminal</button>
            <button className="hover:text-slate-300">Help</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* @ts-ignore */}
        <PanelGroup direction="horizontal">
          {/* Sidebar Panel */}
          <Panel defaultSize={20} minSize={15} collapsible>
            <FileExplorer 
              files={files}
              activeFileId={activeFileId}
              onFileSelect={handleFileSelect}
              onAddFile={handleAddFile}
              onAddFolder={handleAddFolder}
              onDelete={handleDelete}
              onToggleFolder={handleToggleFolder}
              activeSidebarTab={activeSidebarTab}
              setActiveSidebarTab={setActiveSidebarTab}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-black/20 hover:bg-slate-500/50 transition-colors cursor-col-resize" />

          {/* Main Content Panel */}
          <Panel defaultSize={80}>
            {/* @ts-ignore */}
            <PanelGroup direction="vertical">
              <Panel defaultSize={70}>
                <div className="flex flex-col h-full bg-[#1e1e1e]">
                  <EditorTabs 
                    openFileIds={openFileIds}
                    activeFileId={activeFileId}
                    files={files}
                    onFileSelect={(id) => setActiveFileId(id)}
                    onFileClose={handleFileClose}
                  />
                  
                  <div className="flex-1 relative">
                    {isLoading ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <Loader2 size={32} className="animate-spin mb-4 text-slate-500" />
                        <p className="text-sm">Connecting to Server...</p>
                      </div>
                    ) : activeFile ? (
                      <Editor
                        height="100%"
                        theme="vs-dark"
                        path={activeFile.name}
                        defaultLanguage={activeFile.name.endsWith('.java') ? 'java' : activeFile.name.endsWith('.xml') ? 'xml' : 'plaintext'}
                        value={activeFile.content}
                        onChange={handleCodeChange}
                        options={{
                          fontSize: 14,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          padding: { top: 10 },
                          fontFamily: "'JetBrains Mono', monospace",
                          renderWhitespace: 'none',
                          guides: { indentation: true },
                          bracketPairColorization: { enabled: true },
                        }}
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <FolderOpenIcon size={64} className="opacity-10 mb-4" />
                        <p className="text-sm">Select a file to start coding</p>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              {isTerminalOpen && (
                <>
                  <PanelResizeHandle className="h-1 bg-black/20 hover:bg-slate-500/50 transition-colors cursor-row-resize" />
                  <Panel defaultSize={30} minSize={10} collapsible>
                    <TerminalPanel 
                      output={output}
                      isCompiling={isCompiling}
                      onCompile={handleCompile}
                      onClear={() => setOutput('')}
                      activeTab={activeBottomTab}
                      setActiveTab={setActiveBottomTab}
                      onClose={() => setIsTerminalOpen(false)}
                    />
                    {activeBottomTab === 'ai' && (
                      <div className="absolute inset-0 top-9 bg-[#1e1e1e] p-4 overflow-y-auto">
                        <AIAssistant 
                          review={review}
                          isReviewing={isReviewing}
                          onReview={handleReview}
                          onClear={() => setReview(null)}
                          activeFile={activeFile}
                        />
                      </div>
                    )}
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-[#007acc] flex items-center justify-between px-3 shrink-0 text-white text-[11px]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className="flex items-center gap-1.5 hover:bg-white/10 px-1 rounded cursor-pointer"
          >
            <Box size={12} className="text-slate-300" />
            <span className="font-bold">Terminal: {isTerminalOpen ? 'Open' : 'Closed'}</span>
          </button>
          <div className="flex items-center gap-1.5 hover:bg-white/10 px-1 rounded cursor-pointer">
            <GitBranch size={12} />
            <span>main*</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>Spaces: 4</span>
          <span>UTF-8</span>
          <span>Java</span>
          <div className="flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>Prettier</span>
          </div>
        </div>
      </div>
    </div>
  );
}
