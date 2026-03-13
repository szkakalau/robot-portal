# Robot Portal

全栈 AI 机器人门户（Next.js 14 + FastAPI + Supabase + DeepSeek）

## 环境变量

项目根新建 `.env`（不要提交到 Git）：

```
DEEPSEEK_API_KEY=你的Key
DEEPSEEK_API_BASE=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
NEXT_PUBLIC_API_BASE=http://localhost:8000
SUPABASE_URL=
SUPABASE_KEY=
ALLOWED_ORIGINS=http://localhost:3000
RSS_EXTRA_FEEDS=
NEWS_REVIEW_LIMIT=3
ROBOT_TARGET_COUNT=200
```

## 本地开发

后端：

```
pip3 install -r robot-portal/backend/requirements.txt
uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload --app-dir robot-portal
```

自动化脚本：

```
python3 robot-portal/run.py
```

脚本会自动执行：

```
新闻抓取 -> 文章生成 -> Top200机器人数据库入库
```

生产前一键验收：

```
cd robot-portal
python3 preflight_check.py
```

可选参数：

```
python3 preflight_check.py \
  --api-base http://localhost:8000 \
  --frontend-base http://localhost:3000 \
  --task-token <TASK_TOKEN> \
  --frontend-dir frontend
```

前端：

```
cd robot-portal/frontend
npm install
npm run dev
```

## 部署到 Render（后端）

1. 新建 Web Service，连接仓库
2. Build Command: `pip3 install -r backend/requirements.txt`
3. Start Command: `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`
4. 环境变量：
   - `PYTHON_VERSION=3.11.11`（重要，避免 Render 默认 Python 3.14 触发 pydantic-core 构建失败）
   - `DEEPSEEK_API_KEY`
   - `DEEPSEEK_API_BASE=https://api.deepseek.com`
   - `DEEPSEEK_MODEL=deepseek-chat`
   - `SUPABASE_URL`（可选）
   - `SUPABASE_KEY`（可选）
   - `ALLOWED_ORIGINS=https://你的vercel域名.vercel.app`
5. 验证：访问 `/health` 返回 `{"ok": true}`
6. 首次接 Supabase 时先执行 `database/schema.sql`，确保 `robots/articles/news_sources` 表已创建

全免费定时任务（推荐）：

1. 使用仓库内的 GitHub Actions 工作流：`.github/workflows/daily-trigger.yml`
2. 在 GitHub 仓库 Settings → Secrets and variables → Actions 添加：
   - `RENDER_API_BASE=https://你的后端域名.onrender.com`
   - `RENDER_TASK_TOKEN=<你的TASK_TOKEN>`
3. 工作流会每天触发 `POST /tasks/run-daily`
4. 也可在 Actions 页面手动点击 `Run workflow`

使用蓝图一键部署（推荐）：

1. Render Dashboard → Blueprints → New Blueprint
2. 选择仓库并识别 `render.yaml`
3. 在 Blueprint 界面为 `DEEPSEEK_API_KEY`、`DEEPSEEK_API_BASE`、`DEEPSEEK_MODEL`、`ALLOWED_ORIGINS`、`TASK_TOKEN` 填值
   - `PYTHON_VERSION` 已在 `render.yaml` 固定为 `3.11.11`
   - 全免费快速通过建议：
     - `DEEPSEEK_API_BASE=https://api.deepseek.com`
     - `DEEPSEEK_MODEL=deepseek-chat`
     - `ALLOWED_ORIGINS=*`（后续再改成你的 Vercel 域名）
     - `TASK_TOKEN` 填随机字符串
4. Apply Blueprint 后仅创建免费 Web 服务

手动触发每日任务（受保护）：

- 端点：`POST /tasks/run-daily`
- 保护：设置后端环境变量 `TASK_TOKEN`，调用时需在请求头带 `X-Task-Token: <TOKEN>`（或使用查询参数 `?token=<TOKEN>`）
- 内容：会自动写入新闻、文章和 Top200 机器人种子数据
- 示例（本地，如未设置 `TASK_TOKEN` 则直接可用）：
  ```
  curl -X POST http://localhost:8000/tasks/run-daily
  ```
- 示例（生产）：
  ```
  curl -X POST https://<your-api>.onrender.com/tasks/run-daily \
    -H "X-Task-Token: <YOUR_TASK_TOKEN>"
  ```

RSS 聚合与深度解读任务：

- 一键全流程：`POST /tasks/run-rss-cycle`
- 仅新闻刷新：`POST /tasks/run-news`
- 仅深度解读：`POST /tasks/run-reviews-from-news?limit=3`
- 仅机器人关联：`POST /tasks/run-robot-associations`

示例（生产）：

```
curl -X POST https://<your-api>.onrender.com/tasks/run-rss-cycle \
  -H "X-Task-Token: <YOUR_TASK_TOKEN>"
```

每 4 小时跑一次（Render Cron）：

- Cron：`0 */4 * * *`
- URL：`https://<your-api>.onrender.com/tasks/run-rss-cycle`
- Header：`X-Task-Token: <YOUR_TASK_TOKEN>`

机器人数据库接口：

- 列表：`GET /robots`
- 筛选参数（可选）：`category`、`company`、`q`、`min_price`、`max_price`、`limit`
- 详情：`GET /robot/by-name/{name}`（前端会自动 URL 编码）
- 示例：
  ```
  curl "http://localhost:8000/robots?category=robot%20dog&min_price=1000&limit=20"
  curl "http://localhost:8000/robot/by-name/Unitree%20Go2%20Robot%20Dog"
  ```

## 部署到 Vercel（前端）

1. 新建 Project，Root Directory 选择 `robot-portal/frontend`
2. 环境变量：
   - `NEXT_PUBLIC_API_BASE=https://你的后端域名.onrender.com`
3. 构建完成后访问 Vercel 域名
4. 可选：已包含最简 `vercel.json`，Vercel 会自动识别 Next.js

## 常见问题

- 跨域：在后端设置 `ALLOWED_ORIGINS` 为 Vercel 域名
- 密钥安全：只在后端配置 `DEEPSEEK_API_KEY`，不要暴露到前端或 Git
- 构建失败：前端需要 Node 18+，后端 Python 3.10+
