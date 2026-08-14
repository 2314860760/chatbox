import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { extractReasoningMiddleware, wrapLanguageModel } from 'ai'
import AbstractAISDKModel from '../../../models/abstract-ai-sdk'
import { fetchRemoteModels } from '../../../models/openai-compatible'
import type { CallChatCompletionOptions } from '../../../models/types'
import { createFetchWithProxy } from '../../../models/utils/fetch-proxy'
import type { ProviderModelInfo } from '../../../types'
import type { ModelDependencies } from '../../../types/adapters'
import { normalizeOpenAIApiHostAndPath } from '../../../utils/llm_utils'
import { applyNvidiaReasoningProfile, isNvidiaReasoningModel, type NvidiaReasoningEffort } from '../../nvidia-reasoning'

export const NVIDIA_NIM_API_HOST = 'https://integrate.api.nvidia.com/v1'

interface Options {
  apiKey: string
  apiHost: string
  apiPath: string
  model: ProviderModelInfo
  temperature?: number
  topP?: number
  maxOutputTokens?: number
  stream?: boolean
  useProxy?: boolean
}

type FetchFunction = typeof globalThis.fetch

export default class NvidiaNIM extends AbstractAISDKModel {
  public name = 'NVIDIA NIM'

  constructor(
    public options: Options,
    dependencies: ModelDependencies
  ) {
    super(options, dependencies)
    const { apiHost, apiPath } = normalizeOpenAIApiHostAndPath(options, {
      apiHost: NVIDIA_NIM_API_HOST,
      apiPath: '/chat/completions',
    })
    this.options = { ...options, apiHost, apiPath }
  }

  protected getCallSettings(options: CallChatCompletionOptions) {
    const effort = options.providerOptions?.nvidia?.reasoningEffort as NvidiaReasoningEffort | undefined

    return {
      temperature: this.options.temperature,
      topP: this.options.topP,
      maxOutputTokens: this.options.maxOutputTokens,
      stream: this.options.stream,
      providerOptions: effort
        ? {
            nvidia: {
              reasoningEffort: effort,
            },
          }
        : undefined,
    }
  }

  protected getProvider(options: CallChatCompletionOptions, fetchFunction?: FetchFunction) {
    const effort = options.providerOptions?.nvidia?.reasoningEffort as NvidiaReasoningEffort | undefined

    return createOpenAICompatible({
      name: 'nvidiaNim',
      apiKey: this.options.apiKey,
      baseURL: this.options.apiHost,
      fetch: fetchFunction,
      transformRequestBody: (requestBody) =>
        applyNvidiaReasoningProfile(requestBody, this.options.model.modelId, effort),
    })
  }

  protected getChatModel(options: CallChatCompletionOptions) {
    const { apiHost, apiPath } = this.options
    const provider = this.getProvider(options, (_input, init) =>
      createFetchWithProxy(this.options.useProxy, this.dependencies)(`${apiHost}${apiPath}`, init)
    )

    return wrapLanguageModel({
      model: provider.languageModel(this.options.model.modelId),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    })
  }

  public async listModels(): Promise<ProviderModelInfo[]> {
    const models = await fetchRemoteModels(
      {
        apiHost: this.options.apiHost,
        apiKey: this.options.apiKey,
        useProxy: this.options.useProxy,
      },
      this.dependencies
    )

    return models.map((model) => {
      if (!isNvidiaReasoningModel(model.modelId)) return model
      const capabilities = [...new Set([...(model.capabilities || []), 'reasoning' as const])]
      return { ...model, capabilities }
    })
  }

  protected getImageModel() {
    return null
  }
}
