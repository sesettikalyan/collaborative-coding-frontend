import Editor, { type OnMount } from '@monaco-editor/react';
import { useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import * as monaco from 'monaco-editor';

interface CodeEditorProps {
  language: string;
  code: string;
  onChange: (value: string | undefined) => void;
  socket: Socket | null;
  roomId: string;
  currentUserId: string | undefined;
}

// Helper to assign a consistent 1-8 color index based on the user's ID
const getUserColorIndex = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 8) + 1;
};

export default function CodeEditor({
  language,
  code,
  onChange,
  socket,
  roomId,
  currentUserId
}: CodeEditorProps) {
  // Monaco's language ID for C++ is 'cpp'
  const monacoLanguage = language === 'cpp' ? 'cpp' : language;

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);

  // Track decoration IDs per user so we can cleanly remove the old ones when they move their cursor
  const decorationsRef = useRef<{ [userId: string]: string[] }>({});

  useEffect(() => {
    if (!socket) return;

    const handleCursorChange = (data: any) => {
      if (!editorRef.current || !monacoRef.current) return;
      if (data.userId === currentUserId) return; // Don't draw our own cursor

      const { userId, username, position, selection } = data;
      const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];
      const colorIndex = getUserColorIndex(userId);

      // 1. Draw the user's selection (highlighting text)
      if (selection && (selection.startLineNumber !== selection.endLineNumber || selection.startColumn !== selection.endColumn)) {
        newDecorations.push({
          range: new monacoRef.current.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          options: {
            className: `remote-selection-${colorIndex}`,
            hoverMessage: { value: `Selection by **${username}**` },
          },
        });
      }

      // 2. Draw the user's blinking cursor
      if (position) {
        newDecorations.push({
          range: new monacoRef.current.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column + 1 // Add 1 to column to force a non-empty range so Monaco renders the span
          ),
          options: {
            className: `remote-cursor remote-cursor-${colorIndex}`,
            hoverMessage: { value: `**${username}**` },
          },
        });
      }

      // 3. Apply decorations and save the IDs so they can be overwritten next time this user moves
      decorationsRef.current[userId] = editorRef.current.deltaDecorations(
        decorationsRef.current[userId] || [],
        newDecorations
      );
    };

    socket.on('editor:cursor_change', handleCursorChange);

    return () => {
      socket.off('editor:cursor_change', handleCursorChange);
    };
  }, [socket, currentUserId]);

  const socketRef = useRef(socket);
  const roomIdRef = useRef(roomId);

  // Keep refs in sync to prevent stale closures in Monaco callbacks
  useEffect(() => {
    socketRef.current = socket;
    roomIdRef.current = roomId;
  }, [socket, roomId]);

  const handleEditorMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    // Listen to cursor position changes and broadcast them
    editor.onDidChangeCursorPosition((e) => {
      if (socketRef.current && roomIdRef.current) {
        socketRef.current.emit('editor:cursor_change', {
          roomId: roomIdRef.current,
          position: e.position,
          selection: editor.getSelection(),
        });
      }
    });

    // Listen to selection changes and broadcast them
    editor.onDidChangeCursorSelection((e) => {
      if (socketRef.current && roomIdRef.current) {
        socketRef.current.emit('editor:cursor_change', {
          roomId: roomIdRef.current,
          position: e.selection.getPosition(), // The end of the selection is where the cursor is
          selection: e.selection,
        });
      }
    });
  };

  return (
    <div className="flex-1 relative min-h-0">
      <Editor
        height="100%"
        language={monacoLanguage}
        theme="vs-dark"
        value={code}
        onChange={onChange}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize: 15,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          formatOnPaste: true,
          padding: { top: 20 },
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}
      />
    </div>
  );
}
