import OpenAI from 'openai'

export function getAzureOpenAIClient(): OpenAI {
  const apiKey   = process.env.AZURE_OPENAI_API_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  if (!apiKey || !endpoint)
    throw new Error('AZURE_OPENAI_API_KEY e AZURE_OPENAI_ENDPOINT são obrigatórios')
  return new OpenAI({ baseURL: endpoint, apiKey })
}

export const DEPLOYMENT =
  process.env.AZURE_OPENAI_DEPLOYMENT_GPT4O_MINI ?? 'gpt-4o-mini'
