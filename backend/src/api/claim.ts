import { Router, Request, Response } from 'express'
import { sendGas } from '../lib/blockchain'
import { hashEmail } from '../lib/email-hash'
import { recordClaim, checkClaimed, checkAddressClaimed } from '../lib/csv-store'

const router = Router()

interface ClaimRequest {
  address: string
  email: string
}

// POST /api/claim - 申请领取gas
router.post('/claim', async (req: Request, res: Response) => {
  try {
    const { address, email }: ClaimRequest = req.body

    // 验证输入
    if (!address || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: address and email'
      })
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address format'
      })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      })
    }

    // 检查email hash是否已领取
    const emailHash = hashEmail(email)
    const isEmailClaimed = await checkClaimed(emailHash)

    if (isEmailClaimed) {
      return res.status(400).json({
        success: false,
        message: 'This email has already claimed. Each email can only claim once.'
      })
    }

    // 检查地址是否已领取
    const isAddressClaimed = await checkAddressClaimed(address)
    if (isAddressClaimed) {
      return res.status(400).json({
        success: false,
        message: 'This address has already claimed.'
      })
    }

    // 发送gas
    const amountJ = process.env.FAUCET_AMOUNT || '0.05'
    const txHash = await sendGas(address as `0x${string}`, amountJ)

    // 记录到CSV
    await recordClaim({
      emailHash,
      email,
      address,
      txHash: txHash
    })

    res.json({
      success: true,
      txHash: txHash,
      amount: amountJ + ' J',
      message: 'Gas sent successfully!'
    })
  } catch (error: any) {
    console.error('Error processing claim:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process claim',
      error: error.message
    })
  }
})

export default router
