import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import checkRouter from './api/check'
import claimRouter from './api/claim'
import statusRouter from './api/status'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API 路由
app.use('/api', checkRouter)
app.use('/api', claimRouter)
app.use('/api', statusRouter)

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error', message: err.message })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        Jouleverse Faucet API Server                       ║
║                                                            ║
║        🚀 Server running on port ${PORT}                        ║
║        🔗 RPC: https://rpc.jnsdao.com:8503               ║
║        💰 Faucet Amount: ${process.env.FAUCET_AMOUNT || '0.05'} J                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `)

  console.log('API Endpoints:')
  console.log(`  GET  /health                 - Health check`)
  console.log(`  GET  /api/check/:address     - Check address balance`)
  console.log(`  POST /api/claim              - Claim gas`)
  console.log(`  GET  /api/status/:txHash     - Get transaction status`)
  console.log()
})
