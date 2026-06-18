# 部署指南

## 环境要求

- Linux 服务器（Ubuntu 20.04+ / CentOS 7+ / Debian 11+）
- Docker Engine 24+ 及 Docker Compose v2
- 至少 2GB 内存，20GB 磁盘空间

## 快速部署

### 1. 安装 Docker 和 Docker Compose

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker

# 验证版本
docker --version
docker compose version
```

### 2. 在服务器上创建项目目录

```bash
mkdir -p /opt/medlink-exam
cd /opt/medlink-exam
```

### 3. 上传项目文件

方式 A — 从 Git 仓库克隆：
```bash
git clone <你的仓库地址> .
```

方式 B — 使用 SCP 从本地上传：
```bash
# 在本地开发机器上压缩（排除 node_modules / .next）
cd d:/SourceCode/medical_online_diagnosis_exercise
tar czf medlink.tar.gz --exclude=node_modules --exclude=.next --exclude=.git .

# 上传到服务器
scp medlink.tar.gz user@your-server:/opt/medlink-exam/
ssh user@your-server
cd /opt/medlink-exam
tar xzf medlink.tar.gz
```

### 4. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，务必修改 JWT_SECRET 为随机字符串
nano .env
```

**重要**：生产环境中 `JWT_SECRET` 必须修改为一个随机的、不可猜测的字符串。

### 5. 启动服务

```bash
docker compose up -d --build
```

首次启动会自动完成以下步骤：
- 拉取 PostgreSQL 16 镜像
- 构建 Node.js 应用镜像
- 创建数据库表结构
- 导入种子数据（148 道题、35 个科室、4 个默认角色、管理员账号）

### 6. 验证部署

```bash
# 查看容器状态
docker compose ps

# 查看应用日志
docker compose logs -f app

# 测试访问
curl http://localhost:3000/login
```

看到登录页面即部署成功。

### 7. 配置 Nginx 反向代理（可选，用于域名 + HTTPS）

```nginx
server {
    listen 80;
    server_name exam.your-hospital.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

建议使用 Certbot 配置 HTTPS：
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d exam.your-hospital.com
```

## 默认账号

| 角色 | 姓名 | 手机号 | 科室 |
|------|------|--------|------|
| 管理员 | 管理员 | admin | 医务处 |

普通用户需自行注册。

## 常用运维命令

```bash
# 查看日志
docker compose logs -f app

# 查看数据库日志
docker compose logs -f db

# 重启应用
docker compose restart app

# 重新构建并启动（代码更新后）
docker compose up -d --build app

# 停止服务
docker compose down

# 停止服务并删除数据卷（⚠️ 会删除所有考试数据）
docker compose down -v

# 进入数据库交互界面
docker compose exec db psql -U medlink -d medlink_exam

# 手动执行数据库种子（如果数据异常）
docker compose exec app npx tsx prisma/seed.ts
```

## 更新应用

```bash
cd /opt/medlink-exam

# 拉取最新代码
git pull

# 重新构建并启动
docker compose up -d --build app

# 查看日志确认启动正常
docker compose logs -f app
```

## 备份与恢复

### 备份数据库

```bash
docker compose exec db pg_dump -U medlink medlink_exam > backup_$(date +%Y%m%d).sql
```

### 恢复数据库

```bash
# 停止应用
docker compose stop app

# 恢复数据
cat backup_20260618.sql | docker compose exec -T db psql -U medlink -d medlink_exam

# 启动应用
docker compose start app
```

## 端口占用说明

默认使用端口：
- `3000` — 应用 Web 界面
- `5432` — PostgreSQL 数据库（仅内部访问）

如需修改端口，编辑 `docker-compose.yml` 中的 `ports` 配置。

## 常见问题

**Q: 容器启动后访问返回 502**
A: 数据库可能还未准备就绪，等待 10-15 秒后重试。如果持续失败，检查日志：`docker compose logs app`

**Q: 如何修改及格分数线？**
A: 编辑 `.env` 中的 `PASS_THRESHOLD`，然后 `docker compose restart app`

**Q: 如何重置所有数据？**
A: `docker compose down -v && docker compose up -d --build`（⚠️ 会删除全部数据）

**Q: 日志中出现 EPERM 错误**
A: 这是 Windows 文件系统的已知问题，在 Linux 服务器上部署不会出现。如果本地 Docker Desktop 测试遇到，忽略即可。
