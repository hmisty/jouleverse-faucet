import { createHash } from 'crypto'

/**
 * 计算email的SHA-256 hash
 * @param email - 邮箱地址
 * @returns hex格式的hash值
 */
export function hashEmail(email: string): string {
  // 转小写后hash
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}
