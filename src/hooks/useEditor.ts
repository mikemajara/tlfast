import { useEffect, useState } from 'react'

export function useEditor() {
  const [editor, setEditor] = useState<any>(null)

  useEffect(() => {
    const win = window as any
    if (win.editor) {
      setEditor(win.editor)
      return
    }

    const interval = setInterval(() => {
      if (win.editor) {
        setEditor(win.editor)
        clearInterval(interval)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [])

  return editor
}
