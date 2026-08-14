import type { CallChatCompletionOptions } from '@shared/models/types'
import type { ModelDependencies } from '@shared/types/adapters'
import type { ProviderModelInfo } from '@shared/types/settings'
import type { SentryScope } from '@shared/utils/sentry_adapter'
import { describe, expect, it, vi } from 'vitest'
import CustomOpenAIResponses from './custom-openai-responses'

class TestCustomOpenAIResponses extends CustomOpenAIResponses {
  public exposeCallSettings(options: CallChatCompletionOptions = {}) {
    return this.getCallSettings(options)
  }
}

function createDependencies(): ModelDependencies {
  return {
    request: {
      apiRequest: vi.fn(),
      fetchWithOptions: vi.fn(),
    },
    storage: {
      saveImage: vi.fn(),
      getImage: vi.fn(),
    },
    sentry: {
      captureException: vi.fn(),
      withScope: vi.fn((callback: (scope: SentryScope) => void) =>
        callback({
          setTag: vi.fn(),
          setExtra: vi.fn(),
        })
      ),
    },
    getRemoteConfig: vi.fn(),
    platformType: 'desktop',
  }
}

function createModel(capabilities: ProviderModelInfo['capabilities'], modelId = 'vendor-reasoning-model') {
  return new TestCustomOpenAIResponses(
    {
      apiKey: 'test-key',
      apiHost: 'https://api.example.com/v1',
      apiPath: '/responses',
      model: {
        modelId,
        type: 'chat',
        capabilities,
      },
    },
    createDependencies()
  )
}

describe('CustomOpenAIResponses call settings', () => {
  it('forces capability-marked custom models into Responses reasoning mode', () => {
    const model = createModel(['reasoning'])

    expect(
      model.exposeCallSettings({
        providerOptions: { openai: { reasoningEffort: 'xhigh' } },
      }).providerOptions
    ).toEqual({
      openai: {
        reasoningEffort: 'xhigh',
        forceReasoning: true,
        store: false,
      },
    })
  })

  it('keeps stateless mode and uses the stable session ID as a cache key', () => {
    const model = createModel([])

    expect(model.exposeCallSettings({ sessionId: 'session-789' }).providerOptions).toEqual({
      openai: {
        promptCacheKey: 'session-789',
        store: false,
      },
    })
  })
})
