import assert from 'node:assert/strict'
import test from 'node:test'
import { isPresetApplyCommand, presetApplyRequest } from '../src/commandBus.ts'
import { applyPreset } from '../src/editorPresets.ts'

test('preset requests use a unique id and canonical payload', () => {
  const request = presetApplyRequest({ id: 'blue-arrow', toolId: 'arrow', styles: { color: 'blue' } })

  assert.deepEqual(request, {
    id: 'preset.apply.blue-arrow',
    payload: { toolId: 'arrow', styles: { color: 'blue' } },
  })
  assert.equal(isPresetApplyCommand(request.id), true)
  assert.equal(isPresetApplyCommand('preset.apply'), false)
})

test('applying a preset prepares the next shape and leaves its tool selected', () => {
  const calls: Array<unknown[]> = []
  const colorStyle = { id: 'tldraw:color' }
  const editor = {
    getSharedStyles: () => new Map([[colorStyle, { type: 'shared', value: 'black' }]]),
    setCurrentTool: (toolId: string) => calls.push(['tool', toolId]),
    setOpacityForNextShapes: (opacity: number) => calls.push(['next-opacity', opacity]),
    setStyleForNextShapes: (style: unknown, value: string) => calls.push(['next-style', style, value]),
  }

  const skipped = applyPreset(editor, { toolId: 'arrow', styles: { color: 'blue', opacity: '0.5' } })

  assert.deepEqual(skipped, [])
  assert.deepEqual(calls, [
    ['tool', 'arrow'],
    ['next-style', colorStyle, 'blue'],
    ['next-opacity', 0.5],
    ['tool', 'arrow'],
  ])
})

test('an unavailable style is skipped without changing the preset tool', () => {
  const calls: Array<unknown[]> = []
  const editor = {
    getSharedStyles: () => new Map(),
    setCurrentTool: (toolId: string) => calls.push(['tool', toolId]),
    setOpacityForNextShapes: () => assert.fail('opacity should not be called'),
    setStyleForNextShapes: () => assert.fail('style should not be called'),
  }

  const skipped = applyPreset(editor, { toolId: 'draw', styles: { geo: 'rectangle' } })

  assert.deepEqual(skipped, ['geo'])
  assert.deepEqual(calls, [['tool', 'draw'], ['tool', 'draw']])
})
