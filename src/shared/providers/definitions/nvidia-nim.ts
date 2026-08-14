import { ModelProviderEnum, ModelProviderType, type ProviderModelInfo } from '../../types'
import { defineProvider } from '../registry'
import NvidiaNIM, { NVIDIA_NIM_API_HOST } from './models/nvidia-nim'

const REASONING_CAPABILITY: NonNullable<ProviderModelInfo['capabilities']> = ['reasoning']

export const nvidiaNIMProvider = defineProvider({
  id: ModelProviderEnum.NvidiaNIM,
  name: 'NVIDIA NIM API',
  type: ModelProviderType.OpenAI,
  urls: {
    website: 'https://build.nvidia.com/',
    apiKey: 'https://build.nvidia.com/settings/api-keys',
    docs: 'https://docs.api.nvidia.com/nim/reference/llm-apis',
  },
  defaultSettings: {
    apiHost: NVIDIA_NIM_API_HOST,
    apiPath: '/chat/completions',
    models: [
      'openai/gpt-oss-20b',
      'openai/gpt-oss-120b',
      'deepseek-ai/deepseek-v4-flash',
      'deepseek-ai/deepseek-v4-pro',
      'mistralai/mistral-small-4-119b-2603',
      'nvidia/nemotron-3-nano-30b-a3b',
      'nvidia/nemotron-3-super-120b-a12b',
      'nvidia/nemotron-3-ultra-550b-a55b',
      'qwen/qwen3.5-397b-a17b',
      'z-ai/glm4.7',
      'moonshotai/kimi-k2.5',
      'moonshotai/kimi-k2.6',
      'moonshotai/kimi-k2-thinking',
    ].map((modelId) => ({ modelId, capabilities: REASONING_CAPABILITY })),
  },
  createModel: (config) =>
    new NvidiaNIM(
      {
        apiKey: config.effectiveApiKey,
        apiHost: config.formattedApiHost || NVIDIA_NIM_API_HOST,
        apiPath: config.formattedApiPath || '/chat/completions',
        model: config.model,
        temperature: config.settings.temperature,
        topP: config.settings.topP,
        maxOutputTokens: config.settings.maxTokens,
        stream: config.settings.stream,
        useProxy: config.providerSetting.useProxy,
      },
      config.dependencies
    ),
  getDisplayName: (modelId, providerSettings) =>
    `NVIDIA NIM (${providerSettings?.models?.find((model) => model.modelId === modelId)?.nickname || modelId})`,
})
