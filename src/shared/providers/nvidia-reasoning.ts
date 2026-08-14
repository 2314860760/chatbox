import type { JSONValue } from 'ai'

export const NVIDIA_REASONING_EFFORTS = ['none', 'low', 'medium', 'high', 'xhigh', 'max'] as const
export type NvidiaReasoningEffort = (typeof NVIDIA_REASONING_EFFORTS)[number]
export type NvidiaReasoningLevel = 'low' | 'medium' | 'high'

type NvidiaReasoningProfile = {
  documentationUrl: string
  efforts: readonly NvidiaReasoningEffort[]
  mode: 'reasoning-effort' | 'enable-thinking' | 'thinking' | 'glm-5.2'
}

type FixedNvidiaReasoningProfile = {
  documentationUrl: string
  mode: 'fixed'
}

export type NvidiaReasoningProfileEntry = NvidiaReasoningProfile | FixedNvidiaReasoningProfile

const NIM_DOCS = 'https://docs.api.nvidia.com/nim/reference/'

export const NVIDIA_REASONING_PROFILES: Readonly<Record<string, NvidiaReasoningProfileEntry>> = {
  'openai/gpt-oss-20b': {
    mode: 'reasoning-effort',
    efforts: ['low', 'medium', 'high'],
    documentationUrl: `${NIM_DOCS}openai-gpt-oss-20b-infer`,
  },
  'openai/gpt-oss-120b': {
    mode: 'reasoning-effort',
    efforts: ['low', 'medium', 'high'],
    documentationUrl: `${NIM_DOCS}openai-gpt-oss-120b-infer`,
  },
  'deepseek-ai/deepseek-v4-flash': {
    mode: 'reasoning-effort',
    efforts: ['none', 'high', 'max'],
    documentationUrl: `${NIM_DOCS}deepseek-ai-deepseek-v4-flash-infer`,
  },
  'deepseek-ai/deepseek-v4-pro': {
    mode: 'reasoning-effort',
    efforts: ['none', 'high', 'max'],
    documentationUrl: `${NIM_DOCS}deepseek-ai-deepseek-v4-pro-infer`,
  },
  'mistralai/mistral-small-4-119b-2603': {
    mode: 'reasoning-effort',
    efforts: ['none', 'high'],
    documentationUrl: `${NIM_DOCS}mistralai-mistral-small-4-119b-2603-infer`,
  },
  'nvidia/nemotron-3-nano-30b-a3b': {
    mode: 'reasoning-effort',
    efforts: ['none', 'low', 'high'],
    documentationUrl: `${NIM_DOCS}nvidia-nemotron-3-nano-30b-a3b-infer`,
  },
  'nvidia/nemotron-3-super-120b-a12b': {
    mode: 'reasoning-effort',
    efforts: ['none', 'low', 'high'],
    documentationUrl: `${NIM_DOCS}nvidia-nemotron-3-super-120b-a12b-infer`,
  },
  'nvidia/nemotron-3-ultra-550b-a55b': {
    mode: 'reasoning-effort',
    efforts: ['none', 'low', 'high'],
    documentationUrl: `${NIM_DOCS}nvidia-nemotron-3-ultra-550b-a55b-infer`,
  },
  'qwen/qwen3.5-397b-a17b': {
    mode: 'enable-thinking',
    efforts: ['none', 'high'],
    documentationUrl: `${NIM_DOCS}qwen-qwen3-5-397b-a17b-infer`,
  },
  'qwen/qwen3-5-122b-a10b': {
    mode: 'enable-thinking',
    efforts: ['none', 'high'],
    documentationUrl: `${NIM_DOCS}qwen-qwen3-5-122b-a10b-infer`,
  },
  'z-ai/glm4.7': {
    mode: 'enable-thinking',
    efforts: ['none', 'high'],
    documentationUrl: `${NIM_DOCS}z-ai-glm4-7`,
  },
  'z-ai/glm5.1': {
    mode: 'enable-thinking',
    efforts: ['none', 'high'],
    documentationUrl: `${NIM_DOCS}z-ai-glm5.1`,
  },
  'z-ai/glm-5.2': {
    mode: 'glm-5.2',
    efforts: ['none', 'high', 'max'],
    documentationUrl: `${NIM_DOCS}z-ai-glm-5.2`,
  },
  'google/gemma-4-31b-it': {
    mode: 'enable-thinking',
    efforts: ['none', 'high'],
    documentationUrl: `${NIM_DOCS}google-gemma-4-31b-it-infer`,
  },
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning': {
    mode: 'enable-thinking',
    efforts: ['none', 'high'],
    documentationUrl: `${NIM_DOCS}nvidia-nemotron-3-nano-omni-30b-a3b-reasoning`,
  },
  'moonshotai/kimi-k2.5': {
    mode: 'thinking',
    efforts: ['none', 'high'],
    documentationUrl: `${NIM_DOCS}moonshotai-kimi-k2-5`,
  },
  'moonshotai/kimi-k2.6': {
    mode: 'thinking',
    efforts: ['none', 'high'],
    documentationUrl: `${NIM_DOCS}moonshotai-kimi-k2-6-infer`,
  },
  'moonshotai/kimi-k2-thinking': {
    mode: 'fixed',
    documentationUrl: `${NIM_DOCS}moonshotai-kimi-k2-thinking-infer`,
  },
  'qwen/qwen3-next-80b-a3b-thinking': {
    mode: 'fixed',
    documentationUrl: `${NIM_DOCS}qwen-qwen3-next-80b-a3b-thinking-infer`,
  },
  'qwen/qwq-32b': {
    mode: 'fixed',
    documentationUrl: `${NIM_DOCS}qwen-qwq-32b-infer`,
  },
}

