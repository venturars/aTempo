import * as sdk from '../src'
import {
  check,
  getJustification,
  justificationExists,
  putJustification,
} from '../src'
import { ConfigurationError } from '@atempo/errors'
import { endpointFromEnv } from '../src/rustfs/client'
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

  it.each(['true', 'TRUE', 'True', '1', ' true '])(
    'RUSTFS_USE_SSL=%p usa https',
    (value) => {
      fillEnv()
      process.env.RUSTFS_USE_SSL = value
      expect(endpointFromEnv()).toBe('https://127.0.0.1:9000')
    },
  )

  it.each([
    'http://127.0.0.1:9000', // el valor de rustfs/.env.example
    '127.0.0.1:9000',
    'rustfs/bucket',
  ])(
    'RUSTFS_ENDPOINT=%p lanza ConfigurationError: tiene que ser solo el host',
    (value) => {
      fillEnv()
      process.env.RUSTFS_ENDPOINT = value
      expect(() => endpointFromEnv()).toThrow(ConfigurationError)
    },
  )

  it('recorta espacios en el host y el puerto', () => {
    fillEnv()
    process.env.RUSTFS_ENDPOINT = ' rustfs '
    process.env.RUSTFS_PORT = ' 9000 '
    expect(endpointFromEnv()).toBe('http://rustfs:9000')
  })

  it.each(['abc', '0', '65536', '90.5', '-1'])(
    'RUSTFS_PORT=%p lanza ConfigurationError',
    (value) => {
      fillEnv()
      process.env.RUSTFS_PORT = value
      expect(() => endpointFromEnv()).toThrow(ConfigurationError)
    },
  )

  it.each(['false', 'FALSE', '0'])('RUSTFS_USE_SSL=%p usa http', (value) => {
    fillEnv()
    process.env.RUSTFS_USE_SSL = value
    expect(endpointFromEnv()).toBe('http://127.0.0.1:9000')
  })

  it.each(['yes', 'on', 'ture'])(
    'RUSTFS_USE_SSL=%p lanza ConfigurationError en lugar de usar http',
    (value) => {
      fillEnv()
      process.env.RUSTFS_USE_SSL = value
      expect(() => endpointFromEnv()).toThrow(ConfigurationError)
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
