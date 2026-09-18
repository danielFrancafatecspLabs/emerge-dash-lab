import OpenAI from 'openai'
import https from 'https'

export function getAzureOpenAIClient(): OpenAI {
  const apiKey   = process.env.AZURE_OPENAI_API_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  if (!apiKey || !endpoint)
    throw new Error('AZURE_OPENAI_API_KEY e AZURE_OPENAI_ENDPOINT são obrigatórios')
  return new OpenAI({ baseURL: endpoint, apiKey })
}

export const DEPLOYMENT =
  process.env.AZURE_OPENAI_DEPLOYMENT_GPT4O_MINI ?? 'gpt-4o-mini'

/**
 * Cliente para proxy LiteLLM com suporte a certificado self-signed.
 * Variáveis de ambiente: LLM_API_KEY, LLM_API_BASE, LLM_MODEL.
 */
export function getLiteLLMClient(): OpenAI {
  const apiKey   = process.env.LLM_API_KEY
  const endpoint = process.env.LLM_API_BASE
  if (!apiKey || !endpoint)
    throw new Error('LLM_API_KEY e LLM_API_BASE são obrigatórios')
  const isHttps = endpoint.startsWith('https')
  return new OpenAI({
    baseURL: endpoint,
    apiKey,
    httpAgent: isHttps
      ? new https.Agent({ rejectUnauthorized: false })
      : undefined,
  })
}

export const DEPLOYMENT_LLM =
  process.env.LLM_MODEL ?? 'gpt-4o-mini'