export function getNvidiaReasoningProfile(modelId: string): NvidiaReasoningProfileEntry | undefined {
  return NVIDIA_REASONING_PROFILES[modelId.toLowerCase()]
}

export function getNvidiaReasoningEfforts(modelId: string): readonly NvidiaReasoningEffort[] {
  const profile = getNvidiaReasoningProfile(modelId)
  return profile && profile.mode !== 'fixed' ? profile.efforts : []
}

export function isNvidiaReasoningModel(modelId: string): boolean {
  return getNvidiaReasoningProfile(modelId) !== undefined
}

export function getNvidiaReasoningEffortForLevel(
  modelId: string,
  level: NvidiaReasoningLevel
): NvidiaReasoningEffort | undefined {
  const efforts = getNvidiaReasoningEfforts(modelId).filter((effort) => effort !== 'none')
  if (!efforts.length) return undefined

  if (efforts.length === 1) return efforts[0]
  if (efforts.length === 2) return level === 'low' ? efforts[0] : efforts[1]
  if (level === 'low') return efforts[0]
  if (level === 'medium') return efforts[Math.floor(efforts.length / 2)]
  return efforts[efforts.length - 1]
}

export function getNvidiaReasoningLevelForEffort(
  modelId: string,
  effort: NvidiaReasoningEffort | undefined
): NvidiaReasoningLevel | 'off' | undefined {
  if (!effort) return undefined
  if (effort === 'none') return 'off'

  const efforts = getNvidiaReasoningEfforts(modelId).filter((candidate) => candidate !== 'none')
  const index = efforts.indexOf(effort)
  if (index < 0) return undefined
  if (efforts.length === 1) return 'high'
  if (efforts.length === 2) return index === 0 ? 'low' : 'high'
  if (index === 0) return 'low'
  if (index === efforts.length - 1) return 'high'
  return 'medium'
}

export function applyNvidiaReasoningProfile(
  requestBody: Record<string, JSONValue>,
  modelId: string,
  effort: NvidiaReasoningEffort | undefined
): Record<string, JSONValue> {
  const profile = getNvidiaReasoningProfile(modelId)
  if (!profile || profile.mode === 'fixed' || !effort || !profile.efforts.includes(effort)) {
    return requestBody
  }

  if (profile.mode === 'reasoning-effort') {
    return { ...requestBody, reasoning_effort: effort }
  }

  const existingTemplateKwargs = requestBody.chat_template_kwargs
  const chatTemplateKwargs =
    existingTemplateKwargs && typeof existingTemplateKwargs === 'object' && !Array.isArray(existingTemplateKwargs)
      ? existingTemplateKwargs
      : {}
  const thinkingEnabled = effort !== 'none'

  if (profile.mode === 'glm-5.2') {
    return {
      ...requestBody,
      ...(thinkingEnabled ? { reasoning_effort: effort } : {}),
      chat_template_kwargs: {
        ...chatTemplateKwargs,
        enable_thinking: thinkingEnabled,
      },
    }
  }

  return {
    ...requestBody,
    chat_template_kwargs: {
      ...chatTemplateKwargs,
      [profile.mode === 'enable-thinking' ? 'enable_thinking' : 'thinking']: thinkingEnabled,
    },
  }
}
