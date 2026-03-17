import { Router, Request, Response } from 'express'
import { getTransactionStatus } from '../lib/blockchain'

const router = Router()

// GET /api/status/:txHash - 查询交易状态
router.get('/status/:txHash', async (req: Request, res: Response) => {
  try {
    const { txHash } = req.params

    // 验证交易哈希格式
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return res.status(400).json({
        error: 'Invalid transaction hash format'
      })
    }

    const statusInfo = await getTransactionStatus(txHash as `0x${string}`)

    res.json(statusInfo)
  } catch (error: any) {
    console.error('Error getting transaction status:', error)
    res.status(500).json({
      error: 'Failed to get transaction status',
      message: error.message
    })
  }
})

export default router
