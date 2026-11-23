import * as sdk from '../src'
import {
  check,
  getJustification,
  justificationExists,
  putJustification,
} from '../src'
import { ConfigurationError } from '../src/errors'
import {
  DOCUMENT_ID,
  fillEnv,
  resetDriver,
  RUSTFS_ENV_KEYS,
  validJustification,
} from './helpers'

afterEach(() => {
  resetDriver()
})

describe('configuración del cliente', () => {
  it.each([...RUSTFS_ENV_KEYS])(
    'lanza ConfigurationError si falta %s y no habla con S3',
    async (missing) => {
      fillEnv()
      delete process.env[missing]

      await expect(check()).rejects.toBeInstanceOf(ConfigurationError)
    },
  )

  it.each([...RUSTFS_ENV_KEYS])(
    'lanza ConfigurationError si %s está vacío',
    async (key) => {
      fillEnv()
      process.env[key] = ''

      await expect(check()).rejects.toBeInstanceOf(ConfigurationError)
    },
  )

  it('lanza ConfigurationError en put, get y exists si falta una variable y no hay driver', async () => {
    fillEnv()
    delete process.env.RUSTFS_ENDPOINT

    await expect(
      putJustification({ justification: validJustification }),
    ).rejects.toBeInstanceOf(ConfigurationError)
    await expect(getJustification({ id: DOCUMENT_ID })).rejects.toBeInstanceOf(
      ConfigurationError,
    )
    await expect(
      justificationExists({ id: DOCUMENT_ID }),
    ).rejects.toBeInstanceOf(ConfigurationError)
  })

  it('no exporta S3Client ni substituteSend', () => {
    expect(sdk).not.toHaveProperty('S3Client')
    expect(sdk).not.toHaveProperty('substituteSend')
    expect(sdk).not.toHaveProperty('resetClient')
  })
})
