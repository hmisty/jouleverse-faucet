# Nginx 部署指南

## 📋 文件说明

- `nginx.conf` - Nginx 主配置文件（域名：faucet.f7t.cn）

## 🚀 部署步骤

### 1. 复制配置文件到服务器

```bash
# 在本地执行
scp -i ~/.ssh/cbotbigwhite_ed25519 \
  /Users/clawdbot/workspace/dabai/jouleverse-faucet/nginx.conf \
  dabai@xq.liujiaolian.com:/home/dabai/jouleverse-faucet/nginx.conf
```

### 2. 安装到 Nginx 目录

在服务器上执行：

```bash
# 复制到 sites-available
sudo cp /home/dabai/jouleverse-faucet/nginx.conf \
  /etc/nginx/sites-available/faucet-f7t.conf

# 创建符号链接
sudo ln -sf /etc/nginx/sites-available/faucet-f7t.conf \
  /etc/nginx/sites-enabled/faucet-f7t.conf

# 删除旧的配置
sudo rm -f /etc/nginx/sites-enabled/faucet-liujiaolian.conf 2>/dev/null
sudo rm -f /etc/nginx/sites-enabled/faucet-blockcoach.conf 2>/dev/null

# 测试配置
sudo nginx -t
```

### 3. 重启 Nginx

```bash
sudo systemctl restart nginx
# 或
sudo service nginx restart
```

### 4. 配置 DNS

在域名管理面板（阿里云/Cloudflare等）添加 A 记录：

```
域名：faucet.f7t.cn
类型：A
值：47.95.200.73（服务器 IP）
```

### 5. 测试访问

```bash
# 本地测试
curl http://faucet.f7t.cn/

# 测试 API
curl http://faucet.f7t.cn/api/check/0xBE7ba958c5b5b72669395f9C667BAE5e7d698373
```

## 🔧 配置说明

### 生产环境（推荐）

修改 `nginx.conf`，取消以下注释：

```nginx
# 前端静态文件
root /home/dabai/jouleverse-faucet/frontend/dist;
index index.html;
try_files $uri $uri/ /index.html;
```

然后在前端项目目录执行：

```bash
cd /home/dabai/jouleverse-faucet/frontend
export PATH=~/tools/node-v22.12.0-linux-x64/bin:$PATH
npm run build
```

### HTTPS 配置（可选）

使用 Let's Encrypt 免费证书：

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d faucet.f7t.cn

# 自动续期
sudo certbot renew --dry-run
```

## 📊 监控

```bash
# 查看 Nginx 日志
sudo tail -f /var/log/nginx/faucet-f7t-access.log
sudo tail -f /var/log/nginx/faucet-f7t-error.log

# 查看 Nginx 状态
sudo systemctl status nginx

# 查看监听端口
sudo netstat -tlnp | grep nginx
```

## 🔗 相关链接

- Nginx 官方文档：https://nginx.org/en/docs/
- Let's Encrypt：https://letsencrypt.org/

---

_创建时间：2026-03-17_
