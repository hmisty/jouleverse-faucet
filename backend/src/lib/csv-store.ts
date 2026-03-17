import fs from 'fs/promises'
import { parse } from 'csv-parse/sync'
import { createObjectCsvWriter } from 'csv-writer'

const CSV_PATH = './faucet.csv'

interface ClaimRecord {
  emailHash: string
  email: string
  address: string
  txHash: string
  timestamp: string
}

/**
 * 确保CSV文件存在并创建header
 */
async function ensureCsvFile() {
  try {
    await fs.access(CSV_PATH)
  } catch {
    // 文件不存在，创建带header的空文件
    const csvWriter = createObjectCsvWriter({
      path: CSV_PATH,
      header: [
        { id: 'emailHash', title: 'EMAIL_HASH' },
        { id: 'email', title: 'EMAIL' },
        { id: 'address', title: 'ADDRESS' },
        { id: 'txHash', title: 'TX_HASH' },
        { id: 'timestamp', title: 'TIMESTAMP' }
      ],
      append: false
    })
    await csvWriter.writeRecords([])
  }
}

/**
 * 记录领取信息到CSV
 */
export async function recordClaim(record: Omit<ClaimRecord, 'timestamp'>): Promise<void> {
  await ensureCsvFile()

  const csvWriter = createObjectCsvWriter({
    path: CSV_PATH,
    header: [
      { id: 'emailHash', title: 'EMAIL_HASH' },
      { id: 'email', title: 'EMAIL' },
      { id: 'address', title: 'ADDRESS' },
      { id: 'txHash', title: 'TX_HASH' },
      { id: 'timestamp', title: 'TIMESTAMP' }
    ],
    append: true
  })

  const recordWithTimestamp = {
    ...record,
    timestamp: new Date().toISOString()
  }

  await csvWriter.writeRecords([recordWithTimestamp])
}

/**
 * 检查email hash是否已领取过
 */
export async function checkClaimed(emailHash: string): Promise<boolean> {
  try {
    await fs.access(CSV_PATH)
  } catch {
    // 文件不存在，视为未领取
    return false
  }

  const content = await fs.readFile(CSV_PATH, 'utf-8')
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true
  })

  return records.some((record: any) => record.EMAIL_HASH === emailHash)
}

/**
 * 检查地址是否已领取过
 */
export async function checkAddressClaimed(address: string): Promise<boolean> {
  try {
    await fs.access(CSV_PATH)
  } catch {
    return false
  }

  const content = await fs.readFile(CSV_PATH, 'utf-8')
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true
  })

  return records.some((record: any) => record.ADDRESS.toLowerCase() === address.toLowerCase())
}
