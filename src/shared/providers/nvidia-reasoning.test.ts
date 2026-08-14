import { describe, expect, it } from 'vitest'
import { ModelProviderEnum, type ProviderModelInfo } from '../types'
import {
  getReasoningControlCapabilities,
  getReasoningControlLevel,
  getReasoningControlOptions,
  getReasoningProviderOptions,
} from '../utils/reasoning-control'
import {
  applyNvidiaReasoningProfile,
  getNvidiaReasoningEfforts,
  getNvidiaReasoningProfile,
  NVIDIA_REASONING_PROFILES,
} from './nvidia-reasoning'

function model(modelId: string): ProviderModelInfo {
  return { modelId, providerId: ModelProviderEnum.NvidiaNIM, capabilities: ['reasoning'] }
}

describe('NVIDIA reasoning profiles', () => {
  it('uses model-specific request fields', () => {
    expect(
      applyNvidiaReasoningProfile({ model: 'deepseek-ai/deepseek-v4-flash' }, 'deepseek-ai/deepseek-v4-flash', 'max')
    ).toEqual({
      model: 'deepseek-ai/deepseek-v4-flash',
      reasoning_effort: 'max',
    })

    expect(applyNvidiaReasoningProfile({ model: 'moonshotai/kimi-k2.6' }, 'moonshotai/kimi-k2.6', 'none')).toEqual({
      model: 'moonshotai/kimi-k2.6',
      chat_template_kwargs: { thinking: false },
    })
  })

  it('preserves existing template settings', () => {
    expect(
      applyNvidiaReasoningProfile(
        {
          model: 'qwen/qwen3.5-397b-a17b',
          chat_template_kwargs: { force_nonempty_content: true },
        },
        'qwen/qwen3.5-397b-a17b',
        'high'
      )
    ).toEqual({
      model: 'qwen/qwen3.5-397b-a17b',
      chat_template_kwargs: {
        force_nonempty_content: true,
        enable_thinking: true,
      },
    })
  })

  it('keeps every maintained profile discoverable', () => {
    for (const [modelId, profile] of Object.entries(NVIDIA_REASONING_PROFILES)) {
      expect(getNvidiaReasoningProfile(modelId)).toEqual(profile)
      expect(profile.documentationUrl).toContain('https://docs.api.nvidia.com/nim/reference/')
      expect(getNvidiaReasoningEfforts(modelId)).toEqual(profile.mode === 'fixed' ? [] : profile.efforts)
    }
  })
})

describe('NVIDIA unified reasoning control', () => {
  it('maps a two-level NVIDIA profile onto low/high controls', () => {
    const modelInfo = model('deepseek-ai/deepseek-v4-flash')

    expect(getReasoningControlCapabilities(ModelProviderEnum.NvidiaNIM, modelInfo)).toEqual({
      supported: true,
      kind: 'nvidia-effort',
    })
    expect(getReasoningControlOptions(ModelProviderEnum.NvidiaNIM, modelInfo)).toEqual([
      { level: 'default', label: 'default' },
      { level: 'off', label: 'off' },
      { level: 'low', label: 'high' },
      { level: 'high', label: 'max' },
    ])
    expect(getReasoningProviderOptions(ModelProviderEnum.NvidiaNIM, modelInfo, 'low')).toEqual({
      nvidia: { reasoningEffort: 'high' },
    })
    expect(getReasoningProviderOptions(ModelProviderEnum.NvidiaNIM, modelInfo, 'high')).toEqual({
      nvidia: { reasoningEffort: 'max' },
    })
    expect(
      getReasoningControlLevel(ModelProviderEnum.NvidiaNIM, modelInfo, {
        nvidia: { reasoningEffort: 'max' },
      })
    ).toBe('high')
  })

  it('does not expose controls for fixed-thinking NVIDIA models', () => {
    expect(
      getReasoningControlCapabilities(ModelProviderEnum.NvidiaNIM, model('moonshotai/kimi-k2-thinking')).supported
    ).toBe(false)
  })
})
