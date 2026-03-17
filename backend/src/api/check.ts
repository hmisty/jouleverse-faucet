import { Router, Request, Response } from 'express'
import { checkAddressBalance } from '../lib/blockchain'

const router = Router()

// GET /api/check/:address - 检查地址余额
router.get('/check/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params

    // 验证地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        error: 'Invalid address format'
      })
    }

    const balanceInfo = await checkAddressBalance(address as `0x${string}`)

    res.json({
      balance: balanceInfo.balanceInJ,
      hasBalance: balanceInfo.hasBalance
    })
  } catch (error: any) {
    console.error('Error checking address balance:', error)
    res.status(500).json({
      error: 'Failed to check address balance',
      message: error.message
    })
  }
})

export default router
